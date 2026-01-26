import { useState, useEffect } from "react";
import { getTrendingProducts } from "@/api/products";
import ProductCard from "@/components/ProductCard";
import { TrendingUp, Flame } from "lucide-react";
import { useSearch } from "@/contexts/SearchContext";
import { useFilters } from "@/contexts/FilterContext";
import { useNavigate } from "react-router-dom";

export default function TrendingProduct() {
  const { searchResults, searchQuery, isSearching } = useSearch();
  const { filters, applyFilters } = useFilters();
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadTrending = async () => {
      setLoading(true);
      try {
        const data = await getTrendingProducts(24); // Get top 24 trending products
        setTrending(data || []);
      } catch (error) {
        console.error("Failed to load trending products:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTrending();
  }, []);

  const isUserSearching = searchQuery.trim().length > 1;
  const displayItems = isUserSearching
    ? searchResults
    : applyFilters(trending, "");

  if (loading || isSearching) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-80 w-full bg-gray-100 animate-pulse rounded-2xl"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl p-10 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Flame size={40} className="animate-pulse" />
          <h1 className="text-4xl font-black">
            {isUserSearching ? `Results for "${searchQuery}"` : "Trending Now"}
          </h1>
        </div>
        <p className="text-orange-100">
          {isUserSearching
            ? `${displayItems.length} products found`
            : "Most popular parts flying off the shelves"}
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayItems.length > 0 ? (
          displayItems.map((product, index) => (
            <div key={product.id} className="relative">
              {/* Trending Badge - Only show if NOT searching */}
              {!isUserSearching && index < 10 && (
                <div className="absolute -top-3 -left-3 z-10">
                  <div className="bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-lg flex items-center gap-1">
                    <Flame size={14} />#{index + 1}
                  </div>
                </div>
              )}

              {/* Top 3 Special Styling */}
              <div
                className={`${
                  !isUserSearching && index < 3
                    ? "ring-2 ring-orange-400 ring-offset-2 rounded-2xl"
                    : ""
                }`}
              >
                <ProductCard
                  product={product}
                  onClick={() => navigate(`/products/${product.id}`)}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No products found
            </h3>
            <p className="text-gray-500">
              {isUserSearching
                ? "Try adjusting your search terms"
                : "No trending products available at the moment"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
