import { db } from "../config/mongo.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/errors.js";

const toInt = (value) => (value === undefined || value === null ? undefined : Number(value));

export const createCrudController = (model, options = {}) => {
  const scopedWhere = (req, where = {}) => {
    if (options.scoped === false) return where;
    if (req.user?.roleName !== "SUPER_ADMIN") {
      return { ...where, establishmentId: Number(req.user.establishmentId) };
    }
    if (req.query.establishmentId) {
      return { ...where, establishmentId: Number(req.query.establishmentId) };
    }
    return where;
  };

  const list = asyncHandler(async (req, res) => {
    const where = scopedWhere(req, { ...(options.where?.(req) || {}) });

    const page = Math.max(toInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(toInt(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      db[model].findMany({
        where,
        include: options.include,
        orderBy: options.orderBy || { createdAt: "desc" },
        skip,
        take: limit
      }),
      db[model].count({ where })
    ]);

    res.json({ success: true, data: items, pagination: { page, limit, total } });
  });

  const get = asyncHandler(async (req, res) => {
    const item = await db[model].findUnique({
      where: scopedWhere(req, { id: Number(req.params.id) }),
      include: options.include
    });

    if (!item) {
      throw new ApiError(404, "Ressource introuvable.");
    }

    res.json({ success: true, data: item });
  });

  const create = asyncHandler(async (req, res) => {
    const data = options.beforeCreate ? await options.beforeCreate(req.body, req) : req.body;
    const item = await db[model].create({ data, include: options.include });
    res.status(201).json({ success: true, data: item });
  });

  const update = asyncHandler(async (req, res) => {
    const data = options.beforeUpdate ? await options.beforeUpdate(req.body, req) : req.body;
    const item = await db[model].update({
      where: scopedWhere(req, { id: Number(req.params.id) }),
      data,
      include: options.include
    });
    if (!item) {
      throw new ApiError(404, "Ressource introuvable.");
    }
    res.json({ success: true, data: item });
  });

  const remove = asyncHandler(async (req, res) => {
    const item = await db[model].findUnique({ where: scopedWhere(req, { id: Number(req.params.id) }) });
    if (!item) {
      throw new ApiError(404, "Ressource introuvable.");
    }
    if (options.beforeDelete) await options.beforeDelete(item, req);
    await db[model].delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, message: "Suppression effectuee." });
  });

  return { list, get, create, update, remove };
};
