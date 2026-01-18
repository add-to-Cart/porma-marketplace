import { useState } from "react";
import { forgotPassword } from "@/services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
          Forgot Password
        </h2>

        {sent ? (
          <p className="text-green-600 text-center text-sm">
            Password reset email sent. Please check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full p-2 border rounded border-gray-300 text-sm focus:outline-none focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full rounded py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Send Reset Email
            </button>
            {error && (
              <p className="text-red-600 text-xs text-center">{error}</p>
            )}
          </form>
        )}

        <div className="mt-4 text-center text-xs">
          <a href="/login" className="text-blue-600 hover:underline">
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
