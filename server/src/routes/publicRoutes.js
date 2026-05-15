import { Router } from "express";
import { db } from "../config/mongo.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createOrder } from "../controllers/orderController.js";
import { createPublicReservation } from "../controllers/reservationController.js";

const router = Router();

router.get("/establishments/:slug", asyncHandler(async (req, res) => {
  const establishment = await db.establishment.findUnique({
    where: { slug: req.params.slug },
    include: {
      categories: {
        where: { isActive: true },
        include: { products: { where: { isAvailable: true }, include: { variants: true } } },
        orderBy: { sortOrder: "asc" }
      }
    }
  });
  res.json({ success: true, data: establishment });
}));

router.post("/orders", (req, _res, next) => {
  req.user = null;
  req.isPublicOrder = true;
  next();
}, createOrder);

router.get("/orders/:code", asyncHandler(async (req, res) => {
  const order = await db.order.findUnique({
    where: { code: req.params.code },
    include: {
      table: true,
      items: { include: { product: true } }
    }
  });

  if (!order) {
    res.status(404).json({ success: false, message: "Commande introuvable." });
    return;
  }

  res.json({ success: true, data: order });
}));

router.post("/reservations", createPublicReservation);

export default router;
