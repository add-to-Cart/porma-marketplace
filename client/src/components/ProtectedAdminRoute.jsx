import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedAdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  // Check if user has admin role
  const isAdmin = user?.isAdmin === true || user?.role === "admin";

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
