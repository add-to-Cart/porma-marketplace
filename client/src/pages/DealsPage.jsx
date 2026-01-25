import { useEffect, useState } from "react";
import api from "@/api/api";
import ProductCard from "@/components/ProductCard";
import { Sparkles, CloudRain, Package, Percent, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFilters } from "@/contexts/FilterContext";
import { calculateTrendingScore } from "@/utils/trendingAlgorithm";

export default function DealsPage() {
  const [bundles, setBundles] = useState([]);
  const [seasonal, setSeasonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // all, bundles, seasonal
  const [sortBy, setSortBy] = useState("discount");
  const navigate = useNavigate();
  const { applyFilters } = useFilters();

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await api.get("/products/deals");
        console.log("Fetched deals:", response.data); // Add this
        setBundles(response.data.bundles || []);
        setSeasonal(response.data.seasonal || []);
      } catch (err) {
        console.error("Error loading deals", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  // Get display products based on active tab
  const getDisplayProducts = () => {
    let products = [];

    switch (activeTab) {
      case "bundles":
        products = bundles;
        break;
      case "seasonal":
        products = seasonal;
        break;
      default:
        products = [...bundles, ...seasonal];
    }

    // Apply global filters, but skip vehicle-specific ones for bundles/seasonal
    products = products.filter((product) => {
      // Always allow if it's a bundle or seasonal (universal)
      if (product.isBundle || product.isSeasonal) return true;

      // Otherwise, apply full filters
      return applyFilters([product], "").length > 0;
    });

    // Sort products (your existing sort logic)
    return products.sort((a, b) => {
      switch (sortBy) {
        case "discount": {
          const discountA = a.compareAtPrice
            ? ((a.compareAtPrice - a.price) / a.compareAtPrice) * 100
            : 0;
          const discountB = b.compareAtPrice
            ? ((b.compareAtPrice - b.price) / b.compareAtPrice) * 100
            : 0;
          return discountB - discountA;
        }
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "popular":
          return (b.soldCount || 0) - (a.soldCount || 0);
        case "newest": {
          const timeA = a.createdAt?._seconds || a.createdAt?.seconds || 0;
          const timeB = b.createdAt?._seconds || b.createdAt?.seconds || 0;
          return timeB - timeA;
        }
        default:
          return 0;
      }
    });
  };

  const displayProducts = getDisplayProducts();

  if (loading) {
    return (
      <div className="p-20 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Curating best deals...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      {/* Hero Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-10 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="animate-pulse" size={40} />
          <h1 className="text-4xl font-black">Exclusive Deals</h1>
        </div>
        <p className="text-blue-100 mb-6">
          Handpicked kits, bundles, and seasonal promotions for your ride.
        </p>
      </header>

      {/* Tabs & Filters */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b px-6">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-4 font-bold transition-all relative ${
              activeTab === "all"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All Deals
            {activeTab === "all" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("bundles")}
            className={`px-6 py-4 font-bold transition-all relative flex items-center gap-2 ${
              activeTab === "bundles"
                ? "text-orange-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Package size={18} />
            Bundle Deals
            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-black rounded-full">
              {bundles.length}
            </span>
            {activeTab === "bundles" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600 rounded-t"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("seasonal")}
            className={`px-6 py-4 font-bold transition-all relative flex items-center gap-2 ${
              activeTab === "seasonal"
                ? "text-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <CloudRain size={18} />
            Seasonal
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-black rounded-full">
              {seasonal.length}
            </span>
            {activeTab === "seasonal" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600 rounded-t"></div>
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 bg-gray-50 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Filter size={16} />
            Filters:
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="discount">Biggest Discount</option>
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="popular">Most Popular</option>
          </select>

          {sortBy !== "discount" && (
            <button
              onClick={() => setSortBy("discount")}
              className="text-sm text-blue-600 hover:underline font-semibold"
            >
              Reset Sort
            </button>
          )}

          <div className="ml-auto text-sm text-gray-600">
            <span className="font-bold">{displayProducts.length}</span> deals
            found
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {displayProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
          {displayProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => navigate(`/products/${product.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎁</div>
          <h3 className="text-xl font-medium text-gray-500">No deals found</h3>
          <p className="text-gray-400 mt-2">
            Check back later for amazing offers!
          </p>
        </div>
      )}
    </div>
  );
}
