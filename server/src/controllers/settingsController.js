import { db } from "../config/mongo.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const defaultOrderVisibilityRoles = ["SUPER_ADMIN", "MANAGER", "CASHIER"];
export const defaultTableManagementRoles = ["SUPER_ADMIN", "MANAGER"];
export const defaultCustomerManagementRoles = ["SUPER_ADMIN", "MANAGER"];
export const defaultProductManagementRoles = ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"];
export const defaultStockManagementRoles = ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"];
export const defaultRoleAssignmentRoles = ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"];
export const defaultModuleAccessRoles = {
  dashboard: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"],
  pos: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "WAITER", "CASHIER"],
  orders: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "WAITER", "CASHIER", "KITCHEN", "BAR"],
  kitchen: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "KITCHEN", "BAR"],
  products: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"],
  tables: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "WAITER"],
  reservations: ["SUPER_ADMIN", "MANAGER"],
  customers: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "CASHIER"],
  employees: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"],
  stock: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "KITCHEN", "BAR"],
  payments: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "CASHIER"],
  reports: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"],
  settings: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT"]
};
const allowedRoles = ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "WAITER", "CASHIER", "KITCHEN", "BAR"];
const allowedEstablishmentTypes = ["CAFE", "RESTAURANT", "CAFE_RESTAURANT"];

const establishmentIdFor = (req) => Number(req.body.establishmentId || req.query.establishmentId || req.user?.establishmentId || 1);
const settingWhere = (key, establishmentId) => ({ key_establishmentId: { key, establishmentId } });
const rolesFromSetting = (setting, fallback) => {
  const roles = Array.isArray(setting?.value) && setting.value.length ? setting.value : fallback;
  return roles.includes("SUPER_ADMIN") ? roles : ["SUPER_ADMIN", ...roles];
};
const sanitizeRoles = (roles, fallback) => {
  const cleaned = Array.isArray(roles) ? roles.filter((role) => allowedRoles.includes(role)) : fallback;
  return Array.from(new Set(["SUPER_ADMIN", ...cleaned]));
};
const normalizeModuleAccess = (value = {}) => Object.fromEntries(
  Object.entries(defaultModuleAccessRoles).map(([module, fallback]) => [
    module,
    sanitizeRoles(value?.[module], fallback)
  ])
);

// ─── Type d'établissement ─────────────────────────────────────────────────

/**
 * GET /settings/establishment-type
 * Retourne le type (CAFE | RESTAURANT | CAFE_RESTAURANT) de l'établissement.
 * Accessible à tous les rôles authentifiés.
 */
export const getEstablishmentType = asyncHandler(async (req, res) => {
  const establishmentId = establishmentIdFor(req);
  const establishment = await db.establishment.findUnique({
    where: { id: establishmentId },
    select: { id: true, type: true, name: true }
  });

  if (!establishment) {
    return res.status(404).json({ success: false, message: "Etablissement introuvable." });
  }

  res.json({ success: true, data: { type: establishment.type, name: establishment.name } });
});

/**
 * PUT /settings/establishment-type
 * Met à jour le type de l'établissement. Réservé au SUPER_ADMIN.
 */
