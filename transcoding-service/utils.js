import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import axios from "axios";
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";

// --- Configure AWS SDK v2 (S3 still uses v2 here) ---
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,  // set in .env
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// --- AWS Clients ---
export const s3 = new AWS.S3({ region: process.env.AWS_REGION });

// --- SQS Client (v3) ---
const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

// --- Download from S3 ---
export async function downloadFromS3(bucket, key, downloadDir = "downloads") {
  const localPath = path.join(downloadDir, path.basename(key));
  fs.mkdirSync(downloadDir, { recursive: true });

  try {
    const fileStream = fs.createWriteStream(localPath);
    await new Promise((resolve, reject) => {
      s3.getObject({ Bucket: bucket, Key: key })
        .createReadStream()
        .pipe(fileStream)
        .on("close", resolve)
        .on("error", reject);
    });

    console.log("✅ Downloaded from S3:", key, "→", localPath);
    return localPath;
  } catch (err) {
    console.error("❌ Failed to download from S3:", key, err.message);
    throw err;
  }
}
 //notify lambda 
export async function notifyWebSocket({userId, videoId, status}) {
  const url = process.env.WEBSOCKET_HTTP_ENDPOINT; 

  try {
    await axios.post(url, {
      action: "notify",
      userId,
      videoId,
      status
    });

    console.log("🔔 NOTIFIED WS:", { userId, videoId, status });

  } catch (err) {
    // console.log("error from notify",err);
    console.error("❌ WS notify failed:", err.response?.data || err.message);
  }
}

// --- Upload to S3 ---
export async function uploadToS3(localFilePath, bucket, prefix = "") {
  try {
    const fileContent = fs.readFileSync(localFilePath);
    const key = `${prefix}/${path.basename(localFilePath)}`;
    const fileName = path.basename(localFilePath);

    const contentType = localFilePath.endsWith(".m3u8")
      ? "application/vnd.apple.mpegurl"
      : "video/MP2T";

    await s3
      .putObject({
        Bucket: bucket,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
      })
      .promise();

    // If this is master.m3u8, return the full S3 URL
    if (fileName === "master.m3u8") {
      const url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      console.log("✅ Uploaded to S3 (master playlist):", url);
      return url;
    }
    console.log("✅ Uploaded to S3:", key);
    return key;
  } catch (err) {
    console.error("❌ Failed to upload to S3:", localFilePath, err.message);
    throw err;
  }
}

// --- Transcoding: Multi-resolution HLS ---
// export async function transcodeToHLS(inputPath, outputDir) {
//   fs.mkdirSync(outputDir, { recursive: true });

//   const renditions = [
//     { name: "144p", height: 144, videoBitrate: "150k", audioBitrate: "64k", bandwidth: 150000 },
//     { name: "260p", height: 260, videoBitrate: "350k", audioBitrate: "64k", bandwidth: 350000 },
//   ];

//   const playlistPaths = [];

//   for (const r of renditions) {
//     const renditionDir = path.join(outputDir, r.name);
//     fs.mkdirSync(renditionDir, { recursive: true });

//     const playlistPath = path.join(renditionDir, "index.m3u8");
//     playlistPaths.push({ name: r.name, path: playlistPath, height: r.height, bandwidth: r.bandwidth });

//     console.log(`🎞️ Transcoding ${r.name}...`);

//     await new Promise((resolve, reject) => {
//       ffmpeg(inputPath)
//         .outputOptions([
//           `-vf scale=-2:${r.height}`,
//           `-c:v h264`,
//           `-b:v ${r.videoBitrate}`,
//           `-c:a aac`,
//           `-b:a ${r.audioBitrate}`,
//           "-hls_time 4",
//           "-hls_list_size 0",
//           "-start_number 0",
//           "-f hls",
//         ])
//         .output(playlistPath)
//         .on("end", () => {
//           console.log(`✅ Finished ${r.name}`);
//           resolve();
//         })
//         .on("error", reject)
//         .run();
//     });
//   }

//   // Generate master playlist
//   const masterPlaylistPath = path.join(outputDir, "master.m3u8");
//   const masterContent = playlistPaths
//     .map(
//       (p) =>
//         `#EXT-X-STREAM-INF:BANDWIDTH=${p.bandwidth},RESOLUTION=426x${p.height}\n${p.name}/index.m3u8`
//     )
//     .join("\n");

//   fs.writeFileSync(masterPlaylistPath, `#EXTM3U\n${masterContent}\n`);
//   console.log("📄 Master playlist created:", masterPlaylistPath);

//   return outputDir;
// }


export async function transcodeToHLS(inputPath, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });

  const renditions = [
    { name: "144p", height: 144, videoBitrate: "150k", audioBitrate: "64k", bandwidth: 150000 },
    { name: "260p", height: 260, videoBitrate: "350k", audioBitrate: "64k", bandwidth: 350000 },
    { name: "480p", height: 480, videoBitrate: "800k", audioBitrate: "96k", bandwidth: 800000 }, // 👈 Added this
  ];

  const playlistPaths = [];

  for (const r of renditions) {
    const renditionDir = path.join(outputDir, r.name);
    fs.mkdirSync(renditionDir, { recursive: true });

    const playlistPath = path.join(renditionDir, "index.m3u8");
    playlistPaths.push({ name: r.name, path: playlistPath, height: r.height, bandwidth: r.bandwidth });

    console.log(`🎞️ Transcoding ${r.name}...`);

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          `-vf scale=-2:${r.height}`,
          `-c:v h264`,
          `-b:v ${r.videoBitrate}`,
          `-c:a aac`,
          `-b:a ${r.audioBitrate}`,
          "-hls_time 4",
          "-hls_list_size 0",
          "-start_number 0",
          "-f hls",
        ])
        .output(playlistPath)
        .on("end", () => {
          console.log(`✅ Finished ${r.name}`);
          resolve();
        })
        .on("error", reject)
        .run();
    });
  }

  // --- Generate master playlist ---
  const masterPlaylistPath = path.join(outputDir, "master.m3u8");
  const masterContent = playlistPaths
    .map(
      (p) =>
        `#EXT-X-STREAM-INF:BANDWIDTH=${p.bandwidth},RESOLUTION=854x${p.height}\n${p.name}/index.m3u8`
    )
    .join("\n");

  fs.writeFileSync(masterPlaylistPath, `#EXTM3U\n${masterContent}\n`);
  console.log("📄 Master playlist created:", masterPlaylistPath);

  return outputDir;
}




// --- Poll SQS (v3 style) ---
export async function pollSqs() {
  console.log("Polling SQS in region:", process.env.AWS_REGION);

  try {
    const command = new ReceiveMessageCommand({
      QueueUrl: process.env.QUEUE_URL,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 20,
    });

    const { Messages } = await sqsClient.send(command);
    return Messages || [];
  } catch (err) {
    console.error("❌ Polling SQS failed:", err.message);
    throw err;
  }
}

// --- Safe Delete Message (v3 style) ---
export async function safeDeleteMessage(msg) {
  for (let i = 0; i < 3; i++) {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: process.env.QUEUE_URL,
        ReceiptHandle: msg.ReceiptHandle,
      });

      await sqsClient.send(command);
      console.log("✅ Message deleted:", msg.MessageId);
      return true;
    } catch (err) {
      console.error("⚠️ Delete failed, retrying...", err.message);
    }
  }

  const error = new Error(`❌ Delete failed permanently for: ${msg.MessageId}`);
  console.error(error.message);
  throw error;
}
