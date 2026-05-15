import { Router } from "express";
import { login, loginSchema, logout, me, register, registerSchema } from "../controllers/authController.js";
import { protect } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", protect, me);
router.post("/logout", protect, logout);

export default router;

