import { Router } from "express";
import { overview, sales, stats, topProducts } from "../controllers/dashboardController.js";
import { allowRoles, protect, scopeEstablishment } from "../middlewares/auth.js";
import { canAccessModule } from "../controllers/settingsController.js";
import { ApiError } from "../utils/errors.js";

const router = Router();
const dashboardRoles = ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "WAITER", "CASHIER", "KITCHEN", "BAR"];
const canReadDashboard = async (req, _res, next) => {
  try {
    if (!(await canAccessModule(req, "dashboard"))) {
      throw new ApiError(403, "Vous n'avez pas la permission de consulter le dashboard.");
    }
    next();
  } catch (error) {
    next(error);
  }
};

router.get("/overview", protect, allowRoles(...dashboardRoles), canReadDashboard, scopeEstablishment, overview);
router.get("/stats", protect, allowRoles(...dashboardRoles), canReadDashboard, scopeEstablishment, stats);
router.get("/sales", protect, allowRoles(...dashboardRoles), canReadDashboard, scopeEstablishment, sales);
router.get("/top-products", protect, allowRoles(...dashboardRoles), canReadDashboard, scopeEstablishment, topProducts);

export default router;
