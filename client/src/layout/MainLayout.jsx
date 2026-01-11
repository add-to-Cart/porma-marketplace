import Sidebar from "@/components/Sidebar";
import { Outlet } from "react-router-dom";
import SearchEngine from "../components/SearchEngine";

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <div className="w-full p-4 border-b bg-white fixed top-0 left-0 right-0 z-40">
        <SearchEngine />
      </div>
      {/* Sidebar - Hidden on mobile, fixed width on desktop */}
      <div className="hidden md:block w-72 flex-shrink-0 border-r bg-white">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <Sidebar />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1">
        {/* You can add a Top Navigation Bar here later */}
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
