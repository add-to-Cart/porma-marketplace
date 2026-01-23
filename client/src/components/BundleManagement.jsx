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
  CloudRain,
} from "lucide-react";
import toast from "react-hot-toast";

export default function BundleManagement() {
  const { user } = useAuth();
  const { addProductToList } = useProductContext();
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [bundleForm, setBundleForm] = useState({
    name: "",
    description: "",
    discountPercentage: "",
    compareAtPrice: "",
  });

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const data = await getProductsBySeller(user.uid);
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  // ADDED: Missing handler for file uploads
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBundleSubmit = async (e) => {
    e.preventDefault();
    if (selectedProducts.length < 2) {
      alert("Please select at least 2 products for a bundle");
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
      bundleData.append("category", "Bundles");
      bundleData.append("stock", "1");
      bundleData.append("sellerId", user.uid);
      bundleData.append(
        "storeName",
        user.storeName || user.displayName || "Unknown Store",
      );

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
        discountPercentage: "",
        compareAtPrice: "",
      });
      setImagePreview(null);
      setImageFile(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create bundle");
    } finally {
      setLoading(false);
    }
  }; // Fixed missing closing bracket here

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
  return (
    <div className="space-y-8">
      {/* PRODUCT SELECTION */}
      <div className="border-2 border-zinc-900 bg-white shadow-[12px_12px_0px_0px_rgba(24,24,27,1)] p-6">
        <div className="flex items-center gap-3 mb-6">
          <Package size={20} className="text-zinc-900" />
          <h2 className="text-lg font-black uppercase tracking-widest">
            Select Products for Bundle (Low Sales First)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedProducts.map((product) => (
            <div
              key={product.id}
              className={`border-2 p-4 cursor-pointer transition-all ${
                selectedProducts.includes(product.id)
                  ? "border-amber-600 bg-amber-50"
                  : "border-zinc-200 hover:border-zinc-400"
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
                <div className="flex-1">
                  <h3 className="text-sm font-bold uppercase leading-tight mb-2">
                    {product.name}
                  </h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={12} className="text-red-500" />
                      <span>Sold: {product.soldCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye size={12} className="text-blue-500" />
                      <span>Views: {product.viewCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star size={12} className="text-yellow-500" />
                      <span>
                        Rating: {(product.rating || 0).toFixed(1)} (
                        {product.ratingsCount || 0})
                      </span>
                    </div>
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

      {/* BUNDLE FORM */}
      {selectedProducts.length > 0 && (
        <div className="border-2 border-zinc-900 bg-white shadow-[12px_12px_0px_0px_rgba(24,24,27,1)] p-6">
          <div className="flex items-center gap-3 mb-6">
            <Check size={20} className="text-zinc-900" />
            <div className="flex-1">
              <h2 className="text-lg font-black uppercase tracking-widest">
                Create Bundle ({selectedProducts.length} products selected)
              </h2>
              {bundleForm.seasonalCategory && (
                <div className="flex items-center gap-2 mt-2">
                  <CloudRain size={16} className="text-blue-500" />
                  <p className="text-sm font-bold text-blue-600 uppercase">
                    {bundleForm.seasonalCategory}
                  </p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleBundleSubmit} className="space-y-6">
            {/* BUNDLE IMAGE UPLOAD */}
            <div className="space-y-4">
              <label className="text-sm font-black uppercase">
                Bundle Image
              </label>
              <div className="group relative aspect-square border-2 border-dashed border-zinc-200 hover:border-amber-500 transition-colors flex flex-col items-center justify-center bg-zinc-50 overflow-hidden max-w-xs">
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img
                      src={imagePreview}
                      className="w-full h-full object-cover"
                      alt="Bundle Preview"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center">
                    <Camera
                      size={32}
                      strokeWidth={1}
                      className="text-zinc-400 group-hover:text-amber-600 mb-2"
                    />
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-900">
                      Add Bundle Photo
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-black uppercase">
                  Bundle Name
                </label>
                <input
                  type="text"
                  value={bundleForm.name}
                  onChange={(e) =>
                    setBundleForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Custom bundle name (optional)"
                  className="w-full border-2 border-zinc-900 p-3 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black uppercase">
                  Discount Percentage (%)
                </label>
                <input
                  type="number"
                  value={bundleForm.discountPercentage}
                  onChange={(e) =>
                    setBundleForm((prev) => ({
                      ...prev,
                      discountPercentage: e.target.value,
                    }))
                  }
                  placeholder="20"
                  min="0"
                  max="100"
                  className="w-full border-2 border-zinc-900 p-3 font-mono"
                />
              </div>
            </div>

            {/* PRICE DISPLAY */}
            <div className="bg-zinc-50 border-2 border-zinc-900 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs font-black uppercase text-zinc-500">
                    Total Price
                  </p>
                  <p className="text-lg font-mono font-bold text-zinc-900">
                    ₱{totalPrice.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-zinc-500">
                    Discount
                  </p>
                  <p className="text-lg font-mono font-bold text-red-600">
                    -{discountPercent}%
                  </p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-zinc-500">
                    Bundle Price
                  </p>
                  <p className="text-lg font-mono font-bold text-green-600">
                    ₱{discountedPrice.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black uppercase">
                Description
              </label>
              <textarea
                value={bundleForm.description}
                onChange={(e) =>
                  setBundleForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Bundle description (optional)"
                className="w-full border-2 border-zinc-900 p-3 min-h-[100px]"
              />
            </div>

            {/* SELECTED PRODUCTS DISPLAY */}
            <div className="space-y-2">
              <label className="text-sm font-black uppercase">
                Items in Bundle
              </label>
              <div className="border-2 border-zinc-900 p-3 bg-zinc-50">
                <ul className="list-disc list-inside space-y-1">
                  {selectedProductData.map((product) => (
                    <li key={product.id} className="text-sm font-medium">
                      {product.name} - ₱{product.price?.toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-amber-500 py-4 text-sm font-black uppercase tracking-[0.4em] border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all"
            >
              {loading ? "CREATING BUNDLE..." : "CREATE BUNDLE"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
