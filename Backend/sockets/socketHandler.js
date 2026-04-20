import Document from "../models/Document.js";

// This object tracks active users in memory
// Format: { "docId123": [{ id: "u1", username: "Joy", color: "#hex" }, ...] }
const roomUsers = {};

export const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`📡 New Connection: ${socket.id}`);

    socket.on("get-document", async (documentId) => {
      // 1. Join a unique room for this document
      socket.join(documentId);

      try {
        // 2. Fetch initial content
        const document = await Document.findById(documentId).populate(
          "owner collaborators",
          "username email avatarColor",
        );

        // 3. Send initial data back
        socket.emit("load-document", {
          content: document?.content || {},
          title: document?.title || "Untitled Document",
          collaborators: document?.collaborators || [],
          owner: document?.owner,
        });

        // --- PRESENCE LOGIC START ---

        // 4. Track Presence (Using the user data from socket)
        // Note: Assumes socket.user was populated by your auth middleware
        if (socket.user) {
          if (!roomUsers[documentId]) roomUsers[documentId] = [];

          // Add user if not already present in the room list
          const alreadyInRoom = roomUsers[documentId].find(
            (u) => u.id === socket.user.id,
          );
          if (!alreadyInRoom) {
            roomUsers[documentId].push({
              id: socket.user.id,
              username: socket.user.username,
              color: socket.user.avatarColor || "#6366f1",
            });
          }

          // Broadcast the updated list of active users to everyone in the room
          io.in(documentId).emit("update-presence", roomUsers[documentId]);
        }

        // --- CONTENT & TITLE SYNC ---

        // 5. Handle Real-Time Content Changes
        socket.on("send-changes", (delta) => {
          socket.broadcast.to(documentId).emit("receive-changes", delta);
        });

        // 6. Handle Real-Time Title Updates
        socket.on("update-title", async (newTitle) => {
          try {
            await Document.findByIdAndUpdate(documentId, { title: newTitle });
            socket.broadcast
              .to(documentId)
              .emit("receive-title-update", newTitle);
          } catch (err) {
            console.error("❌ Title update failed:", err.message);
          }
        });

        // 7. Handle Permanent Collaborator Additions (Sharing)
        socket.on("user-shared", (newCollaborator) => {
          io.in(documentId).emit("collaborator-added", newCollaborator);
        });

        // 8. Auto-Save Logic
        socket.on("save-document", async (content) => {
          try {
            await Document.findByIdAndUpdate(documentId, { content });
          } catch (err) {
            console.error("❌ Auto-save failed:", err.message);
          }
        });

        // --- CLEANUP ---

        // 9. Handle leaving the document explicitly
        socket.on("leave-document", () => {
          cleanupUserPresence(socket, documentId, io);
          socket.leave(documentId);
        });

        // 10. Handle unexpected disconnection (tab closed)
        socket.on("disconnect", () => {
          cleanupUserPresence(socket, documentId, io);
          console.log(`🔌 User Disconnected from ${documentId}: ${socket.id}`);
        });
      } catch (err) {
        console.error("❌ Socket Data Fetch Error:", err.message);
      }
    });
  });
};

/**
 * Helper function to remove a user from the active presence registry
 */
function cleanupUserPresence(socket, documentId, io) {
  if (socket.user && roomUsers[documentId]) {
    roomUsers[documentId] = roomUsers[documentId].filter(
      (u) => u.id !== socket.user.id,
    );

    // Broadcast the new list so the bubbles disappear for others
    io.in(documentId).emit("update-presence", roomUsers[documentId]);

    // Clean up memory if room is empty
    if (roomUsers[documentId].length === 0) {
      delete roomUsers[documentId];
    }
  }
}
