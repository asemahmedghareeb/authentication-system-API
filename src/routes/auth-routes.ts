import express from "express";
import { signup, login, logout, getNewAccessTokenUsingRefreshToken, userProfile, verifyEmail, forgotPassword, resetPassword } from "../controllers/auth-controller.ts";

import protectedRoute from "../middlewares/protectedRoute.ts";
import { loginValidation, signUpValidation } from "../utils/validation.ts";
import { checkAuth } from "../middlewares/checkAuth.ts";
const router = express.Router();
router.get('check-auth', protectedRoute, checkAuth);
router.post("/signup", signUpValidation, signup);
router.post("/login", loginValidation, login);
router.post("/logout", protectedRoute, logout);
router.get("/profile", protectedRoute, userProfile);
router.post("/refresh-token", getNewAccessTokenUsingRefreshToken);

router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
export default router; 