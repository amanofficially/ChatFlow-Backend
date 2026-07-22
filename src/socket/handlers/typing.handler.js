// ============================================================
// socket/handlers/typing.handler.js
//
// The original code had two almost-identical handlers for
// "typingStart" and "typingStop" — same room broadcast, same
// "also emit directly to participants who aren't in the room"
// loop, just a different event name. Here that's one factory
// function parameterized by event name.
// ============================================================
import Conversation from "../../models/Conversation.js";
import { broadcastToConversation } from "../broadcast.js";

function makeTypingHandler(io, socket, event) {
  return async ({ conversationId }) => {
    const userId = socket.user._id.toString();

    try {
      const conversation = await Conversation.findById(conversationId).select("participants");
      if (!conversation) return;

      const participantIds = conversation.participants.map((id) => id.toString());
      broadcastToConversation(
        io,
        conversationId,
        participantIds,
        event,
        { userId, conversationId },
        userId,
        socket.id,
      );
    } catch {
      // Best-effort — a missed typing indicator isn't worth surfacing an error for.
    }
  };
}

export function registerTypingHandlers(io, socket) {
  socket.on("typingStart", makeTypingHandler(io, socket, "typingStart"));
  socket.on("typingStop", makeTypingHandler(io, socket, "typingStop"));
}
