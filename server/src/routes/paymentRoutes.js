import { Router } from "express";
import { createPayment, getInvoice, listPayments } from "../controllers/paymentController.js";
import { allowRoles, protect, scopeEstablishment } from "../middlewares/auth.js";
import { canAccessModule } from "../controllers/settingsController.js";
import { ApiError } from "../utils/errors.js";

const router = Router();
const canReadPayments = async (req, _res, next) => {
  try {
    if (!(await canAccessModule(req, "payments"))) {
      throw new ApiError(403, "Vous n'avez pas la permission de consulter les paiements.");
    }
    next();
  } catch (error) {
    next(error);
  }
};

router.get("/payments", protect, canReadPayments, scopeEstablishment, listPayments);
router.post("/payments", protect, allowRoles("SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "CASHIER", "WAITER"), scopeEstablishment, createPayment);
router.get("/invoices/:id", protect, canReadPayments, getInvoice);

export default router;
