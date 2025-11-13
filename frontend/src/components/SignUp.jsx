import { useState } from "react";
import { signUp, confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("signup");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // 🟦 Signup handler
  const handleSignUp = async () => {
    try {
      setLoading(true);
      await signUp({ username: email, password });
      alert("Signup successful! Check your email for the verification code.");
      setStep("confirm");
    } catch (err) {
      alert(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // 🟩 Confirm email handler
  const handleConfirm = async () => {
    try {
      setLoading(true);
      await confirmSignUp({ username: email, confirmationCode: code });
      alert("Account verified! You can now log in.");
      setStep("done");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      alert(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // 🟨 Resend verification code handler
  const handleResendCode = async () => {
    try {
      setLoading(true);
      await resendSignUpCode({ username: email });
      alert("A new verification code has been sent to your email.");
    } catch (err) {
      alert(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 mt-20">
      {step === "signup" && (
        <>
          <h2 className="text-xl font-semibold">Create Account</h2>
          <input
            className="border p-2 rounded"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="border p-2 rounded"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </>
      )}

      {step === "confirm" && (
        <>
          <h2 className="text-xl font-semibold">Confirm Your Email</h2>
          <input
            className="border p-2 rounded"
            type="text"
            placeholder="Verification Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Confirm"}
          </button>

          {/* 🟨 New Resend Button */}
          <button
            onClick={handleResendCode}
            disabled={loading}
            className="text-blue-600 underline mt-2 disabled:opacity-50"
          >
            Resend Verification Code
          </button>
        </>
      )}

      {step === "done" && (
        <p className="text-green-600 font-medium">You can now log in!</p>
      )}
    </div>
  );
}
