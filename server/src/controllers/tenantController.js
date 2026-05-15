import bcrypt from "bcryptjs";
import { db } from "../config/mongo.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/errors.js";
import { signToken } from "../utils/token.js";
import { defaultModuleAccessRoles } from "./settingsController.js";

// ── Helpers ────────────────────────────────────────────────────────────────
const slugify = (str) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

const uniqueSlug = async (base) => {
  let slug = slugify(base);
  let suffix = 0;
  while (await db.establishment.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${slugify(base)}-${suffix}`;
  }
  return slug;
};

const defaultSettings = (establishmentId) => [
  { key: "orderVisibilityRoles",  value: ["SUPER_ADMIN", "MANAGER", "CASHIER"] },
  { key: "tableManagementRoles",  value: ["SUPER_ADMIN", "MANAGER"] },
  { key: "customerManagementRoles", value: ["SUPER_ADMIN", "MANAGER"] },
  { key: "productManagementRoles",  value: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"] },
  { key: "stockManagementRoles",    value: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"] },
  { key: "roleAssignmentRoles",     value: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"] },
  { key: "moduleAccessRoles",       value: defaultModuleAccessRoles }
].map((s) => ({ ...s, establishmentId }));

const DEFAULT_CATEGORIES = [
  { name: "Boissons chaudes", sortOrder: 1 },
  { name: "Boissons froides", sortOrder: 2 },
  { name: "Snacks",           sortOrder: 3 },
  { name: "Plats",            sortOrder: 4 },
  { name: "Desserts",         sortOrder: 5 }
];

const sanitizeUser = (user) => {
  const { password, ...safe } = user;
  return safe;
};

/**
 * Charge les stats réelles d'un établissement depuis MongoDB.
 * count() parallèles — fonctionne avec le wrapper custom.
 */
const loadStats = async (id) => {
  const [users, orders, products, tables, customers, stocks, paymentsAgg, lastOrder] =
    await Promise.all([
      db.user.count({ where: { establishmentId: id } }),
      db.order.count({ where: { establishmentId: id } }),
      db.product.count({ where: { establishmentId: id } }),
      db.diningTable.count({ where: { establishmentId: id } }),
      db.customer.count({ where: { establishmentId: id } }),
      db.stock.count({ where: { establishmentId: id } }),
      db.payment.aggregate({ where: { establishmentId: id }, _sum: { amount: true } }),
      db.order.findFirst({
        where: { establishmentId: id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, status: true, total: true }
      })
    ]);

  return {
    users,
    orders,
    products,
    tables,
    customers,
    stocks,
    totalRevenue: Number(paymentsAgg._sum?.amount || 0),
    lastOrder: lastOrder || null
  };
};

const tenantFootprint = (stats) =>
  Number(stats.orders || 0) +
  Number(stats.products || 0) +
  Number(stats.customers || 0) +
  Number(stats.users || 0);

const tenantHealthScore = (establishment, stats) => {
  if (!establishment.isActive) return 0;
  return Math.min(
    100,
    42 +
      Math.min(18, Number(stats.orders || 0) * 2) +
      Math.min(14, Number(stats.products || 0)) +
      Math.min(14, Number(stats.customers || 0)) +
      Math.min(12, Number(stats.users || 0) * 2)
  );
};

// ── GET /tenants — liste tous les établissements avec stats réelles ─────────
export const listTenants = asyncHandler(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page  || "1", 10));
  const limit  = Math.min(50, parseInt(req.query.limit || "20", 10));
  const search = (req.query.search || "").trim();

  // Construire le filtre de recherche
  let allEstablishments = await db.establishment.findMany({
    orderBy: { createdAt: "desc" }
  });

  // Filtre texte côté JS (le wrapper MongoDB custom ne supporte pas OR/contains)
  if (search) {
    const q = search.toLowerCase();
    allEstablishments = allEstablishments.filter(
      (e) =>
        (e.name || "").toLowerCase().includes(q) ||
        (e.slug || "").toLowerCase().includes(q) ||
        (e.email || "").toLowerCase().includes(q)
    );
  }

  const statsEntries = await Promise.all(
    allEstablishments.map(async (est) => [est.id, await loadStats(est.id)])
  );
  const statsById = new Map(statsEntries);
  const total = allEstablishments.length;
  const active = allEstablishments.filter((est) => est.isActive).length;
  const usage = allEstablishments.reduce((sum, est) => sum + tenantFootprint(statsById.get(est.id) || {}), 0);
  const scale = allEstablishments.filter((est) => tenantFootprint(statsById.get(est.id) || {}) >= 120).length;
  const avgHealth = total
    ? Math.round(allEstablishments.reduce((sum, est) => sum + tenantHealthScore(est, statsById.get(est.id) || {}), 0) / total)
    : 0;
  const paginated = allEstablishments.slice((page - 1) * limit, page * limit);

  // Pour chaque établissement : charger son admin + ses stats en parallèle
  const enriched = await Promise.all(
    paginated.map(async (est) => {
      const [statsData, adminUser] = await Promise.all([
        Promise.resolve(statsById.get(est.id) || {}),
        db.user.findFirst({
          where: { establishmentId: est.id, roleName: "ADMIN_ESTABLISHMENT" },
          select: { id: true, name: true, email: true, isActive: true, createdAt: true }
        })
      ]);

      return {
        ...est,
        // stats directement sur l'objet pour simplifier le frontend
        stats: statsData,
        // admin du tenant
        users: adminUser ? [adminUser] : []
      };
    })
  );

  res.json({
    success: true,
    data: enriched,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
      summary: {
        active,
        inactive: total - active,
        usage,
        scale,
        avgHealth
      }
    }
  });
});

// ── GET /tenants/:id — détail d'un établissement ───────────────────────────
export const getTenant = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const establishment = await db.establishment.findUnique({ where: { id } });
  if (!establishment) throw new ApiError(404, "Établissement introuvable.");

  const [users, settings] = await Promise.all([
    db.user.findMany({
      where: { establishmentId: id },
      select: { id: true, name: true, email: true, roleName: true, isActive: true, createdAt: true }
    }),
    db.setting.findMany({
      where: { establishmentId: id },
      select: { key: true, value: true }
    })
  ]);

  res.json({ success: true, data: { ...establishment, users, settings } });
});

// ── POST /tenants/provision — crée un nouveau tenant complet ───────────────
export const provisionTenant = asyncHandler(async (req, res) => {
  const {
    name, type = "CAFE_RESTAURANT", address, phone, email,
    primaryColor = "#C8A96A", openingHours, logo,
    adminName, adminEmail, adminPassword,
    seedCategories = true, seedTables = false, tableCount = 0
  } = req.body;

  if (!name?.trim())       throw new ApiError(400, "Le nom de l'établissement est requis.");
  if (!adminName?.trim())  throw new ApiError(400, "Le nom de l'admin est requis.");
  if (!adminEmail?.trim()) throw new ApiError(400, "L'email de l'admin est requis.");
  if (!adminPassword || adminPassword.length < 8)
    throw new ApiError(400, "Le mot de passe doit avoir au moins 8 caractères.");

  const validTypes = ["CAFE", "RESTAURANT", "CAFE_RESTAURANT"];
  if (!validTypes.includes(type))
    throw new ApiError(400, `Type invalide. Valeurs acceptées : ${validTypes.join(", ")}`);

  const existingUser = await db.user.findUnique({ where: { email: adminEmail } });
  if (existingUser) throw new ApiError(409, "Cet email admin est déjà utilisé.");

  // 1. Créer l'établissement
  const slug = await uniqueSlug(name);
  const establishment = await db.establishment.create({
    data: {
      name: name.trim(), slug, type,
      address: address || null, phone: phone || null,
      email: email || null, primaryColor: primaryColor || "#C8A96A",
      openingHours: openingHours || null, logo: logo || null,
      isActive: true
    }
  });

  // 2. Upsert rôle ADMIN_ESTABLISHMENT
  const adminRole = await db.role.upsert({
    where: { name: "ADMIN_ESTABLISHMENT" },
    update: {},
    create: { name: "ADMIN_ESTABLISHMENT", description: "Admin etablissement" }
  });

  // 3. Créer l'admin
  const hashed = await bcrypt.hash(adminPassword, 12);
  const adminUser = await db.user.create({
    data: {
      name: adminName.trim(),
      email: adminEmail.trim().toLowerCase(),
      password: hashed,
      roleName: "ADMIN_ESTABLISHMENT",
      roleId: adminRole.id,
      establishmentId: establishment.id,
      isActive: true
    }
  });

  // 4. Settings par défaut
  await db.setting.createMany({
    data: defaultSettings(establishment.id),
    skipDuplicates: true
  });

  // 5. Catégories seed
  if (seedCategories) {
    await db.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({
        ...c, establishmentId: establishment.id, isActive: true
      })),
      skipDuplicates: true
    });
  }

  // 6. Tables seed
  if (seedTables && tableCount > 0) {
    const count = Math.min(parseInt(tableCount, 10) || 0, 100);
    await db.diningTable.createMany({
      data: Array.from({ length: count }, (_, i) => ({
        number:          `T${String(i + 1).padStart(2, "0")}`,
        capacity:        4,
        zone:            i < Math.ceil(count / 2) ? "Intérieur" : "Terrasse",
        status:          "FREE",
        shape:           "round",
        x:               12 + (i % 4) * 22,
        y:               18 + Math.floor(i / 4) * 24,
        qrCode:          `https://app.example.com/menu?table=T${String(i + 1).padStart(2, "0")}&est=${establishment.slug}`,
        establishmentId: establishment.id
      })),
      skipDuplicates: true
    });
  }

  const token = signToken({ ...adminUser, role: adminRole, establishment });

  res.status(201).json({
    success: true,
    message: `Établissement "${establishment.name}" créé avec succès.`,
    data: {
      establishment,
      admin: sanitizeUser(adminUser),
      loginToken: token
    }
  });
});

