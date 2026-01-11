import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { updateProduct, getProductById } from "@/api/products";

export default function ProductUpdatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: 0,
    stock: 0,
    tags: "",
    styles: "",
    isAvailable: true,
    // Unified Vehicle Logic
    vehicleType: "",
    isUniversalFit: false,
    vehicleMakes: "",
    vehicleModels: "",
    yearFrom: "",
    yearTo: "",
  });

  // Fetch product from backend API
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getProductById(id);
        const vc = data.vehicleCompatibility || {};

        setFormData({
          name: data.name || "",
          description: data.description || "",
          category: data.category || "",
          price: data.price || 0,
          stock: data.stock || 0,
          isAvailable: data.isAvailable ?? true,
          tags: data.tags?.join(", ") || "",
          styles: data.styles?.join(", ") || "",
          vehicleType: vc.type || data.vehicleType || "Universal",
          isUniversalFit: vc.isUniversalFit ?? true,
          vehicleMakes: vc.makes?.join(", ") || "",
          vehicleModels: vc.models?.join(", ") || "",
          yearFrom: vc.yearRange?.from || "",
          yearTo: vc.yearRange?.to || "",
        });
      } catch (err) {
        console.error(err);
        setError("Failed to fetch product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const ref = doc(db, "products", id);

      // Construct the structured object for the database
      const finalData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        isAvailable: formData.isAvailable,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        styles: formData.styles
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        // This connects back to our Master Update structure
        vehicleType: formData.vehicleType,
        vehicleCompatibility: {
          type: formData.vehicleType,
          isUniversalFit: formData.isUniversalFit,
          makes: formData.vehicleMakes
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean),
          models: formData.vehicleModels
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean),
          yearRange: formData.isUniversalFit
            ? null
            : {
                from: formData.yearFrom ? parseInt(formData.yearFrom) : null,
                to: formData.yearTo ? parseInt(formData.yearTo) : null,
              },
        },
      };

      // ⚡ Call backend API PATCH
      await updateProduct(id, finalData);
      alert("✅ Product updated successfully!");
      navigate("/");
    } catch (err) {
      setError("Update failed");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p className="p-4">Loading product data...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 bg-white shadow-sm border rounded-xl my-10">
      <h1 className="text-2xl font-bold text-gray-800">Edit Spare Part</h1>

      <div className="space-y-4">
        <section className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">
            General Info
          </label>
          <input
            name="name"
            placeholder="Product Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 h-24"
          />
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">
              Price (₱)
            </label>
            <input
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">
              Stock
            </label>
            <input
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </section>

        <section className="p-4 bg-blue-50/50 rounded-xl space-y-4 border border-blue-100">
          <label className="text-sm font-bold text-blue-800 uppercase flex items-center gap-2">
            ⚙️ Compatibility Settings
          </label>

          <div className="grid grid-cols-2 gap-4">
            <select
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 bg-white"
            >
              <option value="Motorcycle">Motorcycle</option>
              <option value="Car">Car</option>
              <option value="Universal">Universal</option>
            </select>

            <label className="flex items-center gap-2 text-sm font-medium">
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
            <div className="space-y-3 animate-in fade-in duration-300">
              <input
                name="vehicleMakes"
                placeholder="Makes (e.g. Yamaha, Honda)"
                value={formData.vehicleMakes}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 bg-white"
              />
              <input
                name="vehicleModels"
                placeholder="Models (e.g. NMAX, Vios)"
                value={formData.vehicleModels}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 bg-white"
              />
              <div className="flex gap-4">
                <input
                  name="yearFrom"
                  type="number"
                  placeholder="Year From"
                  value={formData.yearFrom}
                  onChange={handleChange}
                  className="w-1/2 border rounded-lg px-3 py-2 bg-white"
                />
                <input
                  name="yearTo"
                  type="number"
                  placeholder="Year To"
                  value={formData.yearTo}
                  onChange={handleChange}
                  className="w-1/2 border rounded-lg px-3 py-2 bg-white"
                />
              </div>
            </div>
          )}
        </section>

        <div className="pt-4 border-t flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isAvailable"
              checked={formData.isAvailable}
              onChange={handleChange}
            />
            Visible to customers
          </label>
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold transition-all disabled:opacity-50"
          >
            {updating ? "Saving Changes..." : "Save Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
