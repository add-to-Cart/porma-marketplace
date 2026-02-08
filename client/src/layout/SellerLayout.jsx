import { Outlet } from "react-router-dom";
import SellerSidebar from "@/components/SellerSidebar";
import { useAuth } from "@/contexts/AuthContext";

export default function SellerLayout() {
  const { user } = useAuth();

  const isDeactivated =
    user?.status === "deactivated" || user?.isActive === false;

  if (isDeactivated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-8">
        <div className="max-w-xl text-center bg-white p-8 rounded-xl shadow">
          <h1 className="text-2xl font-bold mb-4">
            Your seller account is inactive
          </h1>
          <p className="text-sm text-slate-600">
            Your seller account has been deactivated. Contact support if you
            believe this is a mistake.
          </p>
        </div>
      </div>
    );
  }

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
