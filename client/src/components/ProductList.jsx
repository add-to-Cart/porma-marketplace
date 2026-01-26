import { useEffect, useState } from "react";
import { useSearch } from "@/contexts/SearchContext";
import { getAllProducts } from "@/api/products";
import ProductCard from "./ProductCard";
import { useNavigate } from "react-router-dom";

export default function ProductList() {
  // 1. Get Global Search state from Context
  const { searchResults, searchQuery, isSearching } = useSearch();

  // 2. Local state for initial/all products
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load initial products on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const data = await getAllProducts();
        setAllProducts(data);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // 3. Logic: Determine what to display
  // If user is searching (typed > 1 char), show searchResults from context.
  // Otherwise, show all products.
  const isUserSearching = searchQuery.trim().length > 1;
  const itemsToDisplay = isUserSearching ? searchResults : allProducts;

  // Loading State
  if (loading || isSearching) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-80 w-full bg-gray-100 animate-pulse rounded-2xl"
          />
        ))}
      </div>
    );
  }

  // Empty State
  if (itemsToDisplay.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-medium text-gray-500">
          {isUserSearching
            ? `No parts found for "${searchQuery}"`
            : "No products available yet."}
        </h3>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Search Header */}
      {isUserSearching && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Search Results for "{searchQuery}"
          </h2>
          <p className="text-gray-500">{itemsToDisplay.length} items found</p>
        </div>
      )}

      {/* The Grid Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {itemsToDisplay.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => navigate(`/products/${product.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
