import { db } from "../config/mongo.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const attachReservationCustomer = async (data = {}) => {
  const payload = { ...data };
  const establishmentId = Number(payload.establishmentId || 1);
  const customerName = payload.customerName || payload.name;
  const phone = payload.phone || null;

  if (!payload.customerId && customerName) {
    const existingCustomer = phone
      ? await db.customer.findFirst({ where: { phone, establishmentId } })
      : null;

    const customerData = {
      name: customerName,
      phone,
      email: payload.email || null,
      address: payload.address || null,
      establishmentId
    };

    const customer = existingCustomer
      ? await db.customer.update({ where: { id: existingCustomer.id }, data: customerData })
      : await db.customer.create({ data: customerData });

    payload.customerId = customer.id;
  }

  return payload;
};

export const createPublicReservation = asyncHandler(async (req, res) => {
  if (!Number(req.body.guests) || Number(req.body.guests) < 1) {
    res.status(422).json({ success: false, message: "Le nombre de personnes est obligatoire." });
    return;
  }

  const reservation = await db.reservation.create({
    data: await attachReservationCustomer(req.body),
    include: { customer: true, table: true }
  });
  res.status(201).json({ success: true, data: reservation });
});
