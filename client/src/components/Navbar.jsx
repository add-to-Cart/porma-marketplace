// src/components/Navbar.jsx
import SearchEngine from "./SearchEngine";
import {
  ShoppingCart,
  User,
  Bell,
  LayoutGrid,
  TrendingUp,
  Tag,
} from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 px-6">
      <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between gap-4">
        {/* 1. Logo & Brand */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <NavLink to="/" className="flex items-center gap-2">
            <img
              src="logo.png"
              className="h-12 w-auto object-contain"
              alt="Logo"
            />
          </NavLink>
        </div>

        {/* 2. Primary Navigation Links */}
        <div className="hidden lg:flex items-center gap-1 bg-gray-100/50 p-1 rounded-2xl">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`
            }
          >
            <LayoutGrid size={18} />
            Marketplace
          </NavLink>

          <NavLink
            to="/trending"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`
            }
          >
            <TrendingUp size={18} />
            Trending
          </NavLink>

          <NavLink
            to="/deals"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-white text-green-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`
            }
          >
            <Tag size={18} />
            Deals
          </NavLink>
        </div>

        {/* 3. Search - Takes up remaining space */}
        <div className="flex-grow max-w-md xl:max-w-lg">
          <SearchEngine />
        </div>

        {/* 4. Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button className="p-2.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="p-2.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
              <ShoppingCart size={20} />
            </button>
          </div>

          <div className="h-8 w-[1px] bg-gray-200 mx-1" />

          <button className="flex items-center gap-2 pl-2 pr-4 py-1.5 hover:bg-gray-50 rounded-full transition-colors border border-transparent hover:border-gray-200">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm">
              <User size={16} />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-gray-900 leading-none">
                Account
              </p>
              <p className="text-[10px] text-gray-500">Sign In</p>
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
}
