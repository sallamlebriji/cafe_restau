import bcrypt from "bcryptjs";
import Joi from "joi";
import jwt from "jsonwebtoken";
import { db } from "../config/mongo.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/errors.js";
import { signToken } from "../utils/token.js";
import { canAssignRoles } from "./settingsController.js";

export const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().allow("", null),
  roleName: Joi.string()
    .valid("SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "WAITER", "CASHIER", "KITCHEN", "BAR", "CLIENT")
    .default("CLIENT"),
  establishmentId: Joi.number().integer().allow(null)
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const sanitizeUser = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

export const register = asyncHandler(async (req, res) => {
  if (req.body.roleName !== "CLIENT") {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.split(" ")[1] : null;
    if (!token) {
      throw new ApiError(401, "Authentification requise pour attribuer un role.");
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const actor = await db.user.findUnique({ where: { id: payload.id } });
    if (!actor || !actor.isActive) {
      throw new ApiError(401, "Utilisateur invalide ou inactif.");
    }
    req.user = actor;
    if (req.body.roleName === "SUPER_ADMIN") {
      throw new ApiError(403, "Le role Super Admin est protege.");
    }
    if (actor.roleName !== "SUPER_ADMIN" && !(await canAssignRoles(req))) {
      throw new ApiError(403, "Vous n'avez pas la permission d'attribuer des roles.");
    }
    if (actor.roleName !== "SUPER_ADMIN") {
      req.body.establishmentId = actor.establishmentId;
    }
  }

  const existing = await db.user.findUnique({ where: { email: req.body.email } });
  if (existing) {
    throw new ApiError(409, "Cet email est deja utilise.");
  }

  const role = await db.role.upsert({
    where: { name: req.body.roleName },
    update: {},
    create: { name: req.body.roleName, description: req.body.roleName.replaceAll("_", " ") }
  });

  const hashedPassword = await bcrypt.hash(req.body.password, 12);
  const user = await db.user.create({
    data: {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: hashedPassword,
      roleId: role.id,
      roleName: req.body.roleName,
      establishmentId: req.body.establishmentId || null
    },
    include: { role: true, establishment: true }
  });

  res.status(201).json({
    success: true,
    token: signToken(user),
    user: sanitizeUser(user)
  });
});

export const login = asyncHandler(async (req, res) => {
  const user = await db.user.findUnique({
    where: { email: req.body.email },
    include: { role: true, establishment: true }
  });

  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    throw new ApiError(401, "Email ou mot de passe incorrect.");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Compte desactive.");
  }

  res.json({
    success: true,
    token: signToken(user),
    user: sanitizeUser(user)
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: sanitizeUser(req.user) });
});

export const logout = asyncHandler(async (_req, res) => {
  res.json({ success: true, message: "Deconnexion effectuee cote client." });
});
