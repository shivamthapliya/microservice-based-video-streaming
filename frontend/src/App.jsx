import {  Routes, Route } from "react-router-dom";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import ProtectedPage from "./components/ProtectedPage";
import Navbar from "./components/Navbar";
import VideoList from "./components/VideoList";
import { Toaster } from "react-hot-toast";

export default function App() {
 
  return (
    <>
      <Navbar />
    <Toaster position="top-center" />
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedPage />} />
        <Route path="/video" element={<VideoList />} />
      </Routes>
    </>
  );
}
