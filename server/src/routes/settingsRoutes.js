import { Router } from "express";
import {
  getCustomerManagement,
  getEstablishmentType,
  getModuleAccess,
  getOrderVisibility,
  getProductManagement,
  getRoleAssignment,
  getStockManagement,
  getTableManagement,
  updateCustomerManagement,
  updateEstablishmentType,
  updateModuleAccess,
  updateOrderVisibility,
  updateProductManagement,
  updateRoleAssignment,
  updateStockManagement,
  updateTableManagement,
} from "../controllers/settingsController.js";
import { allowRoles, protect } from "../middlewares/auth.js";

const router = Router();
const settingsManagers = ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT"];

// ─── Type d'établissement ─────────────────────────────────────────────────
// GET : accessible à tous les rôles authentifiés (navigation dépend du type)
router.get("/establishment-type", protect, getEstablishmentType);
// PUT : réservé au SUPER_ADMIN uniquement
router.put("/establishment-type", protect, allowRoles("SUPER_ADMIN"), updateEstablishmentType);

// ─── Visibilité commandes ─────────────────────────────────────────────────
router.get("/order-visibility", protect, allowRoles(...settingsManagers), getOrderVisibility);
router.put("/order-visibility", protect, allowRoles(...settingsManagers), updateOrderVisibility);

// ─── Tables ───────────────────────────────────────────────────────────────
router.get("/table-management", protect, getTableManagement);
router.put("/table-management", protect, allowRoles(...settingsManagers), updateTableManagement);

// ─── Clients ──────────────────────────────────────────────────────────────
router.get("/customer-management", protect, getCustomerManagement);
router.put("/customer-management", protect, allowRoles(...settingsManagers), updateCustomerManagement);

// ─── Produits ─────────────────────────────────────────────────────────────
router.get("/product-management", protect, getProductManagement);
router.put("/product-management", protect, allowRoles(...settingsManagers), updateProductManagement);

// ─── Stock ────────────────────────────────────────────────────────────────
router.get("/stock-management", protect, getStockManagement);
router.put("/stock-management", protect, allowRoles(...settingsManagers), updateStockManagement);

// ─── Attribution rôles ────────────────────────────────────────────────────
router.get("/role-assignment", protect, getRoleAssignment);
router.put("/role-assignment", protect, allowRoles(...settingsManagers), updateRoleAssignment);

// ─── Accès modules ────────────────────────────────────────────────────────
router.get("/module-access", protect, getModuleAccess);
router.put("/module-access", protect, allowRoles(...settingsManagers), updateModuleAccess);

export default router;
