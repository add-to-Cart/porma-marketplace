import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function ApplySellerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  // State only for necessary store info (always declared so hooks order is stable)
  const [formData, setFormData] = useState({
    storeName: "",
    storeDescription: "",
  });

  // Prevent access for existing sellers or pending applicants
  if (user && user.role === "seller") {
    return <div className="p-10 text-center">You are already a seller.</div>;
  }

  if (
    user &&
    user.sellerApplication &&
    user.sellerApplication.status === "pending"
  ) {
    return (
      <div className="p-10 text-center">
        Your seller application is pending approval.
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.storeName.trim())
      return toast.error("Store name is required");

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:3000/auth/apply-seller", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData), // Sending only storeName and storeDescription
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Application submitted!");
        navigate("/profile");
      } else {
        toast.error(data.message || "Failed to submit application");
      }
    } catch (error) {
      toast.error("Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  if (!user)
    return <div className="p-10 text-center">Please log in to apply.</div>;

  return (
    <div className="max-w-md mx-auto px-4 py-10 text-gray-800">
      <h2 className="text-2xl font-bold mb-2">Seller Application</h2>
      <p className="text-gray-600 mb-8">
        Enter your store details to get started.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Store Name</label>
          <input
            type="text"
            name="storeName"
            placeholder="e.g. Speed Shop"
            className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.storeName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Store Description
          </label>
          <textarea
            name="storeDescription"
            placeholder="What will you be selling?"
            rows="4"
            className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.storeDescription}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-3 rounded-md font-semibold transition duration-200"
        >
          {loading ? "Submitting..." : "Apply Now"}
        </button>
      </form>
    </div>
  );
}
