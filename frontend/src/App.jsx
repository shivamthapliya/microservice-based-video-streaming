import { Routes, Route } from "react-router-dom";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import ProtectedPage from "./components/ProtectedPage";
import Navbar from "./components/Navbar";
import VideoList from "./components/VideoList";
import { Toaster } from "react-hot-toast";
import { WebSocketProvider } from "./context/webSocketContext";
import { Outlet } from "react-router-dom";

function ProtectedWrapper() {
  return (
    <WebSocketProvider>
      <Outlet />
    </WebSocketProvider>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <Toaster position="top-center" />

      <Routes>
        {/* Public */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes wrapped WITH ONE websocket instance */}
        <Route element={<ProtectedWrapper />}>
          <Route path="/" element={<ProtectedPage />} />
          <Route path="/video" element={<VideoList />} />
        </Route>
      </Routes>
    </>
  );
}
