import { db } from "../config/mongo.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/errors.js";
import { emitToEstablishment } from "../sockets/index.js";

const money = (value) => Number(value || 0);

const makeOrderCode = () => `ORD-${Date.now().toString(36).toUpperCase()}`;
const defaultOrderVisibilityRoles = ["SUPER_ADMIN", "MANAGER", "CASHIER"];
const activePreparationStatuses = ["NEW", "CONFIRMED", "PREPARING", "READY"];
const barCategories = ["coffee", "tea", "juice", "boissons chaudes", "boissons froides", "boissons", "bar"];
const kitchenCategories = ["food", "snack", "dessert", "plats", "plat", "snacks", "desserts", "pizzas", "cuisine"];
const barKeywords = ["cafe", "coffee", "espresso", "the", "tea", "jus", "juice", "orange", "avocat", "boisson", "latte", "mocha", "cappuccino", "eau", "soda"];
const kitchenKeywords = ["tacos", "pizza", "burger", "tajine", "couscous", "salade", "crepe", "plat", "poulet", "viande", "snack", "dessert", "fromage", "sandwich"];
const scopedEstablishmentWhere = (req, where = {}) => {
  if (req.user?.roleName !== "SUPER_ADMIN") {
    return { ...where, establishmentId: Number(req.user.establishmentId) };
  }
  if (req.query.establishmentId) {
    return { ...where, establishmentId: Number(req.query.establishmentId) };
  }
  return where;
};

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const itemName = (item) => item.productName || item.product?.name || "";
const itemCategory = (item) => item.product?.category?.name || item.product?.category || "";

const isBarItem = (item) => {
  const name = normalizeText(itemName(item));
  const category = normalizeText(itemCategory(item));
  if (barCategories.includes(category)) return true;
  if (kitchenCategories.includes(category)) return false;
  return barKeywords.some((keyword) => name.includes(keyword));
};

const isKitchenItem = (item) => {
  const name = normalizeText(itemName(item));
  const category = normalizeText(itemCategory(item));
  if (kitchenCategories.includes(category)) return true;
  if (barCategories.includes(category)) return false;
  if (barKeywords.some((keyword) => name.includes(keyword))) return false;
  return kitchenKeywords.some((keyword) => name.includes(keyword));
};

const isActivePreparationOrder = (order) => activePreparationStatuses.includes(order.status);
const canShowInPreparation = (order) => isActivePreparationOrder(order) && !(order.sourceChannel === "QR" && order.status === "NEW");

const getOrderVisibilityRoles = async (establishmentId) => {
  const setting = await db.setting.findFirst({
    where: {
      key: "orderVisibilityRoles",
      establishmentId: Number(establishmentId || 1)
    }
  });

  return Array.isArray(setting?.value) && setting.value.length ? setting.value : defaultOrderVisibilityRoles;
};

export const listOrders = asyncHandler(async (req, res) => {
  const where = scopedEstablishmentWhere(req);
  if (req.query.status) where.status = req.query.status;
  if (req.query.tableId) where.tableId = Number(req.query.tableId);
  if (req.query.serverId) where.serverId = Number(req.query.serverId);

  const visibilityRoles = await getOrderVisibilityRoles(req.query.establishmentId || req.user?.establishmentId);
  const canSeeAll = req.user && visibilityRoles.includes(req.user.roleName);

  const orders = await db.order.findMany({
    where,
    include: {
      table: true,
      customer: true,
      establishment: true,
      server: { select: { id: true, name: true, roleName: true } },
      items: { include: { product: { include: { category: true } } } },
      payments: true
    },
    orderBy: { createdAt: "desc" }
  });

  let visibleOrders = orders;

  if (req.user?.roleName === "BAR") {
    visibleOrders = orders.filter((order) => canShowInPreparation(order) && order.items?.some(isBarItem));
  } else if (req.user?.roleName === "KITCHEN") {
    visibleOrders = orders.filter((order) => canShowInPreparation(order) && order.items?.some(isKitchenItem));
  } else if (!canSeeAll) {
    visibleOrders = orders.filter((order) => order.serverId === req.user?.id || order.serverId === null || order.serverId === undefined);
  }

  res.json({ success: true, data: visibleOrders });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await db.order.findUnique({
    where: scopedEstablishmentWhere(req, { id: Number(req.params.id) }),
    include: {
      establishment: true,
      table: true,
      customer: true,
      items: { include: { product: { include: { category: true } } } },
      payments: true,
      invoice: true,
      delivery: true
    }
  });

  if (!order) throw new ApiError(404, "Commande introuvable.");
  res.json({ success: true, data: order });
});

