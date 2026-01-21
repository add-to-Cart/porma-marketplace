import { Outlet } from "react-router-dom";
import SellerSidebar from "@/components/SellerSidebar";

export default function SellerLayout() {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <SellerSidebar />
      <div className="flex-1 flex flex-col">
        <main className="p-10 max-w-[1400px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
