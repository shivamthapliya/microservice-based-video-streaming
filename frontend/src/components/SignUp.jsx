import { useState } from "react";
import { signUp, confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";


// API base URL
const userServiceBaseUrl = `${import.meta.env.VITE_USERAPI_BASE_URL}/users`;

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("signup");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // NEW: Cognito ID holder
  const [cognitoId, setCognitoId] = useState(null);

  const navigate = useNavigate();

  // ===========================================================
  // 🟦 SIGN UP (Cognito signUp())
  // ===========================================================
  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);

      // AWS Cognito Signup
      const result = await signUp({ username: email, password });

      // Save Cognito ID for backend
      setCognitoId(result.userId);
      setStep("confirm");
    } catch (err) {
       const message =
          err?.message ||
          err.response?.data?.error ||
          "Something went wrong.";

        toast.error(message, { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // ===========================================================
  // 🟩 CONFIRM SIGNUP (Cognito confirmSignUp + backend POST)
  // ===========================================================
  const handleConfirm = async () => {
    try {
      setLoading(true);

      await confirmSignUp({ username: email, confirmationCode: code });
      await axios.post(`${userServiceBaseUrl}/signUp`, {
        id: cognitoId || null,
        email: email,
      });
      
      // Call your backend user creation API

      // alert("Account verified! You can now log in.");
      setStep("done");
      
      // Redirect
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      // console.log("Backend user creation response:", result.data);
      const message =
          err.response?.data?.message ||
          err?.message ||
          "Something went wrong.";

        toast.error(message, { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // ===========================================================
  // 🟨 RESEND CODE (Cognito resendSignUpCode)
  // ===========================================================
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

  // ===========================================================
  // UI BELOW — UNCHANGED (Your new design)
  // ===========================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-50 to-purple-50 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full">

        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-2xl shadow-lg mb-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {step === "signup"
              ? "Create Account"
              : step === "confirm"
              ? "Verify Email"
              : "All Set!"}
          </h1>

          <p className="text-gray-600">
            {step === "signup"
              ? "Join us and start sharing your content"
              : step === "confirm"
              ? "Enter the code sent to your email"
              : "Your account is ready to use"}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">

          {/* ================= SIGNUP STEP ================= */}
          {step === "signup" && (
            <div className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-12 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">Must be at least 8 characters with a mix of letters and numbers</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>

                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    className={`w-full border-2 rounded-xl pl-12 pr-12 py-3 focus:ring-2 transition-all outline-none ${
                      confirmPassword && password !== confirmPassword
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:border-purple-500 focus:ring-purple-200"
                    }`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Passwords do not match
                  </p>
                )}

                {confirmPassword && password === confirmPassword && (
                  <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Passwords match
                  </p>
                )}
              </div>

              <button
                onClick={handleSignUp}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ================= CONFIRM STEP ================= */}
          {step === "confirm" && (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-700 text-center">
                  We've sent a verification code to
                  <span className="font-semibold block mt-1">{email}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none text-center text-lg tracking-widest font-semibold"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={loading}
                    maxLength={6}
                  />
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Email
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Didn't receive code? Resend
                </button>
              </div>
            </div>
          )}

          {/* ================= DONE STEP ================= */}
          {step === "done" && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Account Verified!
              </h3>

              <p className="text-gray-600 mb-6">Redirecting you to login...</p>

              <div className="inline-block w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Bottom Link */}
        {step === "signup" && (
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?{" "}
              <button className="font-semibold text-purple-600 hover:text-purple-700 hover:underline transition-colors"
                onClick={() => navigate("/login")}>
                Sign in
              </button>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
