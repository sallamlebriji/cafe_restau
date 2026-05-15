import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "cafe_restau";

if (!uri) {
  throw new Error("MONGODB_URI manquant dans server/.env");
}

const client = new MongoClient(uri);
let dbPromise;

const collections = {
  role: "roles",
  user: "users",
  establishment: "establishments",
  category: "categories",
  product: "products",
  productVariant: "product_variants",
  diningTable: "tables",
  order: "orders",
  orderItem: "order_items",
  reservation: "reservations",
  customer: "customers",
  employee: "employees",
  payment: "payments",
  invoice: "invoices",
  stock: "stocks",
  stockMovement: "stock_movements",
  supplier: "suppliers",
  delivery: "deliveries",
  setting: "settings"
};

const relationMap = {
  user: {
    role: { model: "role", localKey: "roleId" },
    establishment: { model: "establishment", localKey: "establishmentId" }
  },
  establishment: {
    categories: { model: "category", foreignKey: "establishmentId", localKey: "id", many: true }
  },
  category: {
    establishment: { model: "establishment", localKey: "establishmentId" },
    products: { model: "product", foreignKey: "categoryId", localKey: "id", many: true }
  },
  product: {
    establishment: { model: "establishment", localKey: "establishmentId" },
    category: { model: "category", localKey: "categoryId" },
    variants: { model: "productVariant", foreignKey: "productId", localKey: "id", many: true }
  },
  diningTable: {
    establishment: { model: "establishment", localKey: "establishmentId" },
    assignedServer: { model: "user", localKey: "assignedServerId" }
  },
  order: {
    establishment: { model: "establishment", localKey: "establishmentId" },
    table: { model: "diningTable", localKey: "tableId" },
    customer: { model: "customer", localKey: "customerId" },
    server: { model: "user", localKey: "serverId" },
    items: { model: "orderItem", foreignKey: "orderId", localKey: "id", many: true },
    payments: { model: "payment", foreignKey: "orderId", localKey: "id", many: true },
    invoice: { model: "invoice", foreignKey: "orderId", localKey: "id" },
    delivery: { model: "delivery", foreignKey: "orderId", localKey: "id" }
  },
  orderItem: {
    product: { model: "product", localKey: "productId" }
  },
  reservation: {
    establishment: { model: "establishment", localKey: "establishmentId" },
    table: { model: "diningTable", localKey: "tableId" },
    customer: { model: "customer", localKey: "customerId" }
  },
  customer: {
    establishment: { model: "establishment", localKey: "establishmentId" }
  },
  employee: {
    establishment: { model: "establishment", localKey: "establishmentId" },
    user: { model: "user", localKey: "userId" }
  },
  payment: {
    establishment: { model: "establishment", localKey: "establishmentId" },
    order: { model: "order", localKey: "orderId" }
  },
  invoice: {
    establishment: { model: "establishment", localKey: "establishmentId" },
    order: { model: "order", localKey: "orderId" }
  },
  stock: {
    establishment: { model: "establishment", localKey: "establishmentId" },
    product: { model: "product", localKey: "productId" },
    movements: { model: "stockMovement", foreignKey: "stockId", localKey: "id", many: true }
  },
  supplier: {
    establishment: { model: "establishment", localKey: "establishmentId" }
  },
  delivery: {
    establishment: { model: "establishment", localKey: "establishmentId" },
    order: { model: "order", localKey: "orderId" },
    customer: { model: "customer", localKey: "customerId" }
  },
  setting: {
    establishment: { model: "establishment", localKey: "establishmentId" }
  }
};

const getDb = async () => {
  if (!dbPromise) {
    dbPromise = client.connect().then(() => client.db(dbName));
  }
  return dbPromise;
};

const col = async (model) => {
  const db = await getDb();
  return db.collection(collections[model]);
};

const toMongoWhere = (where = {}) =>
  Object.entries(where || {}).reduce((query, [key, value]) => {
    if (value === undefined) return query;
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      const operatorQuery = {};
      if (value.in) operatorQuery.$in = value.in;
      if (value.gte !== undefined) operatorQuery.$gte = value.gte;
      if (value.lte !== undefined) operatorQuery.$lte = value.lte;
      if (value.ne !== undefined) operatorQuery.$ne = value.ne;
      if (Object.keys(operatorQuery).length) query[key] = operatorQuery;
      return query;
    }
    query[key] = value;
    return query;
  }, {});

const orderSort = (orderBy) => {
  if (!orderBy) return {};
  const [[key, direction]] = Object.entries(orderBy);
  return { [key]: direction === "asc" || direction === "ascending" ? 1 : -1 };
};

