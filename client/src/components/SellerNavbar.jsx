import { Bell, Plus, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function SellerNavbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="h-20 bg-white border-b border-zinc-200 px-10 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">
          Merchant Portal
        </h2>
        <div className="h-4 w-[1px] bg-zinc-200"></div>
        <span className="text-sm font-bold text-zinc-900">
          General Overview
        </span>
      </div>

      <div className="flex items-center gap-8">
        {/* Removed global search - search should live in Inventory/Orders pages */}

        <div className="flex items-center gap-4">
          <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
            <Bell size={18} />
          </button>

          <button
            onClick={() => navigate("/seller/product")}
            className="bg-zinc-900 text-white px-6 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg active:translate-y-0.5"
          >
            New Entry
          </button>

          <div className="flex items-center gap-3 border-l border-zinc-200 pl-6">
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
