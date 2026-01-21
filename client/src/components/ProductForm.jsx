import { useState, useEffect } from "react";
import {
  createProduct,
  getProductsBySeller,
  updateProduct,
} from "@/api/products";
import { useAuth } from "@/contexts/AuthContext";
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

export default function ProductForm({ selectedProduct }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

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
    stock: "1",
    isUniversalFit: false,
    isSeasonal: false,
    seasonalCategory: "",
    compareAtPrice: "",
    bundleContents: "",
    vehicleType: "",
    vehicleMake: "",
    models: [],
    yearFrom: "",
    yearTo: "",
    imageUrl: "",
    tags: [],
  });

  const [sellerProducts, setSellerProducts] = useState([]);
  const [editingProductId, setEditingProductId] = useState(null);

  useEffect(() => {
    if (user) fetchSellerProducts();
  }, [user]);

  const fetchSellerProducts = async () => {
    try {
      const data = await getProductsBySeller(user.uid);
      setSellerProducts(data || []);
    } catch (err) {
      console.error("Failed to fetch seller products:", err);
    }
  };

  const populateFromProduct = (product) => {
    if (!product) return;
    setFormData({
      name: product.name || "",
      category: product.category || "",
      description: product.description || "",
      price: product.price != null ? String(product.price) : "",
      stock: product.stock != null ? String(product.stock) : "1",
      isUniversalFit: product.vehicleCompatibility?.isUniversalFit || false,
      isSeasonal: !!product.isSeasonal,
      seasonalCategory: product.seasonalCategory || "",
      compareAtPrice:
        product.compareAtPrice != null ? String(product.compareAtPrice) : "",
      bundleContents: product.bundleContents || "",
      vehicleType: product.vehicleCompatibility?.type || "",
      vehicleMake:
        product.vehicleCompatibility?.makes &&
        product.vehicleCompatibility.makes.length
          ? product.vehicleCompatibility.makes[0]
          : "",
      models: product.vehicleCompatibility?.models || [],
      yearFrom:
        product.vehicleCompatibility?.yearRange?.from != null
          ? String(product.vehicleCompatibility.yearRange.from)
          : "",
      yearTo:
        product.vehicleCompatibility?.yearRange?.to != null
          ? String(product.vehicleCompatibility.yearRange.to)
          : "",
      imageUrl: product.imageUrl || product.image || "",
      tags: product.tags || [],
    });
    setImagePreview(product.imageUrl || product.image || null);
    setImageFile(null);
  };

  useEffect(() => {
    if (selectedProduct) {
      setEditingProductId(selectedProduct.id);
      populateFromProduct(selectedProduct);
    } else {
      setEditingProductId(null);
    }
  }, [selectedProduct]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file); // Store the actual file object
      setImagePreview(URL.createObjectURL(file)); // Store the preview for the UI
    }
  };

  const handleSelectProduct = (e) => {
    const id = e.target.value;
    if (!id) {
      // new product
      setEditingProductId(null);
      setFormData((prev) => ({
        ...prev,
        name: "",
        category: "",
        description: "",
        price: "",
        stock: "1",
        isUniversalFit: false,
        isSeasonal: false,
        seasonalCategory: "",
        compareAtPrice: "",
        bundleContents: "",
        vehicleType: "",
        vehicleMakes: "",
        vehicleModels: "",
        yearFrom: "",
        yearTo: "",
        imageUrl: "",
        tags: [],
      }));
      setImagePreview(null);
      setImageFile(null);
      return;
    }
    const product = sellerProducts.find((p) => p.id === id);
    if (product) {
      setEditingProductId(id);
      populateFromProduct(product);
    }
  };

  const toggleModel = (modelName) => {
    setFormData((prev) => ({
      ...prev,
      models: prev.models?.includes(modelName)
        ? prev.models.filter((m) => m !== modelName)
        : [...(prev.models || []), modelName],
    }));
  };

  const generateTags = (data) => {
    const tags = new Set();

    // Add name parts
    if (data.name) {
      data.name
        .toLowerCase()
        .split(/\s+/)
        .forEach((word) => {
          if (word.length > 1) tags.add(word);
        });
    }

    // Add category
    if (data.category) tags.add(data.category.toLowerCase());

    // Add vehicle details
    if (data.vehicleCompatibility) {
      const comp = data.vehicleCompatibility;
      if (comp.isUniversalFit) {
        tags.add("universal");
      } else {
        comp.makes?.forEach((make) => tags.add(make.toLowerCase()));
        comp.models?.forEach((model) => tags.add(model.toLowerCase()));
      }
      if (comp.type && comp.type !== "GENERAL / ALL TYPES")
        tags.add(comp.type.toLowerCase());
    }

    // Add seasonal tags
    if (data.seasonalCategory) {
      tags.add("seasonal");
      tags.add(data.seasonalCategory.toLowerCase());
    }

    return Array.from(tags);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("You must be logged in to create products");
      return;
    }

    setLoading(true);
    try {
      // Prepare Vehicle Compatibility
      const vehicleCompatibility = {
        type: formData.vehicleType || "Universal",
        isUniversalFit: formData.isUniversalFit,
        makes: formData.vehicleMake ? [formData.vehicleMake] : [],
        models: Array.isArray(formData.models) ? formData.models : [],
        yearRange: {
          from: Number(formData.yearFrom),
          to: Number(formData.yearTo),
        },
      };

      // Generate tags automatically
      const productDataForTags = {
        ...formData,
        vehicleCompatibility,
        isSeasonal: formData.seasonalCategory ? true : formData.isSeasonal,
      };
      const generatedTags = generateTags(productDataForTags);

      const data = new FormData();
      // Append standard fields
      Object.keys(formData).forEach((key) => {
        if (
          !["tags", "vehicleCompatibility", "seasonalCategory"].includes(key)
        ) {
          if (key === "isSeasonal") {
            data.append(
              key,
              formData.seasonalCategory ? "true" : formData.isSeasonal,
            );
          } else {
            data.append(key, formData[key]);
          }
        }
      });

      // Add seller information
      data.append("sellerId", user.uid);
      data.append(
        "storeName",
        user.storeName || user.displayName || "Unknown Store",
      );

      data.append("vehicleCompatibility", JSON.stringify(vehicleCompatibility));
      data.append("tags", JSON.stringify(generatedTags));

      if (imageFile) data.append("image", imageFile);

      if (editingProductId) {
        await updateProduct(editingProductId, data);
        alert("Product updated successfully!");
        fetchSellerProducts && fetchSellerProducts();
      } else {
        await createProduct(data);
        alert("Product/Bundle Registered Successfully!");
      }
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
              Product Form
            </h2>
          </div>
        </div>

        <div className="p-8 space-y-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
              Edit Existing Product
            </label>
            <select
              onChange={handleSelectProduct}
              value={editingProductId || ""}
              className="w-full border-2 border-zinc-100 p-2 text-xs font-bold outline-none bg-white"
            >
              <option value="">-- Create New Product --</option>
              {sellerProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>
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
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Fields Column */}
            <div className="lg:col-span-8 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                  Product Name
                </label>
                <input
                  required
                  name="name"
                  value={formData.name}
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
                    value={formData.category}
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
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full border-b-2 border-zinc-100 p-2 text-lg font-mono font-bold outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* SEASONAL CHECKBOX AND CATEGORY */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="isSeasonal"
                    checked={formData.isSeasonal}
                    onChange={handleChange}
                    className="w-4 h-4 accent-zinc-900 cursor-pointer"
                  />
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                    Is Seasonal?
                  </label>
                </div>
                {formData.isSeasonal && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                      Seasonal Category
                    </label>
                    <input
                      name="seasonalCategory"
                      value={formData.seasonalCategory}
                      onChange={handleChange}
                      className="w-full border-b-2 border-zinc-100 focus:border-amber-600 outline-none p-2 text-sm font-bold uppercase"
                      placeholder="E.G. WET SEASON, HOLIDAY SALE"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                  Technical Specifications
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border-2 border-zinc-50 p-4 min-h-[120px] text-sm font-medium leading-relaxed outline-none focus:border-amber-600"
                  placeholder="Material composition, performance metrics, installation notes..."
                />
              </div>
            </div>
          </div>
          {/* 2. In the JSX (Vehicle Compatibility Matrix section) */}
          <div className="border-t-2 border-zinc-900 border-dashed pt-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-zinc-900 text-amber-500">
                  <Truck size={14} />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">
                  Vehicle Compatibility Matrix
                </h3>
              </div>

              {/* Universal Toggle - only show if not GENERAL/ALL TYPES */}
              {formData.vehicleType &&
                formData.vehicleType !== "GENERAL / ALL TYPES" && (
                  <div className="flex items-center gap-3 bg-zinc-50 px-4 py-2 border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <input
                      type="checkbox"
                      name="isUniversalFit"
                      checked={formData.isUniversalFit}
                      onChange={handleChange}
                      className="w-4 h-4 accent-zinc-900 cursor-pointer"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Universal Fitment
                    </span>
                  </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase">
                  Vehicle Type
                </label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="w-full border-2 border-zinc-100 p-3 text-[10px] font-black uppercase outline-none focus:border-zinc-900"
                >
                  <option value="">GENERAL / ALL TYPES</option>
                  {Object.keys(VEHICLE_DATA).map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditionally hide Make and Year if Universal is checked */}
              {!formData.isUniversalFit && (
                <>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase">
                      Make
                    </label>
                    <select
                      name="vehicleMake"
                      value={formData.vehicleMake}
                      disabled={!formData.vehicleType}
                      onChange={(e) => {
                        // reset models when make changes
                        handleChange(e);
                        setFormData((prev) => ({ ...prev, models: [] }));
                      }}
                      className="w-full border-2 border-zinc-100 p-3 text-[10px] font-black uppercase outline-none focus:border-zinc-900 disabled:opacity-30"
                    >
                      <option value="">SELECT MAKE</option>
                      {formData.vehicleType &&
                        Object.keys(VEHICLE_DATA[formData.vehicleType]).map(
                          (m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ),
                        )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase">
                      Models
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {formData.vehicleType &&
                        formData.vehicleMake &&
                        VEHICLE_DATA[formData.vehicleType][
                          formData.vehicleMake
                        ].map((model) => {
                          const active = formData.models?.includes(model);
                          return (
                            <button
                              key={model}
                              type="button"
                              onClick={() => toggleModel(model)}
                              className={`px-3 py-1 text-xs border rounded-full uppercase font-bold ${
                                active
                                  ? "bg-amber-600 text-white border-amber-600"
                                  : "bg-white text-zinc-900 border-zinc-200"
                              }`}
                            >
                              {model}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase">
                      Year Range
                    </label>
                    <div className="flex gap-2">
                      <input
                        name="yearFrom"
                        value={formData.yearFrom}
                        type="number"
                        placeholder="FROM"
                        onChange={handleChange}
                        className="w-full border-2 border-zinc-100 p-3 text-[10px] font-mono font-bold"
                      />
                      <input
                        name="yearTo"
                        value={formData.yearTo}
                        type="number"
                        placeholder="TO"
                        onChange={handleChange}
                        className="w-full border-2 border-zinc-100 p-3 text-[10px] font-mono font-bold"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          {/* FINAL CONTROLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
            <div className="space-y-4">
              <div className="border-2 border-zinc-900 p-4 flex items-center justify-between bg-zinc-50">
                <span className="text-[10px] font-black uppercase text-zinc-500">
                  Initial Stock
                </span>
                <input
                  required
                  name="stock"
                  type="number"
                  min="1"
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-20 bg-transparent text-right text-lg font-mono font-black outline-none"
                  placeholder="1"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-zinc-900 text-amber-500 py-6 text-sm font-black uppercase tracking-[0.4em] border-b-8 border-amber-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3"
              >
                {loading
                  ? "AUTHORIZING..."
                  : editingProductId
                    ? "UPDATE PRODUCT"
                    : "REGISTER PRODUCT"}
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
