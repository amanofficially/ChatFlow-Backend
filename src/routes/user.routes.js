import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { protect } from "../middleware/auth.middleware.js";
import { searchUsers } from "../controllers/user.controller.js";

const router = Router();

router.get("/search", protect, asyncHandler(searchUsers));

export default router;
