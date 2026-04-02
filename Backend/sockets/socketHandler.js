import Document from "../models/Document.js";

export const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`📡 New Connection: ${socket.id}`);

    socket.on("get-document", async (documentId) => {
      // 1. Join a unique room for this document
      socket.join(documentId);

      try {
        // 2. Fetch initial content and populate owner/collaborators for the UI
        const document = await Document.findById(documentId).populate(
          "owner collaborators",
          "username email avatarColor",
        );

        // 3. Send initial data back to the requester
        // We send the whole doc so the frontend gets { content, title, collaborators }
        socket.emit("load-document", {
          content: document?.content || {},
          title: document?.title || "Untitled Document",
          collaborators: document?.collaborators || [],
          owner: document?.owner,
        });

        // 4. Handle Real-Time Content Changes (Quill Deltas)
        socket.on("send-changes", (delta) => {
          socket.broadcast.to(documentId).emit("receive-changes", delta);
        });

        // 5. NEW: Handle Real-Time Title Updates
        // Matches your frontend: socket.emit("update-title", title);
        socket.on("update-title", async (newTitle) => {
          try {
            await Document.findByIdAndUpdate(documentId, { title: newTitle });
            // Notify everyone else in the room to update their header
            socket.broadcast
              .to(documentId)
              .emit("receive-title-update", newTitle);
          } catch (err) {
            console.error("❌ Title update failed:", err.message);
          }
        });

        // 6. NEW: Handle Real-Time Sharing/Presence
        // When the "Share" API call succeeds, the frontend can emit this
        socket.on("user-shared", (newCollaborator) => {
          // Broadcast to the room so the avatar bubbles update instantly
          io.in(documentId).emit("collaborator-added", newCollaborator);
        });

        // 7. Auto-Save Logic (Content Only)
        socket.on("save-document", async (content) => {
          try {
            await Document.findByIdAndUpdate(documentId, { content });
          } catch (err) {
            console.error("❌ Auto-save failed:", err.message);
          }
        });
      } catch (err) {
        console.error("❌ Socket Data Fetch Error:", err.message);
      }

      // 8. Cleanup when a user leaves the document
      socket.on("leave-document", () => {
        socket.leave(documentId);
        console.log(`🚪 User left room: ${documentId}`);
      });
    });

    socket.on("disconnect", () => {
      console.log(`🔌 User Disconnected: ${socket.id}`);
    });
  });
};
