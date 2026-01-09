import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "@/services/getProducts";
import ProductCard from "@/components/ProductCard";

import { useFilters } from "@/contexts/FilterContext";

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const { filters } = useFilters();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  if (loading) return <p className="p-4">Loading products...</p>;

  const filteredProducts = products.filter((p) => {
    let match = true;
    if (filters.category) match = match && p.category === filters.category;
    if (filters.vehicleType)
      match = match && p.vehicleType === filters.vehicleType;
    return match;
  });

  const handleUpdateClick = (product) => {
    navigate(`/products/update/${product.id}`);
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen">
      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.length === 0 ? (
          <p className="text-sm text-gray-500 col-span-full">
            No products found.
          </p>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={handleUpdateClick} // Pass click handler
            />
          ))
        )}
      </div>
    </div>
  );
}
