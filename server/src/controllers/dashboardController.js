import { db } from "../config/mongo.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const establishmentWhere = (req) => {
  if (req.user?.roleName !== "SUPER_ADMIN") {
    return { establishmentId: Number(req.user.establishmentId) };
  }
  return req.query.establishmentId ? { establishmentId: Number(req.query.establishmentId) } : {};
};
const activeStatuses = ["NEW", "CONFIRMED", "PREPARING", "READY"];
const dayLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const paymentLabels = {
  CASH: "Especes",
  CARD: "Carte",
  MIXED: "Mixte",
  CREDIT: "Credit"
};

const getRange = (period = "today") => {
  const end = new Date();
  const start = new Date(end);
  if (period === "week") {
    start.setDate(end.getDate() - 6);
  }
  start.setHours(0, 0, 0, 0);
  return { start, end };
};

const dateWhere = (field, start, end) => ({ [field]: { gte: start, lte: end } });

const sum = (items, selector) => items.reduce((total, item) => total + Number(selector(item) || 0), 0);

const bucketSales = (payments, period) => {
  if (period === "today") {
    const buckets = Array.from({ length: 16 }, (_, index) => ({ date: `${index + 8}h`, revenue: 0, table: 0, delivery: 0, counter: 0 }));
    payments.forEach((payment) => {
      const date = new Date(payment.paidAt);
      const hour = date.getHours();
      if (hour < 8 || hour > 23) return;
      buckets[hour - 8].revenue += Number(payment.amount || 0);
    });
    return buckets;
  }

  const now = new Date();
  const buckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    return { key: date.toISOString().slice(0, 10), date: dayLabels[date.getDay()], revenue: 0, table: 0, delivery: 0, counter: 0 };
  });

  payments.forEach((payment) => {
    const key = new Date(payment.paidAt).toISOString().slice(0, 10);
    const bucket = buckets.find((item) => item.key === key);
    if (bucket) bucket.revenue += Number(payment.amount || 0);
  });

  return buckets.map(({ key: _key, ...bucket }) => bucket);
};

const sourceKey = (source) => {
  if (source === "DELIVERY") return "delivery";
  if (source === "COUNTER") return "counter";
  return "table";
};

