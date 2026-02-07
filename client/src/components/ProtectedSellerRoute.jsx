import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export default function ProtectedSellerRoute({ children }) {
  const { user, loading, signOut, refreshProfile } = useAuth();
  const [shouldSignOut, setShouldSignOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isSeller = user?.isSeller === true || user?.role === "seller";
    const isDeactivated =
      user?.status === "deactivated" || user?.isActive === false;
    const isRestricted =
      user?.status === "restricted" || user?.isRestricted === true;
    if (isSeller && (isDeactivated || isRestricted)) {
      setShouldSignOut(true);
    } else if (
      isSeller &&
      (user?.status === undefined || user?.isActive === undefined)
    ) {
      if (typeof refreshProfile === "function") {
        refreshProfile();
      }
    }
  }, [user, refreshProfile]);

  useEffect(() => {
    if (shouldSignOut) {
      (async () => {
        await signOut();
        navigate("/login", { replace: true });
      })();
    }
  }, [shouldSignOut, signOut, navigate]);

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

  const isAdmin = user?.isAdmin === true || user?.role === "admin";
  const isSeller = user?.isSeller === true || user?.role === "seller";

  // Debug logging
  console.log("ProtectedSellerRoute:", {
    user,
    isAdmin,
    isSeller,
  });

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  if (!isSeller) {
    return <Navigate to="/" replace />;
  }

  return children;
}