const applySelect = (doc, select) => {
  if (!doc || !select) return doc;
  return Object.entries(select).reduce((selected, [key, enabled]) => {
    if (enabled) selected[key] = doc[key];
    return selected;
  }, {});
};

const defaultsFor = (model) => ({
  establishment: { isActive: true, primaryColor: "#b8860b" },
  category: { isActive: true, sortOrder: 0 },
  product: { isAvailable: true, preparationTime: 10, tva: 0 },
  diningTable: { status: "FREE" },
  user: { isActive: true },
  order: { status: "NEW", subtotal: 0, tva: 0, discount: 0, deliveryFee: 0, total: 0 },
  reservation: { status: "PENDING", whatsappSent: false },
  customer: { loyaltyPoints: 0, status: "normal" },
  employee: { isActive: true },
  delivery: { status: "PENDING", fee: 0 }
}[model] || {});

const normalizeData = (data = {}, model) => {
  const copy = { ...defaultsFor(model), ...data };
  delete copy._id;
  if (copy.items?.create) delete copy.items;
  if (!copy.createdAt) copy.createdAt = new Date();
  copy.updatedAt = new Date();
  return copy;
};

const nextId = async (model) => {
  const db = await getDb();
  const counter = await db.collection("_counters").findOneAndUpdate(
    { _id: model },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  return counter.seq;
};

const syncCounter = async (model, id) => {
  if (!Number.isFinite(Number(id))) return;
  const db = await getDb();
  const counters = db.collection("_counters");
  const current = await counters.findOne({ _id: model });
  if (!current || Number(current.seq || 0) < Number(id)) {
    await counters.updateOne({ _id: model }, { $set: { seq: Number(id) } }, { upsert: true });
  }
};

const duplicateWhere = (model, item) => {
  if (item.id) return { id: item.id };
  if (model === "product" && item.name && item.establishmentId) return { name: item.name, establishmentId: item.establishmentId };
  if (model === "diningTable" && item.number && item.establishmentId) return { number: item.number, establishmentId: item.establishmentId };
  if (model === "category" && item.name && item.establishmentId) return { name: item.name, establishmentId: item.establishmentId };
  if (model === "stock" && item.name && item.establishmentId) return { name: item.name, establishmentId: item.establishmentId };
  if (model === "user" && item.email) return { email: item.email };
  return null;
};

const serialize = (doc) => {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
};

const hydrate = async (model, doc, include) => {
  if (!doc || !include) return doc;
  const result = { ...doc };
  const relations = relationMap[model] || {};

  for (const [name, config] of Object.entries(include)) {
    if (!config || !relations[name]) continue;
    const relation = relations[name];
    const relationInclude = typeof config === "object" ? config.include : undefined;
    const relationSelect = typeof config === "object" ? config.select : undefined;
    const relationWhere = typeof config === "object" ? config.where : undefined;
    const relationOrderBy = typeof config === "object" ? config.orderBy : undefined;
    const relationCollection = await col(relation.model);
    const keyValue = result[relation.localKey || "id"];

    if (keyValue === null || keyValue === undefined) {
      result[name] = relation.many ? [] : null;
      continue;
    }

    const where = relation.foreignKey
      ? { [relation.foreignKey]: keyValue, ...(relationWhere || {}) }
      : { id: keyValue, ...(relationWhere || {}) };

    if (relation.many) {
      let items = await relationCollection.find(toMongoWhere(where)).sort(orderSort(relationOrderBy)).toArray();
      items = await Promise.all(items.map(async (item) => hydrate(relation.model, serialize(item), relationInclude)));
      result[name] = relationSelect ? items.map((item) => applySelect(item, relationSelect)) : items;
    } else {
      const item = serialize(await relationCollection.findOne(toMongoWhere(where)));
      const hydrated = await hydrate(relation.model, item, relationInclude);
      result[name] = applySelect(hydrated, relationSelect);
    }
  }

  return result;
};

const hydrateMany = async (model, docs, include) => Promise.all(docs.map((doc) => hydrate(model, serialize(doc), include)));

const makeModel = (model) => ({
  async findMany({ where, include, orderBy, skip = 0, take, select } = {}) {
    const collection = await col(model);
    let cursor = collection.find(toMongoWhere(where)).sort(orderSort(orderBy));
    if (skip) cursor = cursor.skip(skip);
    if (take) cursor = cursor.limit(take);
    const docs = await hydrateMany(model, await cursor.toArray(), include);
    return select ? docs.map((doc) => applySelect(doc, select)) : docs;
  },

  async findUnique({ where, include, select } = {}) {
    const collection = await col(model);
    const doc = await hydrate(model, serialize(await collection.findOne(toMongoWhere(where))), include);
    return applySelect(doc, select);
  },

  async findFirst({ where, include, orderBy, select } = {}) {
    const [doc] = await this.findMany({ where, include, orderBy, take: 1, select });
    return doc || null;
  },

  async count({ where } = {}) {
    const collection = await col(model);
    return collection.countDocuments(toMongoWhere(where));
  },

  async create({ data, include } = {}) {
    const collection = await col(model);
    const nestedItems = data?.items?.create || [];
    const doc = normalizeData(data, model);
    doc.id = doc.id || await nextId(model);
    await syncCounter(model, doc.id);
    await collection.insertOne(doc);

    if (model === "order" && nestedItems.length) {
      const itemCollection = await col("orderItem");
      const createdItems = await Promise.all(nestedItems.map(async (item) => ({
        ...normalizeData(item, "orderItem"),
        id: await nextId("orderItem"),
        orderId: doc.id
      })));
      if (createdItems.length) await itemCollection.insertMany(createdItems);
    }

    return hydrate(model, serialize(await collection.findOne({ id: doc.id })), include);
  },

  async createMany({ data, skipDuplicates = false } = {}) {
    const collection = await col(model);
    const docs = [];
    for (const item of data || []) {
      const duplicateQuery = duplicateWhere(model, item);
      if (skipDuplicates && duplicateQuery && await collection.findOne(duplicateQuery)) continue;
      const doc = { ...normalizeData(item, model), id: item.id || await nextId(model) };
      await syncCounter(model, doc.id);
      docs.push(doc);
    }
    if (!docs.length) return { count: 0 };
    await collection.insertMany(docs, { ordered: false });
    return { count: docs.length };
  },

  async update({ where, data, include } = {}) {
    const collection = await col(model);
    await collection.updateOne(toMongoWhere(where), { $set: { ...data, updatedAt: new Date() } });
    return hydrate(model, serialize(await collection.findOne(toMongoWhere(where))), include);
  },

  async delete({ where } = {}) {
    const collection = await col(model);
    const doc = serialize(await collection.findOne(toMongoWhere(where)));
    await collection.deleteOne(toMongoWhere(where));
    return doc;
  },

  async upsert({ where, update = {}, create = {}, include } = {}) {
    const collection = await col(model);
    const existing = serialize(await collection.findOne(toMongoWhere(where)));
    if (existing) {
      if (Object.keys(update).length) {
        await collection.updateOne(toMongoWhere(where), { $set: { ...update, updatedAt: new Date() } });
      }
      return hydrate(model, serialize(await collection.findOne(toMongoWhere(where))), include);
    }
    return this.create({ data: { ...create, ...where }, include });
  },

  async aggregate({ where, _sum } = {}) {
    const collection = await col(model);
    const sumFields = Object.keys(_sum || {});
    const pipeline = [
      { $match: toMongoWhere(where) },
      {
        $group: {
          _id: null,
          ...sumFields.reduce((acc, field) => ({ ...acc, [field]: { $sum: `$${field}` } }), {})
        }
      }
    ];
    const [result] = await collection.aggregate(pipeline).toArray();
    return { _sum: sumFields.reduce((acc, field) => ({ ...acc, [field]: result?.[field] || 0 }), {}) };
  },

  async groupBy({ by = [], where, _sum, orderBy, take } = {}) {
    const collection = await col(model);
    const sumFields = Object.keys(_sum || {});
    const [groupField] = by;
    const pipeline = [
      { $match: toMongoWhere(where) },
      {
        $group: {
          _id: `$${groupField}`,
          ...sumFields.reduce((acc, field) => ({ ...acc, [field]: { $sum: `$${field}` } }), {})
        }
      },
      {
        $project: {
          _id: 0,
          [groupField]: "$_id",
          _sum: sumFields.reduce((acc, field) => ({ ...acc, [field]: `$${field}` }), {})
        }
      }
    ];
    if (orderBy?._sum) {
      const [[field, direction]] = Object.entries(orderBy._sum);
      pipeline.push({ $sort: { [`_sum.${field}`]: direction === "asc" ? 1 : -1 } });
    }
    if (take) pipeline.push({ $limit: take });
    return collection.aggregate(pipeline).toArray();
  }
});

export const db = Object.keys(collections).reduce((clientApi, model) => {
  clientApi[model] = makeModel(model);
  return clientApi;
}, {});

export const closeMongo = async () => {
  await client.close();
  dbPromise = null;
};
