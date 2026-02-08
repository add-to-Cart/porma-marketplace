// src/layouts/MainLayout.jsx
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Outlet, useLocation } from "react-router-dom";

export default function MarketPlaceLayout() {
  const location = useLocation();
  const showSidebar = location.pathname === "/";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* Container for Sidebar + Content */}
      <div className="max-w-[1440px] mx-auto pt-24 px-6 flex gap-8">
        {/* Left Sidebar - Sticky */}
        {showSidebar && (
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 h-[calc(100vh-120px)] overflow-y-auto pr-2 custom-scrollbar">
              <Sidebar />
            </div>
          </aside>
        )}

        {/* Main Content (Marketplace / ProductList) */}
        <main className={`flex-1 pb-10 ${showSidebar ? "" : "max-w-4xl"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
