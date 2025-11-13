import React, { useEffect, useState } from "react";
import api from "../components/api/axiosClient";
import VideoPlayer from "./VideoPlayer";

const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);

  // ✅ Fetch all videos (paginated)
  const fetchVideos = async (pageNum = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/videos?page=${pageNum}&limit=6`);
      console.log("Fetched videos data:", data);
      setVideos(data?.data ?? []);
      setPages(data?.pages ?? 1);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch videos by user ID
  const fetchUserVideos = async () => {
    if (!userId.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/videos/user/${userId}`);
      setVideos(data ?? []);
      setPages(1);
      setPage(1);
    } catch (error) {
      console.error("Error fetching user videos:", error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete a video
  const deleteVideo = async (id) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;
    try {
      await api.delete(`/videos/${id}`);
      setVideos(videos.filter((v) => v.id !== id));
    } catch (error) {
      console.error("Error deleting video:", error);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">🎬 Video Management</h1>

      {/* ✅ Search by user_id */}
      <div className="flex justify-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Enter user_id..."
          className="px-4 py-2 rounded-lg text-black w-64"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <button
          onClick={fetchUserVideos}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Search
        </button>
        <button
          onClick={() => fetchVideos(1)}
          className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          Reset
        </button>
      </div>

      {/* ✅ Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-11/12 max-w-4xl relative">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-2 right-2 text-white text-2xl hover:text-red-400"
            >
              ✖
            </button>
            <h2 className="text-xl font-semibold mb-3">{selectedVideo.title}</h2>
            <VideoPlayer src={selectedVideo.master_url} />
          </div>
        </div>
      )}

      {/* ✅ Loading / No Data */}
      {loading ? (
        <p className="text-center text-lg text-gray-400">Loading videos...</p>
      ) : videos.length === 0 ? (
        <p className="text-center text-lg text-gray-400">No videos found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-gray-800 p-4 rounded-xl shadow-lg relative hover:scale-105 transition-transform duration-300"
            >
              <img
                src={
                  video.thumbnail_url ||
                  "https://via.placeholder.com/400x225?text=No+Thumbnail"
                }
                alt={video.title}
                className="rounded-lg mb-3 w-full h-48 object-cover cursor-pointer"
                onClick={() => setSelectedVideo(video)}
              />
              <h2 className="text-xl font-semibold truncate">{video.title}</h2>
              <p className="text-gray-400 text-sm truncate">
                {video.description || "No description"}
              </p>
              <p className="mt-2 text-sm">
                <span className="font-semibold">Status:</span>{" "}
                <span
                  className={
                    video.status === "ready"
                      ? "text-green-400"
                      : video.status === "processing"
                      ? "text-yellow-400"
                      : video.status === "failed"
                      ? "text-red-400"
                      : "text-gray-400"
                  }
                >
                  {video.status}
                </span>
              </p>
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => setSelectedVideo(video)}
                  className="bg-blue-600 px-3 py-1 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Watch
                </button>
                <button
                  onClick={() => deleteVideo(video.id)}
                  className="bg-red-600 px-3 py-1 rounded-lg hover:bg-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Pagination Controls */}
      {!loading && pages > 1 && (
        <div className="flex justify-center mt-8 gap-3 items-center">
          {page > 1 && (
            <button
              onClick={() => fetchVideos(page - 1)}
              className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              ◀ Previous
            </button>
          )}

          <span className="px-4 py-2 bg-gray-800 rounded-lg">
            Page {page} of {pages}
          </span>

          {page < pages && (
            <button
              onClick={() => fetchVideos(page + 1)}
              className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Next ▶
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoList;
