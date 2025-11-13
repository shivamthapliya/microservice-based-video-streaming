import { Link, useNavigate } from "react-router-dom";
import { signOut } from "aws-amplify/auth";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      // ✅ Pass a success message to the login page
      alert ("Logout successful!");
      navigate("/login", { state: { message: "Logout successful!" } });
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  return (
    <nav className="flex justify-between items-center p-4 bg-gray-100 shadow-sm">
      <div className="flex gap-4">
        <Link to="/">Home</Link>
        <Link to="/signup">Sign Up</Link>
        <Link to="/login">Login</Link>
      </div>
      <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded">
        Logout
      </button>
    </nav>
  );
}
