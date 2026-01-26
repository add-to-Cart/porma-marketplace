import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAllProducts } from "@/api/products.js";
import ProductCard from "@/components/ProductCard";
import { useFilters } from "@/contexts/FilterContext";
import { useSearch } from "@/contexts/SearchContext";
import Sidebar from "@/components/Sidebar";

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();
  const observer = useRef();

  const { filters, applyFilters } = useFilters();
  const { searchResults, searchQuery, isSearching } = useSearch();

  // Infinite scroll observer
  const lastProductRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  // Fetch products with pagination
  const fetchProducts = async (pageNum, reset = false) => {
    if (loading) return;

    setLoading(true);
    try {
      const data = await getAllProducts(filters, pageNum, 20);

      if (reset) {
        setProducts(data.products || data);
      } else {
        setProducts((prev) => [...prev, ...(data.products || data)]);
      }

      // Check if there are more products
      setHasMore(
        data.hasMore !== false && (data.products || data).length === 20,
      );
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Reset and fetch when filters change
  useEffect(() => {
    setProducts([]);
    setPage(0);
    setHasMore(true);
    fetchProducts(0, true);
  }, [filters]);

  // Fetch more products when page changes
  useEffect(() => {
    if (page > 0) {
      fetchProducts(page);
    }
  }, [page]);

  // Determine what to display
  const isUserSearching = searchQuery.trim().length > 1;
  const displayProducts = isUserSearching
    ? searchResults
    : applyFilters(products, "");

  if (loading && products.length === 0) {
    return (
      <div className="flex gap-6 p-6 min-h-screen">
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-80 w-full bg-gray-100 animate-pulse rounded-2xl"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 p-6 min-h-screen">
      <div className="flex-1 flex flex-col gap-6">
        {/* Search Indicator */}
        {isUserSearching && (
          <div className="px-2">
            <h2 className="text-xl font-bold">Results for "{searchQuery}"</h2>
            <p className="text-gray-500 text-sm">
              {displayProducts.length} parts found
            </p>
          </div>
        )}

        {/* Products Counter */}
        {!isUserSearching && (
          <div className="px-2">
            <p className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-bold">{displayProducts.length}</span>{" "}
              products
              {hasMore && " (scroll for more)"}
            </p>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayProducts.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl font-medium text-gray-500">
                No products found matching your criteria.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            displayProducts.map((product, index) => {
              const isLast = index === displayProducts.length - 1;
              return (
                <div
                  key={product.id}
                  ref={isLast && !isUserSearching ? lastProductRef : null}
                >
                  <ProductCard
                    product={product}
                    onClick={() => navigate(`/products/${product.id}`)}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Loading Indicator */}
        {loading && products.length > 0 && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* End of Results */}
        {!hasMore && !loading && products.length > 0 && !isUserSearching && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg font-semibold">You've reached the end!</p>
            <p className="text-sm">No more products to load</p>
          </div>
        )}
      </div>
    </div>
  );
}
