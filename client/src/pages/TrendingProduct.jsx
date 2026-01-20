// src/pages/TrendingProduct.jsx
import { useState, useEffect } from "react";
import { getTrendingProducts } from "@/api/products";
import ProductCard from "@/components/ProductCard";
import { TrendingUp } from "lucide-react";
import { useFilters } from "@/contexts/FilterContext";
import { useSearch } from "@/contexts/SearchContext";
import { useNavigate } from "react-router-dom";

export default function TrendingProduct() {
  const { filters } = useFilters();
  const { searchResults, searchQuery, isSearching } = useSearch(); // Consume Search
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadTrending = async () => {
      setLoading(true);
      try {
        const data = await getTrendingProducts();
        setTrending(data || []);
      } finally {
        setLoading(false);
      }
    };
    loadTrending();
  }, []);

  const isUserSearching = searchQuery.trim().length > 1;

  // Determine what to show: Global Search Results or Local Trending Feed
  const displayItems = isUserSearching
    ? searchResults
    : trending.filter((p) => {
        let match = true;
        if (filters.category) match = match && p.category === filters.category;
        if (filters.vehicleType) {
          match =
            match &&
            (p.vehicleCompatibility?.type === filters.vehicleType ||
              p.vehicleCompatibility?.type === "Universal");
        }
        if (filters.vehicle.make)
          match =
            match &&
            p.vehicleCompatibility?.makes?.includes(filters.vehicle.make);
        if (filters.vehicle.model)
          match =
            match &&
            p.vehicleCompatibility?.models?.includes(filters.vehicle.model);
        return match;
      });

  if (loading || isSearching)
    return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-2">
        <TrendingUp className="text-orange-500" />
        <h1 className="text-2xl font-bold text-gray-800">
          {isUserSearching ? `Results for "${searchQuery}"` : "Trend Spotlight"}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayItems.length > 0 ? (
          displayItems.map((product, index) => (
            <div key={product.id} className="relative">
              {/* Only show trending badge if NOT searching */}
              {!isUserSearching && (
                <div className="absolute top-3 left-3 z-10 bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg uppercase tracking-wider">
                  #{index + 1} Trending
                </div>
              )}
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => navigate(`/products/${product.id}`)}
              />
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-gray-500">
            No products found.
          </div>
        )}
      </div>
    </div>
  );
}
