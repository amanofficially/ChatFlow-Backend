import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },

    // Map of userId -> unread count for that user.
    unreadCount: { type: Map, of: Number, default: {} },

    // Users who've "deleted" this conversation (hidden for them only).
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Map of userId -> timestamp of when they deleted — messages sent
    // before that timestamp stay hidden for that user if they re-enter.
    deletedAt: { type: Map, of: Date, default: {} },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1, updatedAt: -1 });
conversationSchema.index({ participants: 1 });

export default mongoose.model("Conversation", conversationSchema);
