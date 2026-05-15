import { Router } from "express";
import { allowRoles, protect } from "../middlewares/auth.js";
import { upload } from "../middlewares/upload.js";
import { canManageProducts } from "../controllers/settingsController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/errors.js";

const router = Router();
const productRoles = ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "WAITER", "CASHIER", "KITCHEN", "BAR"];

const canUploadProductImage = async (req, _res, next) => {
  try {
    if (!(await canManageProducts(req))) {
      throw new ApiError(403, "Vous n'avez pas la permission de gerer les images produits.");
    }
    next();
  } catch (error) {
    next(error);
  }
};

router.post(
  "/image",
  protect,
  allowRoles(...productRoles),
  canUploadProductImage,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, "Image manquante.");
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.status(201).json({
      success: true,
      data: {
        filename: req.file.filename,
        url: `${baseUrl}/uploads/${req.file.filename}`
      }
    });
  })
);

export default router;
