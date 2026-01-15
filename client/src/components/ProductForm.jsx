import { useState } from "react";
import { createProduct } from "@/api/products";
import {
  Info,
  Truck,
  ChevronRight,
  Camera,
  X,
  Hash,
  CloudRain,
  Package,
  AlertCircle,
  Tag,
} from "lucide-react";

export default function ProductForm() {
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const CATEGORIES = [
    "Accessories",
    "Body",
    "Body Parts",
    "Brakes",
    "Electronics",
    "Engine",
    "Interior",
    "Lighting",
    "Maintenance",
    "Performance",
    "Protection",
    "Rims",
    "Storage",
    "Suspension",
    "Tools",
    "Transmission",
    "Wheels & Tires",
  ];

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
      ],
      Honda: [
        "Click 125i",
        "Click 160",
        "ADV 160",
        "PCX 160",
        "Airblade 160",
        "Winner X",
        "BeAT",
      ],
      Kawasaki: [
        "Ninja 500",
        "Ninja ZX-25R",
        "Ninja 400",
        "Z400",
        "Dominar 400",
        "Rouser NS200",
      ],
      Suzuki: ["Burgman Street", "Raider R150 Fi", "Gixxer 150"],
    },
    Car: {
      Toyota: ["Fortuner", "Hilux", "Vios", "Innova", "Raize", "Wigo"],
      Mitsubishi: ["Montero Sport", "Strada", "Xpander", "Mirage G4"],
      Ford: ["Everest", "Ranger", "Territory"],
    },
  };

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    stock: "",
    vehicleType: "",
    make: "",
    models: [],
    yearFrom: "",
    yearTo: "",
    isBundle: false,
    dealType: "none",
    imageUrl: "",
    tags: [],
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toggleModel = (modelName) => {
    setFormData((prev) => ({
      ...prev,
      models: prev.models.includes(modelName)
        ? prev.models.filter((m) => m !== modelName)
        : [...prev.models, modelName],
    }));
  };

  const handleTagAdd = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim().toLowerCase())) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim().toLowerCase()],
        }));
      }
      setTagInput("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const autoTags = [
        formData.make,
        ...formData.models,
        formData.category,
      ].filter(Boolean);
      const payload = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
        tags: [...new Set([...formData.tags, ...autoTags])],
        vehicleCompatibility: {
          type: formData.vehicleType,
          makes: [formData.make],
          models: formData.models,
          yearRange: {
            from: Number(formData.yearFrom),
            to: Number(formData.yearTo),
          },
        },
        createdAt: new Date(),
      };
      await createProduct(payload);
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="border-2 border-zinc-900 bg-white shadow-[12px_12px_0px_0px_rgba(24,24,27,1)] overflow-hidden"
      >
        {/* FORM TOP BAR */}
        <div className="bg-zinc-900 text-white p-4 flex items-center justify-between italic">
          <div className="flex items-center gap-3">
            <Package size={16} className="text-amber-500" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em]">
              Master Specification Registry
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-zinc-500">
              AUTH_REQ: GRANTED
            </span>
          </div>
        </div>

        <div className="p-8 space-y-10">
          {/* PRIMARY DATA GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Visual Column */}
            <div className="lg:col-span-4 space-y-6">
              <div className="group relative aspect-square border-2 border-dashed border-zinc-200 hover:border-amber-500 transition-colors flex flex-col items-center justify-center bg-zinc-50 overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    className="w-full h-full object-cover"
                    alt="Preview"
                  />
                ) : (
                  <label className="cursor-pointer flex flex-col items-center">
                    <Camera
                      size={32}
                      strokeWidth={1}
                      className="text-zinc-400 group-hover:text-amber-600 mb-2"
                    />
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-900">
                      Add Product Photo
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        setImagePreview(URL.createObjectURL(e.target.files[0]))
                      }
                    />
                  </label>
                )}
              </div>

              {/* Tag System */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                  <Tag size={12} /> Search Metadata
                </label>
                <input
                  value={tagInput}
                  onKeyDown={handleTagAdd}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Type & Enter..."
                  className="w-full border-b border-zinc-200 py-1 text-xs font-bold outline-none focus:border-amber-600 uppercase"
                />
                <div className="flex flex-wrap gap-1.5">
                  {formData.tags.map((t) => (
                    <span
                      key={t}
                      className="bg-zinc-100 text-[8px] font-black px-2 py-1 flex items-center gap-1 border border-zinc-200 uppercase"
                    >
                      {t}{" "}
                      <X
                        size={10}
                        className="cursor-pointer"
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            tags: p.tags.filter((tag) => tag !== t),
                          }))
                        }
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Fields Column */}
            <div className="lg:col-span-8 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                  Component Name
                </label>
                <input
                  required
                  name="name"
                  onChange={handleChange}
                  className="w-full border-b-2 border-zinc-100 focus:border-amber-600 outline-none p-2 text-xl font-black uppercase transition-colors"
                  placeholder="E.G. RCB S1 FORGED BRAKE CALIPER"
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                    Category
                  </label>
                  <select
                    required
                    name="category"
                    onChange={handleChange}
                    className="w-full border-b-2 border-zinc-100 p-2 text-xs font-bold outline-none bg-transparent"
                  >
                    <option value="">-- SELECT CLASSIFICATION --</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                    Base Price (₱)
                  </label>
                  <input
                    required
                    name="price"
                    type="number"
                    onChange={handleChange}
                    className="w-full border-b-2 border-zinc-100 p-2 text-lg font-mono font-bold outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                  Technical Specifications
                </label>
                <textarea
                  name="description"
                  onChange={handleChange}
                  className="w-full border-2 border-zinc-50 p-4 min-h-[120px] text-sm font-medium leading-relaxed outline-none focus:border-amber-600"
                  placeholder="Material composition, performance metrics, installation notes..."
                />
              </div>
            </div>
          </div>

          {/* VEHICLE MATRIX */}
          <div className="border-t-2 border-zinc-900 border-dashed pt-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-1.5 bg-zinc-900 text-amber-500">
                <Truck size={14} />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">
                Vehicle Compatibility Matrix
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase">
                  Class
                </label>
                <select
                  name="vehicleType"
                  onChange={handleChange}
                  className="w-full border-2 border-zinc-100 p-3 text-[10px] font-black uppercase outline-none focus:border-zinc-900"
                >
                  <option value="">SELECT TYPE</option>
                  {Object.keys(VEHICLE_DATA).map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase">
                  Make
                </label>
                <select
                  name="make"
                  disabled={!formData.vehicleType}
                  onChange={handleChange}
                  className="w-full border-2 border-zinc-100 p-3 text-[10px] font-black uppercase outline-none focus:border-zinc-900 disabled:opacity-30"
                >
                  <option value="">SELECT MAKE</option>
                  {formData.vehicleType &&
                    Object.keys(VEHICLE_DATA[formData.vehicleType]).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase">
                  Year Range
                </label>
                <div className="flex gap-2">
                  <input
                    name="yearFrom"
                    type="number"
                    placeholder="FROM"
                    onChange={handleChange}
                    className="w-full border-2 border-zinc-100 p-3 text-[10px] font-mono font-bold"
                  />
                  <input
                    name="yearTo"
                    type="number"
                    placeholder="TO"
                    onChange={handleChange}
                    className="w-full border-2 border-zinc-100 p-3 text-[10px] font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {formData.make && (
              <div className="mt-6 bg-zinc-50 p-6 border-2 border-zinc-100">
                <p className="text-[9px] font-black text-zinc-400 uppercase mb-4 tracking-widest">
                  Apply to Sub-Models:
                </p>
                <div className="flex flex-wrap gap-2">
                  {VEHICLE_DATA[formData.vehicleType][formData.make].map(
                    (model) => (
                      <button
                        key={model}
                        type="button"
                        onClick={() => toggleModel(model)}
                        className={`px-4 py-2 text-[9px] font-black border-2 transition-all ${
                          formData.models.includes(model)
                            ? "bg-zinc-900 text-amber-500 border-zinc-900 shadow-md"
                            : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400"
                        }`}
                      >
                        {model.toUpperCase()}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* FINAL CONTROLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
            <div className="bg-amber-500 border-2 border-zinc-900 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest">
                  Promo Logic
                </h3>
                <CloudRain size={16} />
              </div>
              <select
                name="dealType"
                onChange={handleChange}
                className="w-full bg-zinc-900 text-white p-3 text-[10px] font-black mb-4 uppercase outline-none"
              >
                <option value="none">STANDARD LISTING</option>
                <option value="rainy-deal">RAINY SEASON BUNDLE</option>
              </select>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="isBundle"
                  onChange={handleChange}
                  className="w-4 h-4 border-2 border-zinc-900 bg-transparent checked:bg-zinc-900 cursor-pointer"
                />
                <span className="text-[10px] font-black uppercase">
                  Bundle / Parts Kit
                </span>
              </label>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-zinc-900 p-4 flex items-center justify-between bg-zinc-50">
                <span className="text-[10px] font-black uppercase text-zinc-500">
                  Initial Stock
                </span>
                <input
                  required
                  name="stock"
                  type="number"
                  onChange={handleChange}
                  className="w-20 bg-transparent text-right text-lg font-mono font-black outline-none"
                  placeholder="0"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-zinc-900 text-amber-500 py-6 text-sm font-black uppercase tracking-[0.4em] border-b-8 border-amber-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3"
              >
                {loading ? "AUTHORIZING..." : "REGISTER TO CATALOG"}
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