// ── PUT /tenants/:id ───────────────────────────────────────────────────────
export const updateTenant = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, type, address, phone, email, primaryColor, openingHours, logo, isActive } = req.body;

  const existing = await db.establishment.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Établissement introuvable.");

  let slug = existing.slug;
  if (name && name.trim() !== existing.name) slug = await uniqueSlug(name);

  const updated = await db.establishment.update({
    where: { id },
    data: {
      ...(name         && { name: name.trim(), slug }),
      ...(type         && { type }),
      ...(address      !== undefined && { address }),
      ...(phone        !== undefined && { phone }),
      ...(email        !== undefined && { email }),
      ...(primaryColor !== undefined && { primaryColor }),
      ...(openingHours !== undefined && { openingHours }),
      ...(logo         !== undefined && { logo }),
      ...(isActive     !== undefined && { isActive: Boolean(isActive) })
    }
  });

  res.json({ success: true, data: updated });
});

// ── PATCH /tenants/:id/toggle ──────────────────────────────────────────────
export const toggleTenant = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = await db.establishment.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Établissement introuvable.");

  const updated = await db.establishment.update({
    where: { id },
    data:  { isActive: !existing.isActive }
  });

  await db.user.findMany({ where: { establishmentId: id, roleName: { ne: "SUPER_ADMIN" } } })
    .then((users) =>
      Promise.all(
        users.map((u) =>
          db.user.update({ where: { id: u.id }, data: { isActive: updated.isActive } })
        )
      )
    );

  res.json({
    success: true,
    message: `Établissement ${updated.isActive ? "activé" : "désactivé"}.`,
    data: { id: updated.id, isActive: updated.isActive }
  });
});

