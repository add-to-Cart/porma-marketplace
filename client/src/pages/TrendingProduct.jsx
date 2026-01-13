import { useState, useEffect } from "react";
import { getTrendingProducts } from "@/api/products";
import ProductCard from "@/components/ProductCard";
import { TrendingUp } from "lucide-react";

export default function TrendingProduct() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTrendingProducts()
      .then((data) => {
        setTrending(data || []);
      })
      .catch((err) => {
        console.error("Frontend Trending Error:", err);
        setTrending([]); // Set to empty so it doesn't crash
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="p-10 text-center">Analysing market trends...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="text-orange-500" />
        <h1 className="text-2xl font-bold">Trend Spotlight</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {trending.map((product, index) => (
          <div key={product.id} className="relative">
            <div className="absolute top-2 left-2 z-10 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
              #{index + 1} Trending
            </div>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
