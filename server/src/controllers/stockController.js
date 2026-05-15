import { db } from "../config/mongo.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/errors.js";
import { emitToEstablishment } from "../sockets/index.js";

const movementTypes = ["IN", "OUT", "ADJUST"];

export const createStockMovement = asyncHandler(async (req, res) => {
  const stockId = Number(req.params.id);
  const quantity = Number(req.body.quantity);
  const type = String(req.body.type || "").toUpperCase();

  if (!movementTypes.includes(type)) {
    throw new ApiError(422, "Type de mouvement invalide.");
  }
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new ApiError(422, "La quantite doit etre un nombre positif.");
  }

  const stock = await db.stock.findUnique({ where: { id: stockId } });
  if (!stock) throw new ApiError(404, "Ingredient introuvable.");

  const beforeQuantity = Number(stock.quantity || 0);
  const afterQuantity = type === "IN"
    ? beforeQuantity + quantity
    : type === "OUT"
      ? Math.max(0, beforeQuantity - quantity)
      : quantity;

  const movement = await db.stockMovement.create({
    data: {
      stockId,
      type,
      quantity,
      reason: req.body.reason || null,
      beforeQuantity,
      afterQuantity,
      userId: req.user?.id || null,
      userName: req.user?.name || null
    }
  });

  const updatedStock = await db.stock.update({
    where: { id: stockId },
    data: { quantity: afterQuantity },
    include: { product: true, movements: true }
  });

  emitToEstablishment(updatedStock.establishmentId, "stock:movement", { stock: updatedStock, movement });
  if (Number(updatedStock.quantity) <= Number(updatedStock.alertThreshold)) {
    emitToEstablishment(updatedStock.establishmentId, "stock:alert", updatedStock);
  }

  res.status(201).json({ success: true, data: { stock: updatedStock, movement } });
});
