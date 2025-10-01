import { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleForgotPassword = (e) => {
    e.preventDefault();
    console.log("Forgot Password request:", email);
    // call your backend forgot password API here
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Forgot Password
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Enter your email to reset your password
        </p>

        <form onSubmit={handleForgotPassword} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 shadow-md transition"
          >
            Send Reset Link
          </button>
        </form>

        <div className="text-center text-sm text-gray-600 mt-6">
          Remember your password?{" "}
          <button
            onClick={() => navigate("/login")}
            className="hover:text-blue-600 hover:underline"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}
