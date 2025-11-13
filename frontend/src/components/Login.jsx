import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn,fetchAuthSession  } from "aws-amplify/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signIn({ username: email, password });
      alert("Login successful!");
      // await fetchAuthSession();
      navigate("/");
    } catch (err) {
      alert(err.message || String(err));
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 mt-20">
      <h2 className="text-xl font-semibold">Log In</h2>
      <input className="border p-2 rounded" type="email" placeholder="Email"
             value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="border p-2 rounded" type="password" placeholder="Password"
             value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}
              className="bg-blue-500 text-white px-4 py-2 rounded">Login</button>
    </div>
  );
}