export const overview = asyncHandler(async (req, res) => {
  const period = req.query.period === "week" ? "week" : "today";
  const { start, end } = getRange(period);
  const where = establishmentWhere(req);

  const [orders, allOrders, payments, tables, customers, stocks, orderItems, users] = await Promise.all([
    db.order.findMany({
      where: { ...where, ...dateWhere("createdAt", start, end) },
      include: { table: true, customer: true, server: { select: { id: true, name: true, roleName: true } }, items: true },
      orderBy: { createdAt: "asc" },
      take: 1000
    }),
    db.order.findMany({ where, include: { server: { select: { id: true, name: true, roleName: true } } }, take: 1000 }),
    db.payment.findMany({
      where: { ...where, ...dateWhere("paidAt", start, end) },
      orderBy: { paidAt: "asc" },
      take: 1000
    }),
    db.diningTable.findMany({ where, take: 500 }),
    db.customer.findMany({ where, take: 1000 }),
    db.stock.findMany({ where, take: 500 }),
    db.orderItem.findMany({ include: { product: true }, take: 1000 }),
    db.user.findMany({ where, take: 500 })
  ]);

  const revenue = sum(payments, (payment) => payment.amount);
  const paidOrderIds = new Set(payments.map((payment) => payment.orderId).filter(Boolean));
  const averageBasket = paidOrderIds.size ? revenue / paidOrderIds.size : orders.length ? sum(orders, (order) => order.total) / orders.length : 0;
  const occupiedTables = tables.filter((table) => table.status === "OCCUPIED").length;
  const activeClients = new Set(orders.map((order) => order.customerId).filter(Boolean)).size || customers.length;
  const criticalStocks = stocks
    .map((stock) => ({ ...stock, quantity: Number(stock.quantity || 0), alertThreshold: Number(stock.alertThreshold || 0) }))
    .filter((stock) => stock.quantity <= stock.alertThreshold);
  const activeOrders = allOrders.filter((order) => activeStatuses.includes(order.status)).length;

  const salesSeries = bucketSales(payments, period);
  orders.forEach((order) => {
    const orderDate = new Date(order.createdAt);
    const bucket = period === "today"
      ? salesSeries[orderDate.getHours() - 8]
      : salesSeries.find((item) => item.date === dayLabels[orderDate.getDay()]);
    if (bucket) bucket[sourceKey(order.source)] += 1;
  });

  const paymentMethods = Object.entries(payments.reduce((acc, payment) => {
    const method = payment.method || "CASH";
    acc[method] = (acc[method] || 0) + Number(payment.amount || 0);
    return acc;
  }, {})).map(([method, value]) => ({ name: paymentLabels[method] || method, value }));

  const channelData = Object.entries(orders.reduce((acc, order) => {
    const key = sourceKey(order.source);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})).map(([name, value]) => ({ name, value }));

  const performanceByUser = orders.reduce((acc, order) => {
    const key = order.serverId || "source";
    const current = acc[key] || {
      subject: order.server?.name?.split(" ")[0] || (order.sourceChannel === "QR" ? "QR" : "Source"),
      commandes: 0,
      ventes: 0,
      presence: 80
    };
    current.commandes += 1;
    current.ventes += Number(order.total || 0);
    acc[key] = current;
    return acc;
  }, {});
  const employeePerformance = Object.values(performanceByUser)
    .sort((a, b) => b.commandes - a.commandes)
    .slice(0, 6)
    .map((item) => ({ ...item, ventes: Math.round(item.ventes / 100) }));

  const activityHeatmap = Array.from({ length: 12 }, (_, index) => {
    const hour = index + 10;
    return [`${hour}h`, orders.filter((order) => new Date(order.createdAt).getHours() === hour).length];
  });

  const topProductMap = orderItems.reduce((acc, item) => {
    const key = item.productName || item.product?.name || `Produit ${item.productId}`;
    const current = acc[key] || { name: key, quantity: 0, total: 0 };
    current.quantity += Number(item.quantity || 0);
    current.total += Number(item.total || 0);
    acc[key] = current;
    return acc;
  }, {});
  const topProducts = Object.values(topProductMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  const recommendations = [
    topProducts[0] && ["Produit fort", topProducts[0].name, `${topProducts[0].quantity} vendu(s)`, "success"],
    averageBasket > 0 && ["Panier moyen", `${Math.round(averageBasket)} DH`, averageBasket < 80 ? "Proposer des supplements" : "Bon niveau", averageBasket < 80 ? "warning" : "success"],
    criticalStocks[0] && ["Reapprovisionnement", criticalStocks[0].name, `${criticalStocks[0].quantity} ${criticalStocks[0].unit} restant`, criticalStocks[0].quantity <= 0 ? "danger" : "warning"]
  ].filter(Boolean);

  res.json({
    success: true,
    data: {
      period,
      kpis: {
        revenue,
        orders: orders.length,
        activeOrders,
        tableOccupancy: tables.length ? Math.round((occupiedTables / tables.length) * 100) : 0,
        activeClients,
        averageBasket,
        criticalStockCount: criticalStocks.length
      },
      salesSeries,
      paymentMethods: paymentMethods.length ? paymentMethods : [{ name: "Aucun paiement", value: 1 }],
      channelData: channelData.length ? channelData : [{ name: "table", value: 0 }, { name: "delivery", value: 0 }, { name: "counter", value: 0 }],
      employeePerformance,
      activityHeatmap,
      topProducts,
      criticalStocks,
      recommendations,
      users: users.length
    }
  });
});

export const stats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const where = establishmentWhere(req);

  const [revenue, orders, activeOrders, occupiedTables, reservations, lowStocks] = await Promise.all([
    db.payment.aggregate({
      where: { ...where, paidAt: { gte: today } },
      _sum: { amount: true }
    }),
    db.order.count({ where: { ...where, createdAt: { gte: today } } }),
    db.order.count({ where: { ...where, status: { in: ["NEW", "CONFIRMED", "PREPARING", "READY"] } } }),
    db.diningTable.count({ where: { ...where, status: "OCCUPIED" } }),
    db.reservation.count({ where: { ...where, reservationDate: { gte: today } } }),
    db.stock.findMany({ where, take: 8, orderBy: { quantity: "asc" } })
  ]);

  res.json({
    success: true,
    data: {
      revenueToday: revenue._sum.amount || 0,
      ordersToday: orders,
      activeOrders,
      occupiedTables,
      reservationsToday: reservations,
      lowStocks
    }
  });
});

export const sales = asyncHandler(async (req, res) => {
  const where = establishmentWhere(req);
  const payments = await db.payment.findMany({
    where,
    select: { amount: true, paidAt: true, method: true },
    orderBy: { paidAt: "asc" },
    take: 500
  });

  const byDay = payments.reduce((acc, payment) => {
    const key = payment.paidAt.toISOString().slice(0, 10);
    acc[key] = (acc[key] || 0) + Number(payment.amount);
    return acc;
  }, {});

  res.json({
    success: true,
    data: Object.entries(byDay).map(([date, total]) => ({ date, total }))
  });
});

export const topProducts = asyncHandler(async (req, res) => {
  const where = establishmentWhere(req);
  const productsScope = await db.product.findMany({ where, select: { id: true } });
  const scopedProductIds = productsScope.map((product) => product.id);
  const items = await db.orderItem.groupBy({
    by: ["productId"],
    where: scopedProductIds.length ? { productId: { in: scopedProductIds } } : { productId: -1 },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 10
  });

  const products = await db.product.findMany({
    where: { id: { in: items.map((item) => item.productId) } }
  });

  res.json({
    success: true,
    data: items.map((item) => ({
      ...item,
      product: products.find((product) => product.id === item.productId)
    }))
  });
});
