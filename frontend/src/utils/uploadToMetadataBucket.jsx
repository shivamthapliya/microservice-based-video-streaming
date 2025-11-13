import { uploadData } from "aws-amplify/storage";

/**
 * Uploads thumbnails or metadata files directly to your metadata bucket
 * without triggering SQS events from the main bucket.
 */
export async function uploadToMetadataBucket(file, userId) {
  try {
    if (!file) throw new Error("File is required");
    if (!userId) throw new Error("User ID is required");

    const bucket = import.meta.env.VITE_OUTPUT_BUCKET; // metadata-bucket-abs
    const region = import.meta.env.VITE_AWS_REGION;
    const key = `thumbnails/${userId}/${Date.now()}-${file.name}`;

    console.log("📤 Uploading thumbnail to metadata bucket:", bucket);

    // ✅ Explicitly specify the metadata bucket for this upload
    const uploadResult = await uploadData({
      key,
      data: file,
      options: {
        accessLevel: "private",
        contentType: file.type,
        bucket, // 👈 tells Amplify which bucket to use
      },
    }).result;

    const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    console.log("✅ Metadata uploaded successfully:", fileUrl);
    return fileUrl;
  } catch (err) {
    console.error("❌ Metadata upload failed:", err);
    throw err;
  }
}
