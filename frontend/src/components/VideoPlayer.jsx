import React, { useRef, useLayoutEffect } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

// ✅ Required plugins
import "videojs-contrib-quality-levels";  // adds player.qualityLevels()
import "videojs-http-source-selector";    // quality menu plugin

const VideoPlayer = ({ src }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useLayoutEffect(() => {
    if (!playerRef.current && videoRef.current) {
      // Initialize Video.js
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        autoplay: false,
        preload: "auto",
        fluid: true,
        sources: [
          {
            src,
            type: "application/x-mpegURL", // HLS
          },
        ],
      });

      // ✅ Enable the quality selector
      playerRef.current.httpSourceSelector({
        default: "auto", // auto = ABR default
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose(false);
        playerRef.current = null;
      }
    };
  }, [src]);

  return (
    <div data-vjs-player>
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered"
        playsInline
      />
    </div>
  );
};

export default VideoPlayer;
