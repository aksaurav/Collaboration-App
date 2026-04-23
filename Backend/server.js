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

// 2. Socket.io Setup
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// 3. Global Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"], // CRITICAL: Authorization must be here
    credentials: true,
  }),
);
app.use(express.json());

// 4. Base Health Check (Optional but recommended)
app.get("/", (req, res) => res.send("Real-Time Doc Engine API is live."));

// 5. REST API Routes
app.use("/api/docs", documentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);

// 6. Initialize Socket Logic
socketHandler(io);

// 7. Error Middleware (MUST be after all routes)
app.use(errorHandler);

// 8. Start Server
const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
