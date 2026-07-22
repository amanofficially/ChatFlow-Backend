import mongoose from "mongoose";
import { MESSAGE_TYPES, MESSAGE_STATUS } from "../constants/index.js";

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // "text"  -> plain text content
    // "image" -> Cloudinary image URL
    // "file"  -> Cloudinary file URL
    content: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(MESSAGE_TYPES), default: MESSAGE_TYPES.TEXT },

    // Original filename — only set for type "file".
    fileName: { type: String, default: null },

    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: Object.values(MESSAGE_STATUS), default: MESSAGE_STATUS.SENT },

    // Map of userId -> emoji.
    reactions: { type: Map, of: String, default: {} },
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ conversationId: 1, sender: 1, status: 1 });

export default mongoose.model("Message", messageSchema);