// ── DELETE /tenants/:id ────────────────────────────────────────────────────
export const deleteTenant = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = await db.establishment.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Établissement introuvable.");

  // Supprimer toutes les données liées en parallèle
  await Promise.all([
    db.user.findMany({ where: { establishmentId: id } }).then((items) =>
      Promise.all(items.map((i) => db.user.delete({ where: { id: i.id } })))
    ),
    db.product.findMany({ where: { establishmentId: id } }).then((items) =>
      Promise.all(items.map((i) => db.product.delete({ where: { id: i.id } })))
    ),
    db.category.findMany({ where: { establishmentId: id } }).then((items) =>
      Promise.all(items.map((i) => db.category.delete({ where: { id: i.id } })))
    ),
    db.order.findMany({ where: { establishmentId: id } }).then((items) =>
      Promise.all(items.map((i) => db.order.delete({ where: { id: i.id } })))
    ),
    db.customer.findMany({ where: { establishmentId: id } }).then((items) =>
      Promise.all(items.map((i) => db.customer.delete({ where: { id: i.id } })))
    ),
    db.diningTable.findMany({ where: { establishmentId: id } }).then((items) =>
      Promise.all(items.map((i) => db.diningTable.delete({ where: { id: i.id } })))
    ),
    db.stock.findMany({ where: { establishmentId: id } }).then((items) =>
      Promise.all(items.map((i) => db.stock.delete({ where: { id: i.id } })))
    ),
    db.payment.findMany({ where: { establishmentId: id } }).then((items) =>
      Promise.all(items.map((i) => db.payment.delete({ where: { id: i.id } })))
    ),
    db.employee.findMany({ where: { establishmentId: id } }).then((items) =>
      Promise.all(items.map((i) => db.employee.delete({ where: { id: i.id } })))
    ),
    db.reservation.findMany({ where: { establishmentId: id } }).then((items) =>
      Promise.all(items.map((i) => db.reservation.delete({ where: { id: i.id } })))
    ),
    db.setting.findMany({ where: { establishmentId: id } }).then((items) =>
      Promise.all(items.map((i) => db.setting.delete({ where: { id: i.id } })))
    )
  ]);

  await db.establishment.delete({ where: { id } });

  res.json({
    success: true,
    message: `Établissement "${existing.name}" et toutes ses données supprimés.`
  });
});

