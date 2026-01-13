// src/components/Navbar.jsx
import SearchEngine from "./SearchEngine";
import { ShoppingCart, User, Bell } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 px-6">
      <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between gap-8">
        {/* Logo */}
        <div className="flex-shrink-0">
          <h1 className="text-2xl font-black text-gray-900 tracking-tighter">
            <span className="text-blue-600">PORMA</span>
          </h1>
        </div>

        {/* Search - Takes up the middle */}
        <div className="flex-grow max-w-2xl">
          <SearchEngine />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="p-2.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
            <ShoppingCart size={20} />
          </button>
          <div className="h-8 w-[1px] bg-gray-200 mx-2" />
          <button className="flex items-center gap-2 pl-2 pr-4 py-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              JD
            </div>
            <span className="text-sm font-semibold text-gray-700">John</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
