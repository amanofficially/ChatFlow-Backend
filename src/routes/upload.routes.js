import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { protect } from "../middleware/auth.middleware.js";
import { uploadAvatarImage, uploadChatMedia } from "../controllers/upload.controller.js";

const router = Router();

router.post("/avatar", protect, asyncHandler(uploadAvatarImage));
router.post("/chat-media", protect, asyncHandler(uploadChatMedia));

export default router;