export const updateEstablishmentType = asyncHandler(async (req, res) => {
  const establishmentId = establishmentIdFor(req);
  const { type } = req.body;

  if (!allowedEstablishmentTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Type invalide. Valeurs acceptées : ${allowedEstablishmentTypes.join(", ")}`
    });
  }

  const establishment = await db.establishment.update({
    where: { id: establishmentId },
    data: { type },
    select: { id: true, type: true, name: true }
  });

  res.json({ success: true, data: { type: establishment.type, name: establishment.name } });
});

// ─── Visibilité commandes ─────────────────────────────────────────────────

export const getOrderVisibility = asyncHandler(async (req, res) => {
  const establishmentId = establishmentIdFor(req);
  const setting = await db.setting.findFirst({
    where: { key: "orderVisibilityRoles", establishmentId }
  });
  res.json({ success: true, data: { roles: rolesFromSetting(setting, defaultOrderVisibilityRoles) } });
});

export const updateOrderVisibility = asyncHandler(async (req, res) => {
  const establishmentId = establishmentIdFor(req);
  const roles = sanitizeRoles(req.body.roles, defaultOrderVisibilityRoles);
  const setting = await db.setting.upsert({
    where: settingWhere("orderVisibilityRoles", establishmentId),
    update: { value: roles },
    create: { key: "orderVisibilityRoles", value: roles, establishmentId }
  });
  res.json({ success: true, data: { roles: setting.value } });
});

// ─── Tables ───────────────────────────────────────────────────────────────

export const getTableManagement = asyncHandler(async (req, res) => {
  const establishmentId = establishmentIdFor(req);
  const setting = await db.setting.findFirst({
    where: { key: "tableManagementRoles", establishmentId }
  });
  res.json({ success: true, data: { roles: rolesFromSetting(setting, defaultTableManagementRoles) } });
});

export const updateTableManagement = asyncHandler(async (req, res) => {
  const establishmentId = establishmentIdFor(req);
  const roles = sanitizeRoles(req.body.roles, defaultTableManagementRoles);
  const setting = await db.setting.upsert({
    where: settingWhere("tableManagementRoles", establishmentId),
    update: { value: roles },
    create: { key: "tableManagementRoles", value: roles, establishmentId }
  });
  res.json({ success: true, data: { roles: setting.value } });
});

// ─── Clients ──────────────────────────────────────────────────────────────

export const getCustomerManagement = asyncHandler(async (req, res) => {
  const establishmentId = establishmentIdFor(req);
  const setting = await db.setting.findFirst({
    where: { key: "customerManagementRoles", establishmentId }
  });
  res.json({ success: true, data: { roles: rolesFromSetting(setting, defaultCustomerManagementRoles) } });
});

export const updateCustomerManagement = asyncHandler(async (req, res) => {
  const establishmentId = establishmentIdFor(req);
  const roles = sanitizeRoles(req.body.roles, defaultCustomerManagementRoles);
  const setting = await db.setting.upsert({
    where: settingWhere("customerManagementRoles", establishmentId),
    update: { value: roles },
    create: { key: "customerManagementRoles", value: roles, establishmentId }
  });
  res.json({ success: true, data: { roles: setting.value } });
});

// ─── Produits ─────────────────────────────────────────────────────────────

export const getProductManagement = asyncHandler(async (req, res) => {
  const establishmentId = establishmentIdFor(req);
  const setting = await db.setting.findFirst({
    where: { key: "productManagementRoles", establishmentId }
  });
  res.json({ success: true, data: { roles: rolesFromSetting(setting, defaultProductManagementRoles) } });
});

export const updateProductManagement = asyncHandler(async (req, res) => {
  const establishmentId = establishmentIdFor(req);
  const roles = sanitizeRoles(req.body.roles, defaultProductManagementRoles);
  const setting = await db.setting.upsert({
    where: settingWhere("productManagementRoles", establishmentId),
    update: { value: roles },
    create: { key: "productManagementRoles", value: roles, establishmentId }
  });
  res.json({ success: true, data: { roles: setting.value } });
});

// ─── Stock ────────────────────────────────────────────────────────────────

export const getStockManagement = asyncHandler(async (req, res) => {
  const establishmentId = establishmentIdFor(req);
  const setting = await db.setting.findFirst({
    where: { key: "stockManagementRoles", establishmentId }
  });
  res.json({ success: true, data: { roles: rolesFromSetting(setting, defaultStockManagementRoles) } });
});

export const updateStockManagement = asyncHandler(async (req, res) => {
  const establishmentId = establishmentIdFor(req);
  const roles = sanitizeRoles(req.body.roles, defaultStockManagementRoles);
  const setting = await db.setting.upsert({
    where: settingWhere("stockManagementRoles", establishmentId),
    update: { value: roles },
    create: { key: "stockManagementRoles", value: roles, establishmentId }
  });
  res.json({ success: true, data: { roles: setting.value } });
});

// ─── Attribution rôles ────────────────────────────────────────────────────

export const getRoleAssignment = asyncHandler(async (req, res) => {
  const establishmentId = establishmentIdFor(req);
  const setting = await db.setting.findFirst({
    where: { key: "roleAssignmentRoles", establishmentId }
  });
  res.json({ success: true, data: { roles: rolesFromSetting(setting, defaultRoleAssignmentRoles) } });
});

export const updateRoleAssignment = asyncHandler(async (req, res) => {
  const establishmentId = establishmentIdFor(req);
  const roles = sanitizeRoles(req.body.roles, defaultRoleAssignmentRoles);
  const setting = await db.setting.upsert({
    where: settingWhere("roleAssignmentRoles", establishmentId),
    update: { value: roles },
    create: { key: "roleAssignmentRoles", value: roles, establishmentId }
  });
  res.json({ success: true, data: { roles: setting.value } });
});

// ─── Accès modules ────────────────────────────────────────────────────────

export const getModuleAccess = asyncHandler(async (req, res) => {
  const establishmentId = establishmentIdFor(req);
  const setting = await db.setting.findFirst({
    where: { key: "moduleAccessRoles", establishmentId }
  });
  res.json({ success: true, data: { modules: normalizeModuleAccess(setting?.value) } });
});

export const updateModuleAccess = asyncHandler(async (req, res) => {
  const establishmentId = establishmentIdFor(req);
  const modules = normalizeModuleAccess(req.body.modules);
  const setting = await db.setting.upsert({
    where: settingWhere("moduleAccessRoles", establishmentId),
    update: { value: modules },
    create: { key: "moduleAccessRoles", value: modules, establishmentId }
  });
  res.json({ success: true, data: { modules: normalizeModuleAccess(setting.value) } });
});

// ─── Guards utilisés dans d'autres controllers ───────────────────────────

export const canAccessModule = async (req, module) => {
  if (req.user?.roleName === "SUPER_ADMIN") return true;
  const establishmentId = establishmentIdFor(req);
  const setting = await db.setting.findFirst({
    where: { key: "moduleAccessRoles", establishmentId }
  });
  const modules = normalizeModuleAccess(setting?.value);
  return modules[module]?.includes(req.user?.roleName);
};

export const canManageTables = async (req) => {
  const establishmentId = establishmentIdFor(req);
  const setting = await db.setting.findFirst({ where: { key: "tableManagementRoles", establishmentId } });
  const roles = rolesFromSetting(setting, defaultTableManagementRoles);
  return roles.includes(req.user?.roleName);
};

export const canManageCustomers = async (req) => {
  const establishmentId = establishmentIdFor(req);
  const setting = await db.setting.findFirst({ where: { key: "customerManagementRoles", establishmentId } });
  const roles = rolesFromSetting(setting, defaultCustomerManagementRoles);
  return roles.includes(req.user?.roleName);
};

export const canManageProducts = async (req) => {
  const establishmentId = establishmentIdFor(req);
  const setting = await db.setting.findFirst({ where: { key: "productManagementRoles", establishmentId } });
  const roles = rolesFromSetting(setting, defaultProductManagementRoles);
  return roles.includes(req.user?.roleName);
};

export const canManageStocks = async (req) => {
  const establishmentId = establishmentIdFor(req);
  const setting = await db.setting.findFirst({ where: { key: "stockManagementRoles", establishmentId } });
  const roles = rolesFromSetting(setting, defaultStockManagementRoles);
  return roles.includes(req.user?.roleName);
};

export const canAssignRoles = async (req) => {
  const establishmentId = establishmentIdFor(req);
  const setting = await db.setting.findFirst({ where: { key: "roleAssignmentRoles", establishmentId } });
  const roles = rolesFromSetting(setting, defaultRoleAssignmentRoles);
  return roles.includes(req.user?.roleName);
};
