import { useState, useEffect } from "react";
import { getProductsBySeller } from "@/api/products";
import { useAuth } from "@/contexts/AuthContext";
import { useProductContext } from "@/contexts/ProductContext";
import { createProduct } from "@/api/products";
import {
  Package,
  TrendingUp,
  Eye,
  Star,
  Check,
  Camera,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function BundleManagement({ onBundleCreate }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [activeTab, setActiveTab] = useState("select");

  // MANUAL BUNDLE STATE
  const [manualBundleForm, setManualBundleForm] = useState({
    name: "",
    description: "",
    bundleItems: [{ itemName: "", quantity: 1, estimatedPrice: "" }],
    imagePreview: null,
    imageFile: null,
  });
  const [manualDiscountPercent, setManualDiscountPercent] = useState(20);

  // EXISTING SELECT BUNDLE STATE
  const [bundleForm, setBundleForm] = useState({
    name: "",
    description: "",
    bundleContents: [],
    discountPercentage: "",
    compareAtPrice: "",
  });

  useEffect(() => {
    if (user) fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    try {
      const data = await getProductsBySeller(user.uid);
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  // ==================== EXISTING SELECT BUNDLE METHODS ====================
  const toggleProductSelection = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleBundleSubmit = async (e) => {
    e.preventDefault();

    if (selectedProducts.length < 2) {
      toast.error("Please select at least 2 products for a bundle");
      return;
    }

    if (!imageFile) {
      toast.error("Please upload a bundle image");
      return;
    }

    setLoading(true);
    try {
      const selectedProductData = products.filter((p) =>
        selectedProducts.includes(p.id),
      );
      const bundleData = new FormData();

      const totalPrice = selectedProductData.reduce((sum, p) => {
        const raw = p.price ?? 0;
        const num = parseFloat(String(raw).replace(/,/g, "")) || 0;
        return sum + num;
      }, 0);
      const discountPercent = bundleForm.discountPercentage
        ? parseFloat(bundleForm.discountPercentage)
        : 20;
      const bundlePrice = Math.round(totalPrice * (1 - discountPercent / 100));

      bundleData.append(
        "name",
        bundleForm.name ||
          `Bundle: ${selectedProductData.map((p) => p.name).join(" + ")}`,
      );
      bundleData.append(
        "description",
        bundleForm.description ||
          `Bundle containing: ${selectedProductData.map((p) => p.name).join(", ")}`,
      );
      bundleData.append("price", bundlePrice);
      bundleData.append(
        "compareAtPrice",
        bundleForm.compareAtPrice || totalPrice,
      );
      bundleData.append("isBundle", "true");
      bundleData.append("categories", JSON.stringify(["Bundles"]));
      bundleData.append("stock", "1");
      bundleData.append("sellerId", user.uid);
      bundleData.append(
        "storeName",
        user.storeName || user.displayName || "Unknown Store",
      );

      const bundleContents = selectedProductData.map((p) => p.name);
      bundleData.append("bundleContents", JSON.stringify(bundleContents));

      const vehicleComp = { type: "Universal", isUniversalFit: true };
      bundleData.append("vehicleCompatibility", JSON.stringify(vehicleComp));
      bundleData.append("tags", JSON.stringify(["bundle"]));

      if (imageFile) bundleData.append("image", imageFile);

      await createProduct(bundleData);
      toast.success("Bundle created successfully!");
      setSelectedProducts([]);
      setBundleForm({
        name: "",
        description: "",
        bundleContents: [],
        discountPercentage: "",
        compareAtPrice: "",
      });
      setImagePreview(null);
      setImageFile(null);
      fetchProducts();
      onBundleCreate && onBundleCreate();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create bundle");
    } finally {
      setLoading(false);
    }
  };

  // ==================== MANUAL BUNDLE METHODS ====================
  const handleManualItemChange = (index, field, value) => {
    const newItems = [...manualBundleForm.bundleItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setManualBundleForm((prev) => ({ ...prev, bundleItems: newItems }));
  };

  const addManualItem = () => {
    setManualBundleForm((prev) => ({
      ...prev,
      bundleItems: [
        ...prev.bundleItems,
        { itemName: "", quantity: 1, estimatedPrice: "" },
      ],
    }));
  };

  const removeManualItem = (index) => {
    setManualBundleForm((prev) => ({
      ...prev,
      bundleItems: prev.bundleItems.filter((_, i) => i !== index),
    }));
  };

  const handleManualFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setManualBundleForm((prev) => ({ ...prev, imageFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setManualBundleForm((prev) => ({
          ...prev,
          imagePreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateManualTotalPrice = () => {
    return manualBundleForm.bundleItems.reduce((total, item) => {
      const price = parseFloat(item.estimatedPrice) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return total + price * quantity;
    }, 0);
  };

  const calculateManualBundlePrice = () => {
    const totalPrice = calculateManualTotalPrice();
    return Math.round(totalPrice * (1 - manualDiscountPercent / 100));
  };

  const handleManualBundleSubmit = async (e) => {
    e.preventDefault();

    if (!manualBundleForm.name.trim()) {
      toast.error("Bundle name is required");
      return;
    }

    if (manualBundleForm.bundleItems.length === 0) {
      toast.error("Add at least one item to the bundle");
      return;
    }

    const hasValidItems = manualBundleForm.bundleItems.every(
      (item) => item.itemName.trim() && item.estimatedPrice,
    );
    if (!hasValidItems) {
      toast.error("All items must have a name and price");
      return;
    }

    if (!manualBundleForm.imageFile) {
      toast.error("Bundle image is required");
      return;
    }

    setLoading(true);
    try {
      const bundleData = new FormData();
      const totalPrice = calculateManualTotalPrice();
      const bundlePrice = calculateManualBundlePrice();

      bundleData.append("name", manualBundleForm.name);
      bundleData.append(
        "description",
        manualBundleForm.description ||
          `Bundle containing: ${manualBundleForm.bundleItems.map((item) => item.itemName).join(", ")}`,
      );
      bundleData.append("price", bundlePrice);
      bundleData.append("compareAtPrice", totalPrice);
      bundleData.append("isBundle", "true");
      bundleData.append("categories", JSON.stringify(["Bundles"]));
      bundleData.append("stock", "1");
      bundleData.append("sellerId", user.uid);
      bundleData.append(
        "storeName",
        user.storeName || user.displayName || "Unknown Store",
      );

      const bundleContents = manualBundleForm.bundleItems.map(
        (item) => `${item.itemName} (x${item.quantity})`,
      );
      bundleData.append("bundleContents", JSON.stringify(bundleContents));

      const vehicleComp = { type: "Universal", isUniversalFit: true };
      bundleData.append("vehicleCompatibility", JSON.stringify(vehicleComp));
      bundleData.append("tags", JSON.stringify(["bundle"]));

      if (manualBundleForm.imageFile)
        bundleData.append("image", manualBundleForm.imageFile);

      await createProduct(bundleData);
      toast.success("Manual bundle created successfully!");
      setManualBundleForm({
        name: "",
        description: "",
        bundleItems: [{ itemName: "", quantity: 1, estimatedPrice: "" }],
        imagePreview: null,
        imageFile: null,
      });
      setManualDiscountPercent(20);
      fetchProducts();
      onBundleCreate && onBundleCreate();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create manual bundle");
    } finally {
      setLoading(false);
    }
  };

  const selectedProductData = products.filter((p) =>
    selectedProducts.includes(p.id),
  );
  const totalPrice = selectedProductData.reduce((sum, p) => {
    const raw = p.price ?? 0;
    const num = parseFloat(String(raw).replace(/,/g, "")) || 0;
    return sum + num;
  }, 0);
  const discountPercent = bundleForm.discountPercentage
    ? parseFloat(bundleForm.discountPercentage)
    : 20;
  const discountedPrice = Math.round(totalPrice * (1 - discountPercent / 100));
  const sortedProducts = [...products].sort(
    (a, b) => (a.soldCount || 0) - (b.soldCount || 0),
  );

  const manualTotalPrice = calculateManualTotalPrice();
  const manualBundlePrice = calculateManualBundlePrice();
  const manualSavings = manualTotalPrice - manualBundlePrice;

  return (
    <div className="space-y-8">
      {/* TABS */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("select")}
          className={`px-6 py-3 font-bold uppercase text-sm border-b-2 transition-colors ${
            activeTab === "select"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-gray-500"
          }`}
        >
          📦 Select Products
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={`px-6 py-3 font-bold uppercase text-sm border-b-2 transition-colors ${
            activeTab === "manual"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-500"
          }`}
        >
          ✏️ Create Manually
        </button>
      </div>

      {/* SELECT PRODUCTS TAB */}
      {activeTab === "select" && (
        <>
          <div className="border-2 border-zinc-900 bg-white shadow-[12px_12px_0px_0px_rgba(24,24,27,1)] p-6">
            <div className="flex items-center gap-3 mb-6">
              <Package size={20} className="text-zinc-900" />
              <h2 className="text-lg font-black uppercase tracking-widest">
                Select Products for Bundle
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedProducts.map((product) => (
                <div
                  key={product.id}
                  className={`border-2 p-4 cursor-pointer transition-all ${
                    selectedProducts.includes(product.id)
                      ? "border-amber-600 bg-amber-50"
                      : "border-zinc-200"
                  }`}
                  onClick={() => toggleProductSelection(product.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                      className="mt-1 w-4 h-4 accent-zinc-900"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold uppercase mb-2">
                        {product.name}
                      </h3>
                      <div className="space-y-1 text-xs">
                        <div>Sold: {product.soldCount || 0}</div>
                        <div>Views: {product.viewCount || 0}</div>
                        <div>Rating: {(product.rating || 0).toFixed(1)}</div>
                      </div>
                      <p className="text-sm font-mono mt-2">
                        ₱{product.price?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedProducts.length > 0 && (
            <div className="border-2 border-zinc-900 bg-white shadow-[12px_12px_0px_0px_rgba(24,24,27,1)] p-6">
              <h2 className="text-lg font-black uppercase mb-6">
                Create Bundle
              </h2>

              <div className="space-y-6">
                <div className="group relative aspect-square border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center bg-zinc-50 max-w-xs">
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <img
                        src={imagePreview}
                        className="w-full h-full object-cover"
                        alt="Bundle"
                      />
                      <button
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center">
                      <Camera size={32} className="text-zinc-400 mb-2" />
                      <span className="text-xs font-black uppercase">
                        Add Photo
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input
                    type="text"
                    value={bundleForm.name}
                    onChange={(e) =>
                      setBundleForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Bundle name (optional)"
                    className="border-b-2 border-zinc-100 p-2 text-lg font-bold"
                  />
                  <input
                    type="number"
                    value={bundleForm.discountPercentage}
                    onChange={(e) =>
                      setBundleForm((prev) => ({
                        ...prev,
                        discountPercentage: e.target.value,
                      }))
                    }
                    placeholder="Discount %"
                    min="0"
                    max="100"
                    className="border-b-2 border-zinc-100 p-2"
                  />
                </div>

                <textarea
                  value={bundleForm.description}
                  onChange={(e) =>
                    setBundleForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Description (optional)"
                  className="w-full border-2 border-zinc-900 p-3 min-h-[80px]"
                />

                <div className="bg-zinc-50 border-2 border-zinc-900 p-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs font-black">Total</p>
                    <p className="text-lg font-bold">
                      ₱{totalPrice.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black">Discount</p>
                    <p className="text-lg font-bold text-red-600">
                      -{discountPercent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black">Bundle</p>
                    <p className="text-lg font-bold text-green-600">
                      ₱{discountedPrice.toLocaleString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleBundleSubmit}
                  disabled={loading}
                  className="w-full bg-zinc-900 text-amber-500 py-4 text-sm font-black uppercase border-b-4 border-amber-700 disabled:opacity-50"
                >
                  {loading ? "CREATING..." : "CREATE BUNDLE"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MANUAL CREATE TAB */}
      {activeTab === "manual" && (
        <div className="border-2 border-zinc-900 bg-white shadow-[12px_12px_0px_0px_rgba(24,24,27,1)] p-6 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Package size={20} className="text-zinc-900" />
            <h2 className="text-lg font-black uppercase tracking-widest">
              Manually Create Bundle
            </h2>
          </div>

          <div>
            <label className="text-sm font-black uppercase text-zinc-400 tracking-widest block mb-2">
              Bundle Name *
            </label>
            <input
              type="text"
              value={manualBundleForm.name}
              onChange={(e) =>
                setManualBundleForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="e.g., Premium Bundle Kit"
              className="w-full border-b-2 border-zinc-100 focus:border-amber-600 outline-none p-2 text-lg font-bold uppercase transition-colors"
            />
          </div>

          <div>
            <label className="text-sm font-black uppercase text-zinc-400 tracking-widest block mb-2">
              Description (Optional)
            </label>
            <textarea
              value={manualBundleForm.description}
              onChange={(e) =>
                setManualBundleForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe your bundle..."
              className="w-full border-2 border-zinc-100 focus:border-amber-600 p-3 min-h-[80px] outline-none transition-colors"
              rows="3"
            />
          </div>

          {/* IMAGE */}
          <div>
            <label className="text-sm font-black uppercase text-zinc-400 tracking-widest block mb-2">
              Bundle Image *
            </label>
            {!manualBundleForm.imagePreview ? (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-zinc-200 hover:border-amber-500 rounded-lg cursor-pointer bg-zinc-50 hover:bg-amber-50 transition-colors">
                <Camera className="w-10 h-10 text-zinc-400 hover:text-amber-600 mb-2 transition-colors" />
                <span className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900">
                  Add Bundle Photo
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleManualFileChange}
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={manualBundleForm.imagePreview}
                  alt="Bundle"
                  className="w-full h-48 object-cover rounded-lg border-2 border-zinc-200"
                />
                <button
                  onClick={() =>
                    setManualBundleForm((prev) => ({
                      ...prev,
                      imagePreview: null,
                      imageFile: null,
                    }))
                  }
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* ITEMS */}
          <div className="border-t-2 border-zinc-200 pt-6 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-black uppercase text-zinc-400 tracking-widest">
                Bundle Items *
              </label>
              <button
                onClick={addManualItem}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-amber-500 rounded-md text-xs font-black uppercase border-b-2 border-amber-700 hover:bg-black transition-all"
              >
                <Plus size={16} /> Add Item
              </button>
            </div>

            {manualBundleForm.bundleItems.map((item, index) => (
              <div key={index} className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-bold text-zinc-600 block mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={item.itemName}
                    onChange={(e) =>
                      handleManualItemChange(index, "itemName", e.target.value)
                    }
                    placeholder="e.g., Brake Pads"
                    className="w-full px-3 py-2 border-2 border-zinc-100 rounded-md focus:border-amber-600 outline-none text-sm transition-colors"
                  />
                </div>
                <div className="w-20">
                  <label className="text-xs font-bold text-zinc-600 block mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleManualItemChange(
                        index,
                        "quantity",
                        parseInt(e.target.value) || 1,
                      )
                    }
                    className="w-full px-2 py-2 border-2 border-zinc-100 rounded-md focus:border-amber-600 outline-none text-sm text-center transition-colors font-bold"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-zinc-600 block mb-1">
                    Price (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.estimatedPrice}
                    onChange={(e) =>
                      handleManualItemChange(
                        index,
                        "estimatedPrice",
                        e.target.value,
                      )
                    }
                    placeholder="0.00"
                    className="w-full px-3 py-2 border-2 border-zinc-100 rounded-md focus:border-amber-600 outline-none text-sm transition-colors font-mono"
                  />
                </div>
                {manualBundleForm.bundleItems.length > 1 && (
                  <button
                    onClick={() => removeManualItem(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* PRICING */}
          <div className="bg-zinc-50 border-2 border-zinc-900 p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs font-black uppercase text-zinc-500">
                  Total Value
                </p>
                <p className="text-lg font-mono font-bold text-zinc-900 mt-1">
                  ₱{manualTotalPrice.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-xs font-black uppercase text-zinc-500 block mb-2">
                  Discount %
                </label>
                <div className="flex items-center justify-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={manualDiscountPercent}
                    onChange={(e) =>
                      setManualDiscountPercent(
                        Math.max(
                          0,
                          Math.min(100, parseInt(e.target.value) || 0),
                        ),
                      )
                    }
                    className="w-full px-2 py-1 border-2 border-zinc-100 rounded-md outline-none text-center font-mono font-bold"
                  />
                  <span className="text-lg font-black">%</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-black uppercase text-zinc-500">
                  Bundle Price
                </p>
                <p className="text-lg font-mono font-bold text-green-600 mt-1">
                  ₱{manualBundlePrice.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-green-600 uppercase">
                Save ₱{manualSavings.toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={handleManualBundleSubmit}
            disabled={loading}
            className="w-full bg-zinc-900 text-amber-500 py-4 text-sm font-black uppercase tracking-[0.4em] border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
          >
            {loading ? "CREATING BUNDLE..." : "CREATE BUNDLE"}
          </button>
        </div>
      )}
    </div>
  );
}
