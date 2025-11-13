import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../components/api/axiosClient";
import {
  getCurrentUser,
  fetchUserAttributes,
  fetchAuthSession,
} from "aws-amplify/auth";
import { uploadData, getUrl } from "aws-amplify/storage";
import awsconfig from "../aws-exports";
import { Amplify } from "aws-amplify";

// ✅ Configure Amplify for main video uploads (NOT thumbnails)
Amplify.configure({
  ...awsconfig,
  Storage: {
    AWSS3: {
      bucket: "my-existing-bucket-name", // your main S3 bucket (SQS-triggered)
      region: "ap-south-1",
    },
  },
});

export default function ProtectedPage() {
  const thumbnailInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [attrs, setAttrs] = useState(null);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [videoId, setVideoId] = useState(null);

  // Metadata form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [step, setStep] = useState(1); // 1 = metadata form, 2 = video upload

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const session = await fetchAuthSession();
        const u = await getCurrentUser();
        const a = await fetchUserAttributes();
        setUser(u);
        setAttrs(a);
      } catch (err) {
        console.error("Auth check failed:", err);
        navigate("/login");
      }
    })();
  }, [navigate]);

  // Handle input changes
  const handleThumbnailChange = (e) => setThumbnail(e.target.files[0]);
  const handleFileChange = (e) => setFile(e.target.files[0]);

  // ✅ Step 1: Send metadata + thumbnail to backend (single API call)
  const handleMetadataSubmit = async () => {
    if (!title || !description || !thumbnail)
      return alert("Please fill all fields and choose a thumbnail.");

    try {
      const userAttributes = await fetchUserAttributes();
      const userId = userAttributes.sub;

      // Build FormData to send file + fields together
      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("thumbnail", thumbnail); // 👈 file field must match multer().single("thumbnail")
      setTitle("");
      setDescription("");
      setThumbnail(null);

      // ✅ reset file input safely using ref
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = "";
      }

      // No need to manually set headers; Axios will handle it
      const { data } = await api.post("/videos", formData);

      console.log("✅ Metadata API response:", data);

      if (!data || !data.id) {
        alert("Something went wrong while saving metadata. Please try again.");
        return;
      }

      setVideoId(data.id);
      alert("Metadata saved successfully! Now upload your video.");

      setStep(2);

      setStep(2);
    } catch (err) {
      console.error("❌ Metadata error:", err);
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  // ✅ Step 2: Upload video to main bucket (Amplify)
  const handleUploadVideo = async () => {
    if (!file) return alert("Please choose a video file first!");
    if (!videoId) return alert("Please complete metadata step first!");

    try {
      const key = `videos/${Date.now()}-${file.name}`;
      const userAttributes = await fetchUserAttributes();
      const userId = userAttributes.sub;

      const uploadResult = await uploadData({
        key,
        data: file,
        options: {
          accessLevel: "private",
          contentType: file.type,
          metadata: { userid: userId, videoid: videoId },
          onProgress: ({ transferredBytes, totalBytes }) => {
            const percent = Math.round((transferredBytes / totalBytes) * 100);
            setProgress(percent);
          },
        },
      }).result;

      console.log("✅ Video uploaded:", uploadResult);

      const url = await getUrl({ key, options: { accessLevel: "private" } });
      setUploadedUrl(url?.url?.href);

      alert("Video uploaded! Transcoding will start automatically.");
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("Upload failed: " + err.message);
    }
  };

  if (!user) return <p className="mt-20 text-center">Checking login...</p>;

  return (
    <div className="flex flex-col items-center gap-6 mt-20">
      <h2 className="text-2xl font-bold">
        Welcome, {attrs?.email ?? user.username} 👋
      </h2>

      {/* <div className="bg-gray-50 p-3 rounded text-sm w-96 overflow-x-auto">
        <pre>{JSON.stringify({ user, attrs }, null, 2)}</pre>
      </div> */}

      {/* Step 1 - Metadata Form */}
      {step === 1 && (
        <div className="border p-5 rounded-md w-96 shadow-md flex flex-col gap-3">
          <h3 className="font-semibold text-lg text-center text-gray-600">
            Upload Video
          </h3>

          <input
            type="text"
            placeholder="Title"
            className="border p-2 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            placeholder="Description"
            className="border p-2 rounded"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex flex-col">
            {/* <label className="font-medium mb-1">Thumbnail</label> */}

            <div className="relative flex items-center justify-between border rounded p-2 cursor-pointer bg-white hover:bg-gray-50">
              {/* Hidden File Input */}
              <input
                type="file"
                accept="image/*"
                ref={thumbnailInputRef}
                onChange={handleThumbnailChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />

              {/* Display file name or placeholder */}
              <span className="text-gray-600 text-sm truncate">
                {thumbnail ? thumbnail.name : "Choose Thumbnail"}
              </span>

              {/* Upload Icon/Button */}
              <span className="text-blue-600 font-medium text-sm ml-2">
                Browse
              </span>
            </div>
          </div>

          <button
            onClick={handleMetadataSubmit}
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Save & Continue
          </button>
        </div>
      )}

      {/* Step 2 - Video Upload */}
      {step === 2 && (
        <div className="flex flex-col items-center border p-5 rounded-md w-96 shadow-md">
          <h3 className="font-semibold mb-2">Upload Your Video</h3>

          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="border p-2 w-full mb-3"
          />

          <div className="flex gap-3">
            <button
              onClick={handleUploadVideo}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Upload Video
            </button>
          </div>

          {progress > 0 && progress < 100 && (
            <p className="mt-3 text-gray-700">Uploading... {progress}%</p>
          )}

          {uploadedUrl && (
            <div className="mt-4 text-center">
              <p className="font-medium text-green-600">✅ Upload complete!</p>
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline break-all"
              >
                {uploadedUrl}
              </a>
            </div>
          )}
        </div>
      )}
      <button
        onClick={() => navigate("/video")}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Check uploaded Videos
      </button>
    </div>
  );
}
