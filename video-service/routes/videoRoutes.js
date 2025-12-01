import express from "express";
import {
  getAllVideos,
  getVideosByUser,
  deleteVideo,
  createVideo,
  getVideoById,
} from "../controllers/videoController.js";
import { uploadMiddleware } from "../controllers/videoController.js";

const router = express.Router();

router.get("/", getAllVideos);
router.get("/user/:user_id", getVideosByUser);
router.post("/", uploadMiddleware, createVideo);   // ✅ new route
router.delete("/:id", deleteVideo);
router.get("/:id", getVideoById);

export default router;
