import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function SellerSidebar() {
  const location = useLocation();

  const menuItems = [
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
      label: "PERFORMANCE",
      icon: <BarChart3 size={18} />,
      path: "/seller/analytics",
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
              {/* If you have a physical logo.png, swap the ShieldCheck for: 
                  <img src="/logo.png" className="w-6 h-6 object-contain" alt="Logo" /> 
              */}
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
          {/* Action Links */}
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-[9px] font-black text-zinc-600 hover:text-white transition-colors tracking-widest uppercase group">
              <Settings
                size={14}
                className="group-hover:rotate-45 transition-transform"
              />
              Terminal Config
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-[9px] font-black text-zinc-600 hover:text-red-500 transition-colors tracking-widest uppercase">
              <LogOut size={14} /> Kill Process
            </button>
          </div>

          {/* Diagnostic Display */}
          <div className="border border-zinc-800 p-3 bg-zinc-900/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
                Core Link
              </span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-amber-500 animate-pulse"></div>
                <div className="w-1 h-1 bg-amber-500 animate-pulse [animation-delay:200ms]"></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={10} className="text-emerald-500" />
              <span className="text-[9px] font-mono text-emerald-600 font-bold uppercase tracking-tighter">
                System: Authenticated
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
