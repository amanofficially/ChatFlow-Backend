import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  listMessages,
  sendMessage,
  markMessagesRead,
  deleteMessage,
  reactToMessage,
} from "../controllers/message.controller.js";

const router = Router();

router.get("/:conversationId", protect, asyncHandler(listMessages));
router.post("/", protect, asyncHandler(sendMessage));
router.put("/:conversationId/read", protect, asyncHandler(markMessagesRead));
router.delete("/:id", protect, asyncHandler(deleteMessage));
router.post("/:id/react", protect, asyncHandler(reactToMessage));

export default router;
