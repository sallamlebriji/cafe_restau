import { db } from "../config/mongo.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { emitToEstablishment } from "../sockets/index.js";
import { ApiError } from "../utils/errors.js";

const invoiceNumber = () => `FAC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
const scopedEstablishmentWhere = (req, where = {}) => {
  if (req.user?.roleName !== "SUPER_ADMIN") {
    return { ...where, establishmentId: Number(req.user.establishmentId) };
  }
  if (req.query.establishmentId) {
    return { ...where, establishmentId: Number(req.query.establishmentId) };
  }
  return where;
};

export const listPayments = asyncHandler(async (req, res) => {
  const where = scopedEstablishmentWhere(req);
  const payments = await db.payment.findMany({
    where,
    include: { establishment: true, order: { include: { customer: true, table: true, establishment: true } } },
    orderBy: { paidAt: "desc" }
  });
  res.json({ success: true, data: payments });
});

export const createPayment = asyncHandler(async (req, res) => {
  const order = await db.order.findUnique({ where: { id: Number(req.body.orderId) } });
  if (!order) {
    res.status(404).json({ success: false, message: "Commande introuvable." });
    return;
  }
  if (req.user?.roleName !== "SUPER_ADMIN" && order.establishmentId !== Number(req.user.establishmentId)) {
    throw new ApiError(404, "Commande introuvable.");
  }

  const payment = await db.payment.create({
    data: {
      orderId: Number(req.body.orderId),
      establishmentId: Number(req.body.establishmentId || order.establishmentId),
      method: req.body.method,
      amount: req.body.amount,
      reference: req.body.reference,
      paidAt: new Date()
    }
  });

  const invoice = await db.invoice.upsert({
    where: { orderId: Number(req.body.orderId) },
    update: { total: order.total },
    create: {
      number: invoiceNumber(),
      orderId: Number(req.body.orderId),
      establishmentId: order.establishmentId,
      total: order.total,
      issuedAt: new Date()
    }
  });

  await db.order.update({
    where: { id: order.id },
    data: { status: "PAID" }
  });

  emitToEstablishment(order.establishmentId, "payment:created", { payment, invoice });
  res.status(201).json({ success: true, data: { payment, invoice } });
});

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await db.invoice.findUnique({
    where: { id: Number(req.params.id), ...(req.user?.roleName !== "SUPER_ADMIN" ? { establishmentId: Number(req.user.establishmentId) } : {}) },
    include: { establishment: true, order: { include: { items: { include: { product: { include: { category: true } } } }, customer: true, table: true } } }
  });
  res.json({ success: true, data: invoice });
});
