// ============================================================
// socket/handlers/connection.handler.js
// ============================================================
import User from "../../models/User.js";
import Message from "../../models/Message.js";
import Conversation from "../../models/Conversation.js";
import { setUserOnline, setUserOffline, getSocketId, getOnlineUserIds } from "../presence.js";
import { SOCKET_EVENTS, MESSAGE_STATUS, OBJECT_ID_REGEX } from "../../constants/index.js";

/** Flip any messages sent to this user while they were offline to "delivered", and tell the senders. */
async function deliverPendingMessages(io, userId) {
  try {
    const conversations = await Conversation.find({ participants: userId });
    const conversationIds = conversations.map((c) => c._id);

    const undelivered = await Message.find({
      conversationId: { $in: conversationIds },
      sender: { $ne: userId },
      status: MESSAGE_STATUS.SENT,
    }).select("_id sender");

    if (!undelivered.length) return;

    await Message.updateMany(
      { _id: { $in: undelivered.map((m) => m._id) } },
      { $set: { status: MESSAGE_STATUS.DELIVERED } },
    );

    // Group by sender so each sender gets one batch of status updates.
    const messageIdsBySender = new Map();
    for (const { _id, sender } of undelivered) {
      const senderId = sender.toString();
      if (!messageIdsBySender.has(senderId)) messageIdsBySender.set(senderId, []);
      messageIdsBySender.get(senderId).push(_id);
    }

    for (const [senderId, messageIds] of messageIdsBySender) {
      const senderSocketId = getSocketId(senderId);
      if (!senderSocketId) continue;
      for (const messageId of messageIds) {
        io.to(senderSocketId).emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATED, {
          messageId,
          status: MESSAGE_STATUS.DELIVERED,
        });
      }
    }
  } catch {
    // Best-effort — presence sync shouldn't crash the connection.
  }
}

export function registerConnectionHandlers(io, socket) {
  const userId = socket.user._id.toString();

  setUserOnline(userId, socket.id);
  io.emit(SOCKET_EVENTS.ONLINE_USERS, getOnlineUserIds());
  deliverPendingMessages(io, userId);

  socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, (conversationId) => {
    if (OBJECT_ID_REGEX.test(conversationId)) socket.join(conversationId);
  });

  socket.on(SOCKET_EVENTS.LEAVE_CONVERSATION, (conversationId) => {
    if (OBJECT_ID_REGEX.test(conversationId)) socket.leave(conversationId);
  });

  socket.on("disconnect", async () => {
    // Only clear presence if this is still the user's most recent socket
    // (they may have reconnected already on another tab/device).
    if (getSocketId(userId) !== socket.id) return;

    setUserOffline(userId);
    io.emit(SOCKET_EVENTS.ONLINE_USERS, getOnlineUserIds());
    try {
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    } catch {
      // Non-critical — presence timestamp can be stale without breaking anything.
    }
  });
}