export const createOrder = asyncHandler(async (req, res) => {
  const items = req.body.items || [];
  if (!items.length) {
    throw new ApiError(422, "Une commande doit contenir au moins un produit.");
  }

  const productIds = items.map((item) => Number(item.productId)).filter((id) => Number.isFinite(id));
  const products = await db.product.findMany({
    where: { id: { in: productIds }, establishmentId: Number(req.body.establishmentId) }
  });

  const orderItems = items.map((item) => {
    const itemName = item.productName || item.name;
    const productByName = itemName
      ? products.find((candidate) => candidate.name?.toLowerCase() === itemName.toLowerCase())
      : null;
    const productById = products.find((candidate) => candidate.id === Number(item.productId));
    const product = productByName || productById;
    const quantity = Number(item.quantity || 1);
    const unitPrice = item.unitPrice === undefined ? money(product?.price) : money(item.unitPrice);
    return {
      productId: product?.id || (Number.isFinite(Number(item.productId)) ? Number(item.productId) : null),
      productName: itemName || product?.name || "Produit",
      quantity,
      unitPrice,
      total: unitPrice * quantity,
      note: item.note,
      variants: item.variants || undefined
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const tva = money(req.body.tva);
  const discount = money(req.body.discount);
  const deliveryFee = money(req.body.deliveryFee);
  const total = subtotal + tva + deliveryFee - discount;
  let customerId = req.body.customerId ? Number(req.body.customerId) : null;
  const customerPayload = req.body.customer;
  let tableId = req.body.tableId ? Number(req.body.tableId) : null;

  if (!tableId && req.body.tableNumber) {
    const table = await db.diningTable.findFirst({
      where: {
        number: req.body.tableNumber,
        establishmentId: Number(req.body.establishmentId)
      }
    });
    tableId = table?.id || null;
    if (!req.body.serverId && table?.assignedServerId) {
      req.body.serverId = table.assignedServerId;
    }
  }

  if (!customerId && customerPayload?.name) {
    const customerData = {
      name: customerPayload.name,
      phone: customerPayload.phone || null,
      email: customerPayload.email || null,
      address: customerPayload.address || null,
      establishmentId: Number(req.body.establishmentId)
    };

    const existingCustomer = customerPayload.phone
      ? await db.customer.findFirst({
          where: {
            phone: customerPayload.phone,
            establishmentId: Number(req.body.establishmentId)
          }
        })
      : null;

    const customer = existingCustomer
      ? await db.customer.update({ where: { id: existingCustomer.id }, data: customerData })
      : await db.customer.create({ data: customerData });
    customerId = customer.id;
  }

  const order = await db.order.create({
    data: {
      code: makeOrderCode(),
      source: req.body.source || "TABLE",
      sourceChannel: req.isPublicOrder && tableId ? "QR" : req.isPublicOrder ? "PUBLIC" : "STAFF",
      status: req.body.status || "NEW",
      subtotal,
      tva,
      discount,
      deliveryFee,
      total,
      note: req.body.note,
      tableId,
      customerId,
      serverId: req.user?.id || req.body.serverId || null,
      reservationId: req.body.reservationId ? Number(req.body.reservationId) : null,
      establishmentId: Number(req.body.establishmentId),
      items: { create: orderItems }
    },
    include: { items: { include: { product: { include: { category: true } } } }, table: true, customer: true }
  });

  emitToEstablishment(order.establishmentId, "order:new", order);
  res.status(201).json({ success: true, data: order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await db.order.update({
    where: scopedEstablishmentWhere(req, { id: Number(req.params.id) }),
    data: { status: req.body.status },
    include: { items: { include: { product: { include: { category: true } } } }, table: true }
  });
  if (!order) throw new ApiError(404, "Commande introuvable.");

  emitToEstablishment(order.establishmentId, "order:status", order);
  res.json({ success: true, data: order });
});

export const updateOrderCustomer = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  if (!name) throw new ApiError(422, "Le nom du client est requis.");

  const order = await db.order.findUnique({ where: scopedEstablishmentWhere(req, { id: Number(req.params.id) }) });
  if (!order) throw new ApiError(404, "Commande introuvable.");

  const customer = order.customerId
    ? await db.customer.update({
        where: { id: order.customerId },
        data: {
          name,
          phone: req.body.phone || undefined,
          address: req.body.address || undefined
        }
      })
    : await db.customer.create({
        data: {
          name,
          phone: req.body.phone || null,
          address: req.body.address || null,
          establishmentId: order.establishmentId
        }
      });

  const updatedOrder = await db.order.update({
    where: { id: order.id },
    data: { customerId: customer.id },
    include: { items: { include: { product: { include: { category: true } } } }, table: true, customer: true }
  });

  emitToEstablishment(updatedOrder.establishmentId, "order:customer", updatedOrder);
  res.json({ success: true, data: updatedOrder });
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await db.order.findUnique({ where: scopedEstablishmentWhere(req, { id: Number(req.params.id) }) });
  if (!order) throw new ApiError(404, "Commande introuvable.");
  await db.order.delete({ where: { id: order.id } });
  res.json({ success: true, message: "Commande supprimee." });
});

export const deleteAllOrders = asyncHandler(async (_req, res) => {
  const [orders, orderItems, payments, invoices, deliveries] = await Promise.all([
    db.order.findMany(),
    db.orderItem.findMany(),
    db.payment.findMany(),
    db.invoice.findMany(),
    db.delivery.findMany()
  ]);

  await Promise.all([
    ...orders.map((item) => db.order.delete({ where: { id: item.id } })),
    ...orderItems.map((item) => db.orderItem.delete({ where: { id: item.id } })),
    ...payments.map((item) => db.payment.delete({ where: { id: item.id } })),
    ...invoices.map((item) => db.invoice.delete({ where: { id: item.id } })),
    ...deliveries.map((item) => db.delivery.delete({ where: { id: item.id } }))
  ]);

  res.json({
    success: true,
    message: "Toutes les commandes ont ete supprimees.",
    deleted: {
      orders: orders.length,
      orderItems: orderItems.length,
      payments: payments.length,
      invoices: invoices.length,
      deliveries: deliveries.length
    }
  });
});
