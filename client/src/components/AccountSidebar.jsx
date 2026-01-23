import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { User, Settings } from "lucide-react";
import { useEffect } from "react";

export default function AccountSidebar() {
  const { user, refreshProfile } = useAuth();

  // Refresh profile when component mounts to ensure latest data
  useEffect(() => {
    if (user?.uid) {
      refreshProfile();
    }
  }, [user?.uid, refreshProfile]);

  if (!user) return null;

  const storeName =
    user?.sellerApplication?.storeName ||
    user?.seller?.storeName ||
    user?.storeName ||
    "Store";

  const displayName = user?.username || user?.displayName || "User";

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 overflow-hidden">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={24} className="text-gray-600" />
          )}
        </div>
        <h3 className="font-semibold text-gray-900">{displayName}</h3>
        <p className="text-sm text-gray-500 mb-4">{storeName}</p>
        <Link
          to="/seller/account"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Settings size={16} />
          Manage Store
        </Link>
      </div>
    </aside>
  );
}
