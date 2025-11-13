import express from "express";
import {
  getAllVideos,
  getVideosByUser,
  deleteVideo,
  createVideo,
} from "../controllers/videoController.js";
import { uploadMiddleware } from "../controllers/videoController.js";

const router = express.Router();

router.get("/", getAllVideos);
router.get("/user/:user_id", getVideosByUser);
router.post("/", uploadMiddleware, createVideo);   // ✅ new route
router.delete("/:id", deleteVideo);

export default router;
