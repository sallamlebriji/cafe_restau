import { Router } from "express";
import { createCrudController } from "../controllers/crudController.js";
import { createStockMovement } from "../controllers/stockController.js";
import { allowRoles, protect, scopeEstablishment } from "../middlewares/auth.js";
import { canAccessModule, canManageStocks } from "../controllers/settingsController.js";
import { ApiError } from "../utils/errors.js";

const router = Router();
const stockWriteRoles = ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "WAITER", "CASHIER", "KITCHEN", "BAR"];
const controller = createCrudController("stock", {
  include: { product: true, movements: true, establishment: true },
  orderBy: { updatedAt: "desc" }
});
const canWriteStock = async (req, _res, next) => {
  try {
    if (!(await canManageStocks(req))) {
      throw new ApiError(403, "Vous n'avez pas la permission de gerer le stock.");
    }
    next();
  } catch (error) {
    next(error);
  }
};
const canReadStock = async (req, _res, next) => {
  try {
    if (!(await canAccessModule(req, "stock"))) {
      throw new ApiError(403, "Vous n'avez pas la permission de consulter le stock.");
    }
    next();
  } catch (error) {
    next(error);
  }
};

router.get("/", protect, canReadStock, scopeEstablishment, controller.list);
router.post("/", protect, allowRoles(...stockWriteRoles), scopeEstablishment, canWriteStock, controller.create);
router.post("/:id/movements", protect, allowRoles(...stockWriteRoles), canWriteStock, createStockMovement);
router.get("/:id", protect, canReadStock, controller.get);
router.put("/:id", protect, allowRoles(...stockWriteRoles), scopeEstablishment, canWriteStock, controller.update);
router.delete("/:id", protect, allowRoles(...stockWriteRoles), canWriteStock, controller.remove);

export default router;
