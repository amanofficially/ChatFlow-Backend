import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { protect } from "../middleware/auth.middleware.js";
import { signup, login, getCurrentUser, updateProfile } from "../controllers/auth.controller.js";

const router = Router();

router.post("/signup", asyncHandler(signup));
router.post("/login", asyncHandler(login));
router.get("/me", protect, getCurrentUser);
router.put("/profile", protect, asyncHandler(updateProfile));

export default router;
