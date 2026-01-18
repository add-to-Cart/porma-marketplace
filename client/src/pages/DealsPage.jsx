import { useEffect, useState } from "react";
import api from "@/api/api";
import ProductCard from "@/components/ProductCard";
import { Sparkles, CloudRain, Package, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DealsPage() {
  const [rainyKits, setRainyKits] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        // Fetch bundles and seasonal items using flags
        const [bundleRes, seasonalRes] = await Promise.all([
          api.get("/products?isBundle=true"),
          api.get("/products?isSeasonal=true"),
        ]);
        setBundles(bundleRes.data);
        setRainyKits(seasonalRes.data); // Assuming rainy kits are seasonal
      } catch (err) {
        console.error("Error loading deals", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  if (loading)
    return (
      <div className="p-20 text-center animate-pulse">
        Curating best deals...
      </div>
    );

  return (
    <div className="max-w-[1200px] mx-auto p-6 space-y-16">
      {/* Hero Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-10 text-white">
        <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
          <Sparkles /> Exclusive Deals
        </h1>
        <p className="text-blue-100">
          Handpicked kits and bundles for your ride.
        </p>
      </header>

      {/* Seasonal Section */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <CloudRain size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Seasonal Items</h2>
            <p className="text-gray-500 text-sm">
              Limited-time offers and seasonal promotions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {rainyKits.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => navigate(`/products/${product.id}`)}
            />
          ))}
        </div>
      </section>

      {/* Bundled Deals Section */}
      <section className="pb-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
            <Package size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Value Bundles</h2>
            <p className="text-gray-500 text-sm">
              Buy together and save more on maintenance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bundles.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => navigate(`/products/${product.id}`)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
