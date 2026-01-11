import { useState } from "react";
import { createProduct } from "@/api/products";
import { useNavigate } from "react-router-dom";

export default function CreateProductPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    stock: "",
    imageUrl: "",
    vehicleType: "Motorcycle",
    isUniversalFit: false,
    makes: "",
    models: "",
    yearFrom: "",
    yearTo: "",
    tags: "",
    styles: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Construct the payload to match the backend expectations
    const payload = {
      ...formData,
      tags: formData.tags.split(",").filter(Boolean),
      styles: formData.styles.split(",").filter(Boolean),
      vehicleCompatibility: {
        type: formData.vehicleType,
        isUniversalFit: formData.isUniversalFit,
        makes: formData.isUniversalFit
          ? []
          : formData.makes
              .split(",")
              .map((m) => m.trim())
              .filter(Boolean),
        models: formData.isUniversalFit
          ? []
          : formData.models
              .split(",")
              .map((m) => m.trim())
              .filter(Boolean),
        yearRange: formData.isUniversalFit
          ? null
          : {
              from: parseInt(formData.yearFrom),
              to: parseInt(formData.yearTo),
            },
      },
    };

    try {
      await createProduct(payload); // Call the backend API
      alert("Product successfully listed!");
      navigate("/"); // Redirect to dashboard
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to create product. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">
        List New Spare Part / Accessory
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 border rounded-2xl shadow-sm"
      >
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            required
            name="name"
            placeholder="Product Name"
            onChange={handleChange}
            className="border p-2 rounded-lg w-full"
          />
          <select
            required
            name="category"
            onChange={handleChange}
            className="border p-2 rounded-lg"
          >
            <option value="">Select Category</option>
            <option value="Lights">Lights</option>
            <option value="Brakes">Brakes</option>
            <option value="Engine">Engine</option>
            <option value="Universal Accessories">Universal Accessories</option>
          </select>
        </div>

        <textarea
          name="description"
          placeholder="Product Description"
          onChange={handleChange}
          className="border p-2 rounded-lg w-full h-24"
        />

        {/* Compatibility Engine */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
          <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider">
            Vehicle Compatibility
          </h3>

          <div className="flex items-center gap-6">
            <select
              name="vehicleType"
              onChange={handleChange}
              className="border p-2 rounded-lg bg-white"
            >
              <option value="Motorcycle">Motorcycle</option>
              <option value="Car">Car</option>
            </select>

            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                name="isUniversalFit"
                checked={formData.isUniversalFit}
                onChange={handleChange}
              />
              Is Universal Fit?
            </label>
          </div>

          {!formData.isUniversalFit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
              <input
                name="makes"
                placeholder="Makes (e.g. Yamaha, Honda)"
                onChange={handleChange}
                className="border p-2 rounded-lg bg-white"
              />
              <input
                name="models"
                placeholder="Models (e.g. NMAX, Vios)"
                onChange={handleChange}
                className="border p-2 rounded-lg bg-white"
              />
              <div className="flex gap-2">
                <input
                  name="yearFrom"
                  type="number"
                  placeholder="Year From"
                  onChange={handleChange}
                  className="border p-2 rounded-lg w-full bg-white"
                />
                <input
                  name="yearTo"
                  type="number"
                  placeholder="Year To"
                  onChange={handleChange}
                  className="border p-2 rounded-lg w-full bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pricing & Stock */}
        <div className="grid grid-cols-2 gap-4">
          <input
            required
            name="price"
            type="number"
            placeholder="Price (₱)"
            onChange={handleChange}
            className="border p-2 rounded-lg"
          />
          <input
            required
            name="stock"
            type="number"
            placeholder="Stock Quantity"
            onChange={handleChange}
            className="border p-2 rounded-lg"
          />
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="tags"
            placeholder="Tags (comma separated)"
            onChange={handleChange}
            className="border p-2 rounded-lg"
          />
          <input
            name="styles"
            placeholder="Styles (e.g. Racing, Classic)"
            onChange={handleChange}
            className="border p-2 rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
        >
          {loading ? "Creating..." : "Publish Product"}
        </button>
      </form>
    </div>
  );
}
