import { useState } from "react";
import { createProduct } from "@/api/products";
import { useNavigate } from "react-router-dom";

export default function CreateProductPage() {
  const VEHICLE_DATA = {
    Motorcycle: {
      Yamaha: [
        "NMAX 155 Tech Max",
        "Aerox 155 SP",
        "Mio Fazzio",
        "Sniper 155",
        "YZF-R15",
        "XMAX",
        "Mio Sporty",
        "Mio i 125",
        "Mio Soul i 125",
      ],
      Honda: [
        "Click 125i",
        "Click 160",
        "ADV 160",
        "PCX 160",
        "Airblade 160",
        "Winner X",
        "Giorno+",
        "Navi",
        "BeAT",
      ],
      Kawasaki: [
        "Ninja 500",
        "Z500",
        "Ninja ZX-25R",
        "Versys 1100 SE",
        "Barako III",
        "Ninja e-1",
        "Z e-1",
        "Ninja 400",
        "Z400",
        "Dominar 400",
        "Rouser NS200",
      ],
      Suzuki: [
        "Raider R150 Fi",
        "Burgman Street",
        "Access",
        "GSX-8T",
        "DR-Z4S",
        "Gixxer 150",
      ],
      "Royal Enfield": [
        "Hunter 350",
        "Himalayan 450",
        "Shotgun 650",
        "Guerrilla 450",
        "Classic 350",
      ],
      TVS: ["Apache RTR 200 4V", "Apache RR 310", "iQube", "XL 100"],
      KTM: ["1390 Super Adventure S EVO", "RC 390"],
      BMW: ["R 1300 GS Adventure", "S 1000 R"],
      Vespa: ["GTV 300", "S 125 Iget", "Primavera", "GTS"],
    },
    Car: {
      Toyota: [
        "Vios (2026)",
        "bZ4X",
        "Tamaraw",
        "GR Yaris",
        "Hilux",
        "Fortuner",
        "Innova",
        "Hiace",
        "Wigo",
      ],
      Mitsubishi: [
        "Destinator (GLX/GT)",
        "Triton",
        "Montero Sport",
        "Xpander Cross",
        "Mirage G4",
        "L300",
      ],
      Nissan: [
        "Kicks e-Power",
        "Navara Pro-4X",
        "Terra Sport",
        "Patrol (2026)",
        "Z Premium",
        "Almera EL",
        "Urvan",
      ],
      Ford: [
        "Territory Hybrid",
        "Mustang Mach-E",
        "Ranger Raptor V6",
        "Everest Wildtrak",
        "Explorer Limited",
        "Bronco Outer Banks",
        "Ranger",
        "Everest",
        "F-150",
      ],
      Isuzu: ["D-Max RZ4E", "D-Max 3.0 LS-E", "MU-X 3.0 LS-E", "Traviz"],
      Hyundai: [
        "Ioniq 5",
        "Ioniq 6",
        "Ioniq 9",
        "Santa Fe HEV",
        "Tucson HEV",
        "Elantra N",
      ],
      Kia: ["Sonet LX", "Carnival HEV", "EV6", "EV9", "EV9 GT"],
      MG: ["MG 3 Hybrid+", "Cyberster EV"],
      GWM: ["Tank 300", "Haval Jolion HEV", "Cannon Pilot"],
      Geely: ["EX5", "Coolray"],
    },
  };
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
      // Reset model if make changes
      ...(name === "makes" ? { models: "" } : {}),
      // Reset make/model if vehicleType changes
      ...(name === "vehicleType" ? { makes: "", models: "" } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Get your manual tags
    const manualTags = formData.tags.split(",").filter(Boolean);

    // 2. Create automatic tags from compatibility (if not universal)
    const autoTags = formData.isUniversalFit
      ? ["universal"]
      : [formData.makes, formData.models, formData.vehicleType].filter(Boolean);

    // Construct the payload to match the backend expectations
    const payload = {
      ...formData,
      tags: [...new Set([...manualTags, ...autoTags])],
      styles: formData.styles.split(",").filter(Boolean),
      vehicleCompatibility: {
        type: formData.isUniversalFit ? "Universal" : formData.vehicleType,
        isUniversalFit: formData.isUniversalFit,
        makes: formData.isUniversalFit ? [] : [formData.makes], // Wrap in array
        models: formData.isUniversalFit ? [] : [formData.models], // Wrap in array
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

          {/* Vehicle Compatibility Section */}
          {!formData.isUniversalFit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-4 border-blue-500 pl-4">
              {/* Make Dropdown */}
              <select
                name="makes"
                value={formData.makes}
                onChange={handleChange}
                className="border p-2 rounded-lg"
                required
              >
                <option value="">Select Make</option>
                {Object.keys(VEHICLE_DATA[formData.vehicleType] || {}).map(
                  (make) => (
                    <option key={make} value={make}>
                      {make}
                    </option>
                  )
                )}
              </select>

              {/* Model Dropdown (Enabled only if a Make is selected) */}
              <select
                name="models"
                value={formData.models}
                onChange={handleChange}
                className="border p-2 rounded-lg"
                disabled={!formData.makes}
                required
              >
                <option value="">Select Model</option>
                {(
                  VEHICLE_DATA[formData.vehicleType]?.[formData.makes] || []
                ).map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              {/* Year Range (Your original inputs) */}
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  name="yearFrom"
                  placeholder="Year From"
                  value={formData.yearFrom}
                  onChange={handleChange}
                  className="border p-2 rounded-lg"
                />
                <input
                  type="number"
                  name="yearTo"
                  placeholder="Year To"
                  value={formData.yearTo}
                  onChange={handleChange}
                  className="border p-2 rounded-lg"
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
