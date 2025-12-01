import {  Routes, Route } from "react-router-dom";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import ProtectedPage from "./components/ProtectedPage";
import Navbar from "./components/Navbar";
import VideoList from "./components/VideoList";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    console.log("Opening test WebSocket connection...");

    const ws = new WebSocket(
      "wss://36rs9z9ar8.execute-api.ap-south-1.amazonaws.com/dev/"
    );

    ws.onopen = () => {
      console.log("WS CONNECTED.");

      // send basic register event
      ws.send(
        JSON.stringify({
          action: "register",
          userId: "test-user-123",
        })
      );

      console.log("REGISTER sent.");
    };

    ws.onmessage = (msg) => {
      console.log("WS MESSAGE FROM SERVER:", msg.data);
    };

    ws.onerror = (err) => {
      console.log("WS ERROR:", err);
    };

    ws.onclose = () => {
      console.log("WS CLOSED.");
    };

    // cleanup
    return () => {
      ws.close();
    };
  }, []);
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedPage />} />
        <Route path="/video" element={<VideoList />} />
      </Routes>
    </>
  );
}
