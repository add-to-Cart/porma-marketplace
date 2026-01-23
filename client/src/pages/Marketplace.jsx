import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllProducts } from "@/api/products.js";
import ProductCard from "@/components/ProductCard";
import { useFilters } from "@/contexts/FilterContext";
import { useSearch } from "@/contexts/SearchContext";

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { filters } = useFilters();
  const { searchResults, searchQuery, isSearching } = useSearch();

  useEffect(() => {
    const fetchMarketplace = async () => {
      // If a search is active, don't fetch the general feed
      if (searchQuery.trim().length > 1) return;

      setLoading(true);
      try {
        const data = await getAllProducts(filters);
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMarketplace();
  }, [filters, searchQuery]);

  const isUserSearching = searchQuery.trim().length > 1;
  const finalDisplay = isUserSearching ? searchResults : products;

  if (loading || isSearching) {
    return <p className="p-4 text-center">Loading Discovery Feed...</p>;
  }

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen">
      {/* Search Indicator */}
      {isUserSearching && (
        <div className="px-2">
          <h2 className="text-xl font-bold">Results for "{searchQuery}"</h2>
          <p className="text-gray-500 text-sm">
            {finalDisplay.length} parts found
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {finalDisplay.length === 0 ? (
          <p className="text-sm text-gray-500 col-span-full text-center py-20">
            No products found matching your criteria.
          </p>
        ) : (
          finalDisplay.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => navigate(`/products/${product.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
