import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { fetchUserAttributes } from "aws-amplify/auth";

export const WebSocketContext = createContext(null);
export const useWebSocket = () => useContext(WebSocketContext);

export function WebSocketProvider({ children }) {
  const [videoStatuses, setVideoStatuses] = useState({});
  const wsRef = useRef(null);
  
  // IMPORTANT: track mounted state
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const connectWS = async () => {
      if (!isMounted.current) return; // ⛔ Prevent reconnect after unmount

      try {
        const user = await fetchUserAttributes();
        const userId = user.sub;

        const ws = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted.current) return; 
          ws.send(JSON.stringify({ action: "register", userId }));
        };

        ws.onmessage = (message) => {
          if (!isMounted.current) return;
          console.log("WS MESSAGE:", message.data);
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
          if (!isMounted.current) return; // ⛔ stop retrying after unmount
          console.warn("WS CLOSED - retrying in 3s...");
          setTimeout(connectWS, 3000);
        };

      } catch (err) {
        console.error("WS INIT FAILED:", err);
      }
    };

    connectWS();

    // Cleanup on unmount
    return () => {
      isMounted.current = false;
      wsRef.current?.close();
    };

  }, []);

  return (
    <WebSocketContext.Provider value={{ videoStatuses }}>
      {children}
    </WebSocketContext.Provider>
  );
}
