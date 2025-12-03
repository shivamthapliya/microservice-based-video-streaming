import React, { useEffect, useState } from "react";
import api from "../components/api/axiosClient";
import VideoPlayer from "./VideoPlayer";
import { useWebSocket } from "../context/webSocketContext";

const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const { videoStatuses } = useWebSocket();

  const fetchVideos = async (pageNum = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/videos?page=${pageNum}&limit=6`);
      console.log("vid array", videos);
      setVideos(data?.data ?? []);
      setPages(data?.pages ?? 1);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    const fetchUpdatedVideos = async () => {
      const updatedList = [];

      for (const id in videoStatuses) {
        const status = videoStatuses[id];

        if (status === "ready") {
          try {
            const res = await api.get(`/videos/${id}`);
            updatedList.push(res.data);
          } catch (e) {
            console.error("Error fetching video:", e);
          }
        }
      }

      setVideos((prev) =>
        prev.map((v) => {
          const incomingStatus = videoStatuses[v.id];

          if (!incomingStatus) return v;

          if (incomingStatus === "ready") {
            const updated = updatedList.find((u) => u.id === v.id);
            return updated ? { ...v, ...updated } : v;
          }

          return { ...v, status: incomingStatus };
        })
      );
    };

    fetchUpdatedVideos();
  }, [videoStatuses]);

  const getStatusBadge = (status) => {
    const styles = {
      ready: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      processing: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      failed: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      default: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${
          styles[status] || styles.default
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-50 to-purple-50 text-gray-800">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeInUp 1s ease-out;
        }

        @keyframes slideRight {
          from {
            left: -100%;
          }
          to {
            left: 100%;
          }
        }
        
        .watch-button-shine {
          position: relative;
          overflow: hidden;
        }
        
        .watch-button-shine::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
          transition: none;
        }
        
        .watch-button-shine:hover::before {
          animation: slideRight 0.6s ease-in-out;
        }
      `}</style>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Video Management
          </h1>
          <p className="text-gray-700 text-sm md:text-base animate-fade-in">
            Manage and organize your video content
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 mb-8 shadow-xl max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by video title..."
                className=" w-full px-5 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <button
              onClick={fetchUserVideos}
              className="watch-button-shine px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 rounded-xl font-medium transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              Search
            </button>
            <button
              onClick={() => fetchVideos(1)}
              className="watch-button-shine px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-all transform hover:scale-105 active:scale-95"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Video Player Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-50 p-4">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-5xl relative overflow-hidden">
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-red-600 hover:text-white rounded-full transition-all transform hover:scale-110"
              >
                <span className="text-xl">✕</span>
              </button>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 pr-12 text-gray-800">
                  {selectedVideo.title}
                </h2>
                <div className="rounded-xl overflow-hidden">
                  <VideoPlayer src={selectedVideo.master_url} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 text-lg">Loading videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-gray-600 text-lg">No videos found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[80%] mx-auto">
            {videos.map((video) => (
              <div
                key={video.id}
                className=" max-h-[300px] group bg-white backdrop-blur-sm border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Thumbnail */}
                <div 
                  className="max-h-[60%] w-full relative overflow-hidden aspect-video cursor-pointer"
                  onClick={() => setSelectedVideo(video)}
                >
                  <img
                    src={
                      video.thumbnail_url ||
                      "https://via.placeholder.com/400x225?text=No+Thumbnail"
                    }
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300">
                      <span className="text-3xl text-white">▶</span>
                    </div>
                  </div>
                  <div className="mb-3 absolute bottom-0 left-1">
                    {getStatusBadge(video.status)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Status Badge */}
                  

                  <h3 className=" text-center text-lg font-semibold mb-2 truncate text-gray-800 group-hover:text-blue-600 transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-center text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
                    {video.description || "No description available"}
                  </p>

                  {/* Action Buttons */}
                  {/* <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedVideo(video)}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 rounded-xl font-medium transition-all transform hover:scale-105 active:scale-95 shadow-lg watch-button-shine"
                    >
                      Watch
                    </button>
                    <button
                      onClick={() => deleteVideo(video.id)}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                    >
                      Delete
                    </button>
                  </div> */}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-12">
            {page > 1 && (
              <button
                onClick={() => fetchVideos(page - 1)}
                className="px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-xl font-medium transition-all transform hover:scale-105 active:scale-95"
              >
                Previous
              </button>
            )}

            <div className="px-6 py-2.5 bg-white/80 border border-gray-300 rounded-xl font-medium">
              <span className="text-gray-600">Page</span>{" "}
              <span className="text-gray-800 font-bold">{page}</span>
              <span className="text-gray-600"> of </span>
              <span className="text-gray-800 font-bold">{pages}</span>
            </div>

            {page < pages && (
              <button
                onClick={() => fetchVideos(page + 1)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 rounded-xl font-medium transition-all transform hover:scale-105 active:scale-95 shadow-lg"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoList;