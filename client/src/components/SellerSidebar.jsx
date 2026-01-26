import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  User,
  MessageSquare,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function SellerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const menuItems = [
    {
      label: "RETURN TO SHOP",
      icon: <User size={18} />, // Or use 'Home' from lucide-react
      path: "/",
    },
    {
      label: "DASHBOARD",
      icon: <LayoutDashboard size={18} />,
      path: "/seller/dashboard",
    },
    {
      label: "INVENTORY",
      icon: <Package size={18} />,
      path: "/seller/product",
    },
    {
      label: "ORDER DESK",
      icon: <ShoppingCart size={18} />,
      path: "/seller/orders",
    },
    {
      label: "REVIEWS",
      icon: <MessageSquare size={18} />,
      path: "/seller/reviews",
    },
  ];

  return (
    <aside className="w-64 bg-[#09090b] text-zinc-400 h-screen sticky top-0 flex flex-col border-r border-zinc-800 select-none">
      {/* BRANDING SECTION WITH LOGO */}
      <div className="p-8 pb-10">
        <div className="flex flex-col gap-4">
          {/* Logo Badge */}
          <div className="flex items-center gap-3">
            <div className="p-2 shadow-[0_0_20px_rgba(245,158,11,0.15)] border border-amber-400/20">
              <img
                src="/logo.png"
                className="w-16 h-16 object-contain"
                alt="Logo"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl text-white tracking-tighter uppercase italic leading-none">
                PORMA<span className="text-amber-500 ml-0.5">PRO</span>
              </span>
              <span className="text-[8px] font-black text-zinc-500 tracking-[0.4em] uppercase mt-1">
                Marketplace
              </span>
            </div>
          </div>

          {/* Section Divider */}
          <div className="h-[1px] w-full bg-gradient-to-r from-zinc-800 to-transparent"></div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 space-y-1">
        <div className="px-4 mb-4">
          <p className="text-[10px] font-black uppercase text-zinc-700 tracking-[0.2em]">
            Operational Units
          </p>
        </div>

        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3.5 text-[11px] font-black transition-all group border-l-4 ${
                isActive
                  ? "bg-zinc-900/60 text-amber-500 border-amber-500 shadow-[inset_15px_0_20px_-15px_rgba(245,158,11,0.15)]"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/30 border-transparent hover:border-zinc-700"
              }`}
            >
              <span className="transition-transform duration-300 group-hover:scale-110">
                {item.icon}
              </span>
              <span className="tracking-[0.2em]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER SECTION */}
      <div className="mt-auto p-6 border-t border-zinc-800 bg-black/20">
        <div className="space-y-4">
          {/* Account Info */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-zinc-700 border border-zinc-600 flex items-center justify-center rounded-sm">
              {user?.sellerAvatarUrl ? (
                <img
                  src={user.sellerAvatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-sm"
                />
              ) : (
                <User size={16} className="text-zinc-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-white leading-none uppercase truncate">
                {user?.displayName || "Seller"}
              </p>
              <p className="text-[9px] font-bold text-amber-500 uppercase truncate">
                {user?.sellerApplication?.storeName ||
                  user?.seller?.storeName ||
                  user?.email}
              </p>
            </div>
          </div>

          {/* Action Links */}
          <div className="space-y-1">
            <button
              onClick={() => navigate("/seller/account")}
              className="w-full flex items-center gap-3 px-3 py-2 text-[9px] font-black text-zinc-600 hover:text-white transition-colors tracking-widest uppercase group"
            >
              <Settings
                size={14}
                className="group-hover:rotate-45 transition-transform"
              />
              Account
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 text-[9px] font-black text-zinc-600 hover:text-red-500 transition-colors tracking-widest uppercase"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
