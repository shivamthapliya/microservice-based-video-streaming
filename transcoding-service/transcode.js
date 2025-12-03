import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { db } from "./db.js";

import {
  s3,
  pollSqs,
  transcodeToHLS,
  safeDeleteMessage,
  downloadFromS3,
  uploadToS3,
  notifyWebSocket
} from "./utils.js";

dotenv.config();

const OUTPUT_BUCKET = process.env.OUTPUT_BUCKET;

// --- Recursively Upload Output Directory ---
async function uploadDirectory(localDir, bucket, prefix) {
  const files = fs.readdirSync(localDir);
  let masterUrl = null;

  for (const file of files) {
    const fullPath = path.join(localDir, file);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      const nestedMasterUrl = await uploadDirectory(fullPath, bucket, `${prefix}/${file}`);
      if (nestedMasterUrl) masterUrl = nestedMasterUrl;
    } else {
      const result = await uploadToS3(fullPath, bucket, prefix);
      if (file === "master.m3u8" && typeof result === "string" && result.startsWith("http")) {
        masterUrl = result;
      }
    }
  }

  return masterUrl;
}

// --- Polling loop ---
async function pollSQS() {
  try {
    // console.log("test notifyWebSocket");
    const Messages = await pollSqs();
    if (!Messages.length) return;

    for (const msg of Messages) {
      try {
        const body = JSON.parse(msg.Body);
        const record = JSON.parse(body.Message || JSON.stringify(body)).Records[0];
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

        // ✅ Fetch metadata from uploaded video object
        const head = await s3.headObject({ Bucket: bucket, Key: key }).promise();
        const metadata = head.Metadata || {};

        const userId = metadata.userid;
        const videoId = metadata.videoid; // 👈 important

        console.log("📥 Received:", { userId, videoId, key });

        if (!userId || !videoId) {
          console.error("❌ Missing userId or videoId in metadata, skipping file:", key);
          await safeDeleteMessage(msg);
          continue;
        }

        // --- Download video ---
        const inputPath = await downloadFromS3(bucket, key);
        try{
                await notifyWebSocket({userId, videoId, status: "processing"});
              }
              catch(err){
                console.error("❌ WebSocket notification failed:", err.message);
              }
        // --- Transcode to HLS ---
        const outputDir = path.join("outputs", Date.now().toString());
        fs.mkdirSync(outputDir, { recursive: true });
        await transcodeToHLS(inputPath, outputDir);

        // --- Upload all HLS files ---
        const masterUrl = await uploadDirectory(outputDir, OUTPUT_BUCKET, path.basename(outputDir));
        console.log("📤 Uploaded Master URL:", masterUrl);

        // --- Update database record instead of inserting new one ---
        if (masterUrl) {
          try {
            const [result] = await db.query(
              `UPDATE videos 
               SET status = ?, master_url = ?, updated_at = NOW()
               WHERE id = ? AND user_id = ?`,
              ["ready", masterUrl, videoId, userId]
            );

            if (result.affectedRows > 0) {
              console.log(`✅ Updated video ${videoId} for user ${userId} as READY`);
              try{
                await notifyWebSocket({userId, videoId, status: "ready"});
              }
              catch(err){
                console.error("❌ WebSocket notification failed:", err.message);
              }
            } else {
              console.warn(`⚠️ No video found for videoId=${videoId}, userId=${userId}`);
            }
          } catch (dbErr) {
            console.error("❌ Database update error:", dbErr.message);
          }
        }

        // --- Cleanup ---
        await safeDeleteMessage(msg);
      } catch (err) {
        console.error("❌ Error processing message:", err.message);
      }
    }
  } catch (err) {
    console.error("❌ Poll error:", err.message);
  }
}

// --- Loop ---
async function startPollingLoop() {
  while (true) {
    await pollSQS();
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

startPollingLoop();
