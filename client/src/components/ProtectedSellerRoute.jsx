import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedSellerRoute({ children }) {
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
    return <Navigate to="/login" replace />;
  }

  // Check if user has seller role
  // Backend returns isSeller boolean and role string
  const isSeller = user?.isSeller === true || user?.role === "seller";

  if (!isSeller) {
    return <Navigate to="/" replace />;
  }

  return children;
}
