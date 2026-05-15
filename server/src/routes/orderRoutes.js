import { Router } from "express";
import { createOrder, deleteAllOrders, deleteOrder, getOrder, listOrders, updateOrderCustomer, updateOrderStatus } from "../controllers/orderController.js";
import { allowRoles, protect, scopeEstablishment } from "../middlewares/auth.js";
import { canAccessModule, canManageCustomers } from "../controllers/settingsController.js";
import { ApiError } from "../utils/errors.js";

const router = Router();
const canReadOrders = async (req, _res, next) => {
  try {
    if (!(await canAccessModule(req, "orders"))) {
      throw new ApiError(403, "Vous n'avez pas la permission de consulter les commandes.");
    }
    next();
  } catch (error) {
    next(error);
  }
};
const canWriteCustomer = async (req, _res, next) => {
  try {
    if (!(await canManageCustomers(req))) {
      throw new ApiError(403, "Vous n'avez pas la permission de gerer les clients.");
    }
    next();
  } catch (error) {
    next(error);
  }
};

router.get("/", protect, canReadOrders, scopeEstablishment, listOrders);
router.post("/", protect, allowRoles("SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "WAITER", "CLIENT"), scopeEstablishment, createOrder);
router.delete("/", protect, allowRoles("SUPER_ADMIN"), deleteAllOrders);
router.get("/:id", protect, canReadOrders, getOrder);
router.put("/:id/status", protect, allowRoles("SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "WAITER", "KITCHEN", "BAR", "CASHIER"), updateOrderStatus);
router.put("/:id/customer", protect, allowRoles("SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "WAITER", "CASHIER", "KITCHEN", "BAR"), canWriteCustomer, updateOrderCustomer);
router.delete("/:id", protect, allowRoles("SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"), deleteOrder);

export default router;
