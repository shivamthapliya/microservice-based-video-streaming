// src/context/WebSocketContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { fetchUserAttributes } from "aws-amplify/auth";

export const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export function WebSocketProvider({ children }) {
  const [videoStatuses, setVideoStatuses] = useState({});
  const wsRef = useRef(null);

  useEffect(() => {
    const connectWS = async () => {
      try {
        const user = await fetchUserAttributes();
        const userId = user.sub;

        const ws = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(JSON.stringify({ action: "register", userId }));
        };

        ws.onmessage = (message) => {
          try {
            const data = JSON.parse(message.data);

            if (data.event === "video-transcoded") {
              setVideoStatuses((prev) => ({
                ...prev,
                [data.videoId]: data.status,
              }));
            }
          } catch (err) {
            console.error("WS PARSE ERROR:", err);
          }
        };

        ws.onerror = console.error;

        ws.onclose = () => {
          console.warn("WS CLOSED - retrying in 3s...");
          setTimeout(connectWS, 3000);
        };
      } catch (err) {
        console.error("WS INIT FAILED:", err);
      }
    };

    connectWS();

    return () => wsRef.current?.close();
  }, []);

  return (
    <WebSocketContext.Provider value={{ videoStatuses }}>
      {children}
    </WebSocketContext.Provider>
  );
}
