import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedSellerRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) return <Navigate to="/login" replace />;

  const isAdmin = user?.isAdmin === true || user?.role === "admin";
  const isSeller = user?.isSeller === true || user?.role === "seller";

  const isRestricted =
    user?.status === "restricted" || user?.isRestricted === true;
  const isDeactivated =
    user?.status === "deactivated" || user?.isActive === false;

  if (isAdmin) return <Navigate to="/admin" replace />;
  if (isRestricted) return <Navigate to="/seller/restricted" replace />;
  // Allow deactivated sellers to enter but render inactive UI in SellerLayout
  if (!isSeller) return <Navigate to="/" replace />;

  return children;
}
