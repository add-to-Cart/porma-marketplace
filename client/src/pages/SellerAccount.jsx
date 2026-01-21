import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";

export default function SellerAccount() {
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState({ storeName: "", storeDescription: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        storeName:
          user?.sellerApplication?.storeName || user?.seller?.storeName || "",
        storeDescription:
          user?.sellerApplication?.storeDescription ||
          user?.seller?.storeDescription ||
          "",
      });
    }
  }, [user]);

  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!form.storeName.trim()) return toast.error("Store name is required");
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(
        "http://localhost:3000/auth/request-seller-update",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            requestedFields: {
              seller: {
                storeName: form.storeName,
                storeDescription: form.storeDescription,
              },
            },
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Update request submitted. Awaiting admin approval.");
        await refreshProfile();
      } else {
        toast.error(data.message || "Failed to submit request");
      }
    } catch (err) {
      toast.error("Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-10 text-center">Please log in.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-gray-800">
      <h2 className="text-3xl font-bold mb-6">Store Details Management</h2>
      <p className="text-gray-600 mb-8">
        Request changes to your store information. Admin approval required.
      </p>

      <form
        onSubmit={submitRequest}
        className="space-y-6 bg-white p-6 rounded-lg shadow"
      >
        <div>
          <label className="block text-sm font-medium mb-2">Store Name</label>
          <input
            name="storeName"
            value={form.storeName}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Enter store name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Store Description
          </label>
          <textarea
            name="storeDescription"
            value={form.storeDescription}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            rows={4}
            placeholder="Describe your store"
          />
        </div>
        <div>
          <button
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-3 rounded-md font-semibold transition duration-200"
          >
            {loading ? "Submitting..." : "Request Update"}
          </button>
        </div>
      </form>

      {user?.sellerUpdateRequest?.status === "pending" && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm">
            You have a pending update request submitted on{" "}
            {new Date(user.sellerUpdateRequest.requestedAt).toLocaleString()}.
          </p>
        </div>
      )}
    </div>
  );
}
