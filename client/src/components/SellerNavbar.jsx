import { Bell, Search, Plus, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SellerNavbar() {
  const navigate = useNavigate();

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
        <div className="relative group hidden lg:block">
          <Search
            size={16}
            className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            placeholder="SEARCH INVENTORY..."
            className="bg-transparent border-none py-2 pl-7 pr-4 text-xs font-bold w-48 focus:ring-0 placeholder:text-zinc-300 uppercase tracking-tight"
          />
        </div>

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
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-zinc-900 leading-none uppercase">
                Admin User
              </p>
              <p className="text-[9px] font-bold text-amber-600 uppercase">
                Verified Shop
              </p>
            </div>
            <div className="w-10 h-10 bg-zinc-100 border border-zinc-200 flex items-center justify-center rounded-sm">
              <User size={20} className="text-zinc-400" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
