import React from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function RestrictedSeller() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-8">
      <div className="max-w-xl text-center bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-4">Account Restricted</h1>
        <p className="text-sm text-slate-600 mb-6">
          Your seller account has been restricted. If you believe this is an
          error, contact support or check the email associated with your account
          for details.
        </p>
        <p className="text-xs text-slate-400 mb-6">
          Signed in as: {user?.displayName || user?.email}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={async () => {
              await signOut();
              window.location.href = "/login";
            }}
            className="px-4 py-2 bg-red-50 text-red-700 rounded-md border border-red-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
