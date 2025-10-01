import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "./Config";
import { getToken } from "./ManageToken";

export default function VerifyCodePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Countdown effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, token }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid code");

      toast.success("✅ Your account is now active!", { duration: 4000 });
      setCode("");
    } catch (err) {
      toast.error(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/resend-verification-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend code");

      toast.success("📩 New code sent! Check your email.");
      setCooldown(20);
    } catch (err) {
      toast.error(`❌ ${err.message}`);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Verify Your Account
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Enter the verification code we sent to your email
        </p>

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="123456"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 shadow-md transition disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">Didn’t get the code?</p>
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="mt-2 text-blue-600 hover:underline disabled:opacity-50"
          >
            {resending
              ? "Resending..."
              : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend Code"}
          </button>
        </div>
      </div>
    </div>
  );
}
