import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import documentRoutes from "./routes/documentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import { socketHandler } from "./sockets/socketHandler.js";
import { errorHandler } from "./middlewares/errorMiddleware.js";

// 1. Load Config & Connect DB
dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);

// 2. Define Allowed Origins

const allowedOrigins = [
  "https://collaboration-app-d4ze.vercel.app",
  "https://collaboration-app-plum.vercel.app",
  "http://localhost:5173",
];

// 3. Socket.io Setup
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins, // Use the same array for Socket.io
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// 4. Global Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allows any URL ending in .vercel.app or localhost
      if (
        !origin ||
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());

// 5. Base Health Check
app.get("/", (req, res) => res.send("Real-Time Doc Engine API is live."));

// 6. REST API Routes
app.use("/api/docs", documentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);

// 7. Initialize Socket Logic
socketHandler(io);

// 8. Error Middleware (MUST be after all routes)
app.use(errorHandler);

// 9. Start Server
const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
