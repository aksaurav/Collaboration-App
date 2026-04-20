import express from "express";
import {
  createDocument,
  getDocument,
  getUserDocuments,
  updatedDocumentTitle,
  shareDocument,
  saveVersion,
  getVersion,
  deleteDoc,
} from "../controllers/documentController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/:id/versions", protect, saveVersion);

router.route("/").get(protect, getUserDocuments).post(protect, createDocument);
router.post("/:id/share", protect, shareDocument);

router.route("/:id").get(getDocument);

router.patch("/:id/title", updatedDocumentTitle);

router.get("/:id/versions", protect, getVersion);
router.delete("/:id", protect, deleteDoc);
export default router;
