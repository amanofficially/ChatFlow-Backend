import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  listConversations,
  createConversation,
  deleteConversation,
  markConversationRead,
} from "../controllers/conversation.controller.js";

const router = Router();

router.get("/", protect, asyncHandler(listConversations));
router.post("/", protect, asyncHandler(createConversation));
router.delete("/:id", protect, asyncHandler(deleteConversation));
router.put("/:id/read", protect, asyncHandler(markConversationRead));

export default router;
