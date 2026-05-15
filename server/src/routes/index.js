import { Router } from "express";
import authRoutes from "./authRoutes.js";
import { buildCrudRouter } from "./crudRoutes.js";
import orderRoutes from "./orderRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import publicRoutes from "./publicRoutes.js";
import settingsRoutes from "./settingsRoutes.js";
import stockRoutes from "./stockRoutes.js";
import uploadRoutes from "./uploadRoutes.js";
import tenantRoutes from "./tenantRoutes.js";
import { attachReservationCustomer } from "../controllers/reservationController.js";
import { canAccessModule, canAssignRoles, canManageCustomers, canManageProducts, canManageTables } from "../controllers/settingsController.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/public", publicRoutes);

// ── Super Admin : gestion des tenants (instances SaaS) ─────────────────────
router.use("/tenants", tenantRoutes);

router.use("/establishments", buildCrudRouter("establishment", { scoped: false, canRead: (req) => canAccessModule(req, "settings") }));
router.use("/categories", buildCrudRouter("category", { include: { products: true, establishment: true }, canRead: (req) => canAccessModule(req, "products") }));
router.use("/products", buildCrudRouter("product", {
  include: { category: true, variants: true, establishment: true },
  canRead: (req) => canAccessModule(req, "products"),
  writeRoles: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "WAITER", "CASHIER", "KITCHEN", "BAR"],
  canWrite: canManageProducts
}));
router.use("/tables", buildCrudRouter("diningTable", {
  include: { assignedServer: { select: { id: true, name: true, roleName: true } }, establishment: true },
  canRead: (req) => canAccessModule(req, "tables"),
  writeRoles: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "WAITER", "CASHIER", "KITCHEN", "BAR"],
  canWrite: canManageTables
}));
router.use("/orders", orderRoutes);
router.use("/reservations", buildCrudRouter("reservation", {
  include: { table: true, customer: true, establishment: true },
  canRead: (req) => canAccessModule(req, "reservations"),
  writeRoles: ["SUPER_ADMIN", "MANAGER"],
  beforeCreate: attachReservationCustomer,
  beforeUpdate: attachReservationCustomer,
  where: (req) => {
    if (!["SUPER_ADMIN", "MANAGER"].includes(req.user?.roleName)) {
      return { id: -1 };
    }
    return {};
  }
}));
router.use("/customers", buildCrudRouter("customer", {
  include: { establishment: true },
  canRead: (req) => canAccessModule(req, "customers"),
  writeRoles: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "WAITER", "CASHIER", "KITCHEN", "BAR"],
  canWrite: canManageCustomers
}));
router.use("/employees", buildCrudRouter("employee", {
  include: { user: true, establishment: true },
  canRead: (req) => canAccessModule(req, "employees"),
  writeRoles: ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "WAITER", "CASHIER", "KITCHEN", "BAR"],
  canWrite: canAssignRoles
}));
router.use("/stocks", stockRoutes);
router.use("/uploads", uploadRoutes);
router.use("/suppliers", buildCrudRouter("supplier", { include: { establishment: true }, canRead: (req) => canAccessModule(req, "stock") }));
router.use("/deliveries", buildCrudRouter("delivery", { include: { order: true, customer: true, establishment: true }, canRead: (req) => canAccessModule(req, "orders") }));
router.use("/", paymentRoutes);
router.use("/settings", settingsRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
