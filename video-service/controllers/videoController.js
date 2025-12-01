import { pool } from "../db.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// Setup multer to parse file uploads
const upload = multer();

// AWS S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadMiddleware = upload.single("thumbnail");
/**
 * @desc Get all videos (paginated)
 * @route GET /videos
 */
export const getAllVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [videos] = await pool.query("SELECT * FROM videos ORDER BY created_at DESC LIMIT ? OFFSET ?", [limit, offset]);
    const [count] = await pool.query("SELECT COUNT(*) AS total FROM videos");

    res.status(200).json({
      total: count[0].total,
      page,
      pages: Math.ceil(count[0].total / limit),
      data: videos,
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * @desc Get videos by user_id
 * @route GET /videos/user/:user_id
 */
export const getVideosByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const [videos] = await pool.query("SELECT * FROM videos WHERE user_id = ? ORDER BY created_at DESC", [user_id]);

    if (videos.length === 0)
      return res.status(404).json({ message: "No videos found for this user" });

    res.status(200).json(videos);
  } catch (error) {
    console.error("Error fetching videos by user:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


/**
 * @desc Delete video by ID
 * @route DELETE /videos/:id
 */
export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM videos WHERE id = ?", [id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Video not found" });

    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * @desc Create a new video entry (metadata only)
 * @route POST /videos
 * @body { user_id, title, description, thumbnail_url }
 */
export const createVideo = async (req, res) => {
  try {
    const { user_id, title, description } = req.body;
    const file = req.file; // thumbnail file

    if (!user_id || !title || !file) {
      return res.status(400).json({
        message: "Missing required fields: user_id, title, thumbnail file",
      });
    }
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        message: `Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`,
      });
    }

    // --- Upload thumbnail to metadata-bucket-abs ---
    const bucket = process.env.OUTPUT_BUCKET; // metadata-bucket-abs
    const region = process.env.AWS_REGION;
    const key = `thumbnails/${user_id}/${Date.now()}-${file.originalname}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const thumbnail_url = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;


    // --- Insert into database ---
    const [result] = await pool.query(
      `INSERT INTO videos (user_id, title, description, thumbnail_url, status)
       VALUES (?, ?, ?, ?, 'uploaded')`,
      [user_id, title, description || null, thumbnail_url]
    );

    const insertedId = result.insertId;

    const [rows] = await pool.query("SELECT * FROM videos WHERE id = ?", [insertedId]);
    const newVideo = rows[0];

    res.status(201).json({
      message: "Video metadata saved successfully",
      id: insertedId,
      data: newVideo,
    });
  } catch (error) {
    console.error("❌ Error creating video entry:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM videos WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Video not found" });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching video by ID:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


