import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();
  const { user, signInAdmin } = useAuth();

  // Redirect based on user role
  useEffect(() => {
    if (user) {
      console.log("Current user in AdminLogin:", user);

      // Check if user is admin
      if (user.isAdmin === true || user.role === "admin") {
        console.log("Navigating to /admin");
        navigate("/admin", { replace: true });
      } else {
        console.log("Not admin, navigating to /");
        navigate("/", { replace: true });
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signInAdmin(identifier, password);

      if (result.success) {
        toast.success("Admin Access Granted");
        console.log("Admin login successful:", result.user);

        // Navigation will be handled by useEffect when user state updates
        // But as a backup, navigate immediately if isAdmin is true
        if (result.user?.isAdmin || result.user?.role === "admin") {
          navigate("/admin", { replace: true });
        }
      } else {
        toast.error(result.message || "Invalid Admin Credentials");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar />

      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        {/* Branding/Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
            A
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Portal</h2>
          <p className="text-sm text-gray-500 mt-1">
            Please enter your details to sign in
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter admin username"
              className="w-full p-2.5 border rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-2.5 border rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-600 group-hover:text-gray-800 transition-colors">
                Remember me
              </span>
            </label>
            <Link
              to="/forgot-password"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-colors ${
              loading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Not an admin?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in as user
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
