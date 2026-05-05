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

// 2. Allowed Origins
const allowedOrigins = [
  "https://collaboration-app-d4ze.vercel.app",
  "https://collaboration-app-1.onrender.com",
  "https://collaboration-app-delta.vercel.app",
  "http://localhost:5173",
];

// 3. CORS Middleware (Express)
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.error("❌ CORS blocked:", origin);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

// 4. Health Check Route
app.get("/", (req, res) => {
  res.send("Real-Time Doc Engine API is live.");
});

// 5. API Routes
app.use("/api/docs", documentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);

// 6. Socket.IO Setup
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // important for production
});

// 7. Socket Connection Debug (VERY useful)
io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// 8. Initialize your socket logic
socketHandler(io);

// 9. Error Middleware (must be last)
app.use(errorHandler);

// 10. Start Server
const PORT = process.env.PORT || 8000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
