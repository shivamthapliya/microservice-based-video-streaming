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
      bucket: "my-existing-bucket-name",
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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [step, setStep] = useState(1);
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

  const handleMetadataSubmit = async () => {
    if (!title || !description || !thumbnail)
      return alert("Please fill all fields and choose a thumbnail.");

    try {
      setMetadataLoading(true);

      const userAttributes = await fetchUserAttributes();
      const userId = userAttributes.sub;

      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("thumbnail", thumbnail);

      // const { data } = await api.post("/videos", formData);
      try {
        const { data } = await api.post("/videos", formData);
        if (!data || !data.id) {
          alert(
            "Something went wrong while saving metadata. Please try again."
          );
          return;
        }
        setVideoId(data.id);
        setStep(2);

        setTitle("");
        setDescription("");
        setThumbnail(null);
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
      } catch (err) {
        const message =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Something went wrong.";

        toast.error(message, { duration: 3000 });
      }
      // console.log("✅ Metadata API response:", data);
    } catch (err) {
      console.error("❌ Metadata error:", err);
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setMetadataLoading(false);
    }
  };

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
          duration: 4000,
        }
      );
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("Upload failed: " + err.message);
    }
  };

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Checking login...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <h1 className="text-2xl font-bold">
              Welcome, {attrs?.email ?? user.username}{" "}
              <span className="inline-block animate-wave origin-[70%_70%]">
                👋
              </span>
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            Share your amazing content with the world
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                  step === 1
                    ? "bg-blue-600 text-white shadow-lg scale-110"
                    : "bg-green-500 text-white"
                }`}
              >
                {step > 1 ? "✓" : "1"}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">
                Metadata
              </span>
            </div>
            <div
              className={`h-1 w-20 rounded transition-all duration-300 ${
                step > 1 ? "bg-green-500" : "bg-gray-300"
              }`}
            ></div>
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                  step === 2
                    ? "bg-blue-600 text-white shadow-lg scale-110"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">
                Upload
              </span>
            </div>
          </div>
        </div>

        {/* Step 1 - Metadata Form */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Video Details
              </h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Enter an engaging title..."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={metadataLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Tell viewers about your video..."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={metadataLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Thumbnail
                </label>
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    ref={thumbnailInputRef}
                    onChange={handleThumbnailChange}
                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    disabled={metadataLoading}
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-xl px-6 py-8 text-center cursor-pointer transition-all group-hover:border-blue-500 group-hover:bg-blue-50">
                    {thumbnail ? (
                      <div className="flex items-center justify-center gap-3">
                        <svg
                          className="w-8 h-8 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <div className="text-left">
                          <p className="font-medium text-gray-800 truncate max-w-xs">
                            {thumbnail.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Click to change
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <svg
                          className="w-12 h-12 mx-auto text-gray-400 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-gray-600 font-medium">
                          Choose a thumbnail
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          PNG, JPG up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleMetadataSubmit}
                disabled={metadataLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {metadataLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    Save & Continue
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2 - Video Upload */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Upload Your Video
              </h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Video File
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                </div>
                {file && (
                  <p className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {file.name}
                  </p>
                )}
              </div>

              <button
                onClick={handleUploadVideo}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload Video
              </button>

              {progress > 0 && progress < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      Uploading...
                    </span>
                    <span className="font-bold text-purple-600">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {uploadedUrl && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="font-bold text-xl text-green-700 mb-1">
                    Upload Complete!
                  </p>
                  <p className="text-green-600 text-sm">
                    Your video is being processed
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Action Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/video")}
            className="inline-flex items-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-gray-200 hover:border-gray-300"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Check Uploaded Videos
          </button>
        </div>
      </div>
    </div>
  );
}
