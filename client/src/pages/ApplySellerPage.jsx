import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { authAPI } from "@/api/auth";

export default function ApplySellerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim())
      return toast.error("Please provide a reason for applying");

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:3000/auth/apply-seller", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: message.trim() }),
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

  if (!user) return <div>Please log in</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-gray-800">
      <h2 className="text-2xl font-semibold mb-6">Apply to Become a Seller</h2>
      <p className="mb-4">
        Fill out the form below to apply for seller status. An admin will review
        your application.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Why do you want to become a seller?
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about your experience, products you plan to sell, etc."
            rows={5}
            maxLength={500}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            {message.length}/500 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-3 rounded-md font-medium transition duration-200"
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}
