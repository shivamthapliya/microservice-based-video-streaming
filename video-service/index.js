import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";
import videoRoutes from "./routes/videoRoutes.js";

dotenv.config();

const app = express();

// ===== Middleware =====
app.use(cors());
app.use(express.json());

// ===== Routes =====
app.use("/videos", videoRoutes);

// ===== Root endpoint =====
app.get("/", (req, res) => {
  res.send("🎬 Video microservice is running...");
});

// ===== Database connection test =====
(async () => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS now");
    console.log("✅ Connected to AWS RDS MySQL at:", process.env.DB_HOST);
    console.log("🕒 Current DB Time:", rows[0].now);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
})();

// ===== Server start =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
