import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { authAPI } from "@/api/auth";

export default function AdminPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Only fetch if current user is an admin
    if (user && (user.role === "admin" || user.isAdmin)) {
      fetchApplications();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await authAPI.getSellerApplications(token);

      if (response.success) {
        setApplications(response.applications);
      } else {
        toast.error(response.message || "Failed to fetch applications");
      }
    } catch (error) {
      toast.error("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (uid) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await authAPI.approveSeller(token, uid);

      if (response.success) {
        toast.success("Application approved!");
        fetchApplications(); // Refresh list
      } else {
        toast.error(response.message || "Failed to approve");
      }
    } catch (error) {
      toast.error("Failed to approve");
    }
  };

  const handleReject = async (uid) => {
    const reason = prompt("Enter rejection reason (optional):");
    try {
      const token = localStorage.getItem("authToken");
      const response = await authAPI.rejectSeller(token, uid, reason);

      if (response.success) {
        toast.success("Application rejected!");
        fetchApplications(); // Refresh list
      } else {
        toast.error(response.message || "Failed to reject");
      }
    } catch (error) {
      toast.error("Failed to reject");
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  if (!user) return <div className="p-10 text-center">Please log in.</div>;

  if (!(user.role === "admin" || user.isAdmin))
    return <div className="p-10 text-center">Access denied.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-gray-800">
      <h2 className="text-2xl font-semibold mb-6">Seller Applications</h2>

      {applications.length === 0 ? (
        <p>No pending applications</p>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.uid}
              className="border border-gray-300 rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{app.displayName}</h3>
                  <p className="text-sm text-gray-600">{app.email}</p>
                  <p className="text-sm mt-2 font-semibold">
                    {app.sellerApplication.storeName || "(No store name)"}
                  </p>
                  {app.sellerApplication.storeDescription && (
                    <p className="text-sm mt-1">
                      {app.sellerApplication.storeDescription}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Applied on:{" "}
                    {app.sellerApplication?.appliedAt?._seconds
                      ? new Date(
                          app.sellerApplication.appliedAt._seconds * 1000,
                        ).toLocaleDateString()
                      : "Date not available"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(app.uid)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(app.uid)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
