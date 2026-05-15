import jwt from "jsonwebtoken";
import { db } from "../config/mongo.js";
import { ApiError } from "../utils/errors.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.split(" ")[1] : null;

  if (!token) {
    throw new ApiError(401, "Authentification requise.");
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const user = await db.user.findUnique({
    where: { id: payload.id },
    include: { role: true, establishment: true }
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, "Utilisateur invalide ou inactif.");
  }

  req.user = user;
  next();
});

export const allowRoles = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.roleName)) {
    throw new ApiError(403, "Vous n'avez pas la permission d'effectuer cette action.");
  }
  next();
};

export const scopeEstablishment = (req, _res, next) => {
  if (req.user.roleName !== "SUPER_ADMIN") {
    req.query.establishmentId = String(req.user.establishmentId);
    req.body.establishmentId = req.user.establishmentId;
  }
  next();
};