// ── GET /tenants/:id/stats ─────────────────────────────────────────────────
export const getTenantStats = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = await db.establishment.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Établissement introuvable.");

  const stats = await loadStats(id);
  res.json({ success: true, data: stats });
});

// ── POST /tenants/:id/impersonate ──────────────────────────────────────────
export const impersonateTenant = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const adminUser = await db.user.findFirst({
    where: { establishmentId: id, roleName: "ADMIN_ESTABLISHMENT", isActive: true }
  });

  if (!adminUser) throw new ApiError(404, "Aucun admin actif trouvé pour cet établissement.");

  const establishment = await db.establishment.findUnique({ where: { id } });
  const role = await db.role.findUnique({ where: { name: "ADMIN_ESTABLISHMENT" } });

  const token = signToken({ ...adminUser, role, establishment });
  res.json({
    success: true,
    message: `Connexion en tant que ${adminUser.name} (${establishment?.name}).`,
    data: { token, user: sanitizeUser({ ...adminUser, establishment }) }
  });
});

// ── POST /tenants/:id/reset-admin ──────────────────────────────────────────
export const resetAdminPassword = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8)
    throw new ApiError(400, "Le nouveau mot de passe doit avoir au moins 8 caractères.");

  const adminUser = await db.user.findFirst({
    where: { establishmentId: id, roleName: "ADMIN_ESTABLISHMENT" }
  });
  if (!adminUser) throw new ApiError(404, "Aucun admin trouvé pour cet établissement.");

  const hashed = await bcrypt.hash(newPassword, 12);
  await db.user.update({ where: { id: adminUser.id }, data: { password: hashed } });

  res.json({ success: true, message: "Mot de passe réinitialisé avec succès." });
});
export const createTenantAdmin = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { adminName, adminEmail, adminPassword } = req.body;

  if (!adminName?.trim()) throw new ApiError(400, "Le nom de l'admin est requis.");
  if (!adminEmail?.trim()) throw new ApiError(400, "L'email de l'admin est requis.");
  if (!adminPassword || adminPassword.length < 8) {
    throw new ApiError(400, "Le mot de passe doit avoir au moins 8 caracteres.");
  }

  const establishment = await db.establishment.findUnique({ where: { id } });
  if (!establishment) throw new ApiError(404, "Etablissement introuvable.");

  const existingAdmin = await db.user.findFirst({
    where: { establishmentId: id, roleName: "ADMIN_ESTABLISHMENT" }
  });
  if (existingAdmin) throw new ApiError(409, "Cet etablissement possede deja un admin.");

  const email = adminEmail.trim().toLowerCase();
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) throw new ApiError(409, "Cet email est deja utilise.");

  const adminRole = await db.role.upsert({
    where: { name: "ADMIN_ESTABLISHMENT" },
    update: {},
    create: { name: "ADMIN_ESTABLISHMENT", description: "Admin etablissement" }
  });

  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  const adminUser = await db.user.create({
    data: {
      name: adminName.trim(),
      email,
      password: hashedPassword,
      roleName: "ADMIN_ESTABLISHMENT",
      roleId: adminRole.id,
      establishmentId: establishment.id,
      isActive: true
    }
  });

  res.status(201).json({
    success: true,
    message: `Admin cree pour "${establishment.name}".`,
    data: sanitizeUser(adminUser)
  });
});
