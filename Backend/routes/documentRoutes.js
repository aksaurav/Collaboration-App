import express from "express";
import {
  createDocument,
  getDocument,
  getUserDocuments,
  updatedDocumentTitle,
  shareDocument,
} from "../controllers/documentController.js";
import { protect } from "../middlewares/authMiddleware.js"; // Ensure the folder name is correct (middlewares)

const router = express.Router();

// Route: /api/docs
// GET: Fetch all documents belonging to the logged-in user
// POST: Create a new document
router.route("/").get(protect, getUserDocuments).post(protect, createDocument);
router.post("/:id/share", protect, shareDocument);

// Route: /api/docs/:id
// GET: Fetch a specific document by ID
router.route("/:id").get(getDocument); // Keeping this public so anyone with the link can view

router.patch("/:id/title", updatedDocumentTitle);

export default router;
