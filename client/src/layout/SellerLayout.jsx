import { Outlet } from "react-router-dom";
import SellerNavbar from "@/components/SellerNavbar";
import SellerSidebar from "@/components/SellerSidebar";

export default function SellerLayout() {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {" "}
      {/* Use a very light slate bg */}
      <SellerSidebar />
      <div className="flex-1 flex flex-col">
        <SellerNavbar />
        <main className="p-10 max-w-[1400px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
