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
import toast from "react-hot-toast";


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

  // ⭐ NEW STATE: Metadata loading
  const [metadataLoading, setMetadataLoading] = useState(false);

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

  const handleThumbnailChange = (e) => setThumbnail(e.target.files[0]);
  const handleFileChange = (e) => setFile(e.target.files[0]);

  // ✅ Step 1: Save metadata and thumbnail
  const handleMetadataSubmit = async () => {
    if (!title || !description || !thumbnail)
      return alert("Please fill all fields and choose a thumbnail.");

    try {
      setMetadataLoading(true); // ⭐ START LOADING

      const userAttributes = await fetchUserAttributes();
      const userId = userAttributes.sub;

      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("thumbnail", thumbnail);

      const { data } = await api.post("/videos", formData);
      console.log("✅ Metadata API response:", data);

      if (!data || !data.id) {
        alert("Something went wrong while saving metadata. Please try again.");
        return;
      }

      setVideoId(data.id);
      setStep(2);

      // Reset after success
      setTitle("");
      setDescription("");
      setThumbnail(null);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
    } catch (err) {
      console.error("❌ Metadata error:", err);
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setMetadataLoading(false); // ⭐ END LOADING
    }
  };

  // Step 2 - Upload video file to S3
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
      toast.success(
      "Your video is being transcoded, check the uploaded videos.",
      {
        duration: 4000, // 4 sec
      }
    );
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
            disabled={metadataLoading}
          />

          <textarea
            placeholder="Description"
            className="border p-2 rounded"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={metadataLoading}
          />

          <div className="relative flex items-center justify-between border rounded p-2 cursor-pointer bg-white hover:bg-gray-50">
            <input
              type="file"
              accept="image/*"
              ref={thumbnailInputRef}
              onChange={handleThumbnailChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={metadataLoading}
            />
            <span className="text-gray-600 text-sm truncate">
              {thumbnail ? thumbnail.name : "Choose Thumbnail"}
            </span>
            <span className="text-blue-600 font-medium text-sm ml-2">
              Browse
            </span>
          </div>

          <button
            onClick={handleMetadataSubmit}
            disabled={metadataLoading}
            className={`bg-blue-600 text-white py-2 rounded hover:bg-blue-700 
              ${metadataLoading && "opacity-50 cursor-not-allowed"}`}
          >
            {metadataLoading ? "Saving..." : "Save & Continue"}
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

          <button
            onClick={handleUploadVideo}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Upload Video
          </button>

          {progress > 0 && progress < 100 && (
            <p className="mt-3 text-gray-700">Uploading... {progress}%</p>
          )}

          {uploadedUrl && (
            <div className="mt-4 text-center">
              <p className="font-medium text-blue-500">Upload complete!</p>
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
