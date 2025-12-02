import { Link, useNavigate } from "react-router-dom";
import { signOut } from "aws-amplify/auth";
import { useState } from "react";
import { LogOut, Home, UserPlus, LogIn, X } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      showToast("Logout successful!", "success");
      navigate("/login", { state: { message: "Logout successful!" } });
    } catch (err) {
      console.error("Error signing out:", err);
      showToast("Error signing out. Please try again.", "error");
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Navigation Links */}
            <div className="flex items-center gap-1">
              <Link
                to="/"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 font-medium"
              >
                <Home size={18} />
                <span>Home</span>
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 font-medium"
              >
                <UserPlus size={18} />
                <span>Sign Up</span>
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 font-medium"
              >
                <LogIn size={18} />
                <span>Login</span>
              </Link>
            </div>

            {/* Right side - Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <span className="flex-1 font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="hover:bg-white/20 rounded p-1 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}