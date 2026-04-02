import express from "express";
import { generateAIText } from "../controllers/aiController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/generate", protect, generateAIText);

export default router;
