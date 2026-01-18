import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

import {
  getProductById,
  getRelatedProducts,
  getTrendingProducts,
} from "@/api/products";
import ProductCard from "@/components/ProductCard";
import Rating from "@/components/Rating";
import {
  ChevronLeft,
  ShoppingCart,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  CheckCircle2,
  Settings,
  ArrowRight,
  Percent,
  Snowflake,
  ListChecks,
} from "lucide-react";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [related, setRelated] = useState([]);
  const [trending, setTrending] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        setProduct(data);
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      getRelatedProducts(id, {
        category: product.category,
        make: product.vehicleCompatibility?.makes?.[0],
      }).then(setRelated);

      getTrendingProducts().then(setTrending);
    }
  }, [product, id]);

  if (loading)
    return (
      <div className="p-20 text-center animate-pulse text-gray-400 font-medium">
        Loading Part Details...
      </div>
    );
  if (!product)
    return <div className="p-20 text-center">Product not found.</div>;

  const isUniversal = product.vehicleCompatibility?.isUniversalFit;

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-6 lg:pt-10">
      {/* 1. Slim Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-6">
        <Link to="/" className="hover:text-blue-600">
          Marketplace
        </Link>
        <ChevronLeft size={10} className="rotate-180" />
        <span className="text-gray-900">{product.category}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* 2. Media Section (More compact container) */}
        <div className="lg:col-span-6">
          <div className="sticky top-28 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain p-4 hover:scale-105 transition-transform"
              />
            </div>
          </div>
        </div>

        {/* 3. Buying Section (Standard font sizes) */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-4">
              {product.isBundle && product.compareAtPrice && (
                <span className="text-2xl text-zinc-400 line-through font-bold decoration-red-500/50">
                  ₱{product.compareAtPrice.toLocaleString()}
                </span>
              )}
              <span className="text-5xl font-black tracking-tighter">
                ₱{product.price?.toLocaleString()}
              </span>
              {product.isBundle && product.compareAtPrice && (
                <span className="text-lg font-bold text-green-600">
                  Save ₱
                  {(product.compareAtPrice - product.price)?.toLocaleString()}
                </span>
              )}
            </div>

            {product.isBundle && product.compareAtPrice && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded border border-emerald-100 w-fit">
                <Percent size={14} />
                <span className="text-[10px] font-black uppercase">
                  Bundle Savings: ₱
                  {(product.compareAtPrice - product.price)?.toLocaleString()}
                </span>
              </div>
            )}

            {product.isSeasonal && (
              <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded border border-purple-100 w-fit">
                <Snowflake size={14} />
                <span className="text-[10px] font-black uppercase">
                  Seasonal Item
                </span>
              </div>
            )}

            {/* Rating */}
            <Rating
              productId={product.id}
              averageRating={product.averageRating || 0}
              numRatings={product.numRatings || 0}
              onRate={(rating) => console.log("Rated:", rating)} // TODO: Implement API call
            />
          </div>

          {/* MATURE THESIS FEATURE: THE MANIFEST LIST */}
          {product.isBundle && product.bundleContents && (
            <div className="mt-10 p-6 border-4 border-zinc-900 bg-zinc-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2 mb-4">
                <ListChecks size={20} className="text-zinc-900" />
                <h3 className="font-black uppercase tracking-tighter text-sm italic">
                  The Kit Manifest (What's in the box)
                </h3>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {product.bundleContents.split(",").map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-xs font-bold text-zinc-600"
                  >
                    <div className="mt-1 w-2 h-2 bg-zinc-900 rounded-full shrink-0" />
                    {item.trim()}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Compatibility Info (Restored Layout) */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              Compatibility
            </h3>
            <p className="text-sm text-gray-700 font-semibold">
              {isUniversal
                ? "Fits all standard vehicle types"
                : `${product.vehicleCompatibility?.makes?.join(
                    ", ",
                  )} ${product.vehicleCompatibility?.models?.join(", ")}`}
            </p>
          </div>
          {/* Quantity and Actions (Slimmer) */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-lg bg-white h-12">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 hover:bg-gray-50"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center font-bold text-sm">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 hover:bg-gray-50"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={() => addToCart({ ...product, quantity })}
                className="flex-grow h-12 bg-gray-900 text-white rounded-lg font-bold hover:bg-black transition-all flex items-center justify-center gap-2 text-sm"
              >
                <ShoppingCart size={18} />
                Add to Cart
              </button>
            </div>
            <button className="w-full h-12 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all text-sm">
              Buy Now
            </button>
          </div>
          {/* Trust Factors (Slimmer) */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
            <div className="flex gap-3 items-center">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                <Truck size={18} />
              </div>
              <span className="text-xs font-bold text-gray-600">
                Fast Shipping
              </span>
            </div>
            <div className="flex gap-3 items-center">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                <ShieldCheck size={18} />
              </div>
              <span className="text-xs font-bold text-gray-600">
                100% Authentic
              </span>
            </div>
          </div>
          {/* Admin Edit Shortcut (RESTORED) */}
          <button
            onClick={() => navigate(`/products/update/${id}`)}
            className="mt-12 flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest border-t border-gray-50 pt-6"
          >
            <Settings size={14} />
            Manage Listing
          </button>
        </div>
      </div>

      {/* 4. Description Section (Restored full content) */}
      <div className="mt-16 pt-10 border-t border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Detailed Description
        </h2>
        <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
          {product.description}
        </div>
      </div>

      {/* 5. Recommended Sections (RESTORED) */}
      {related.length > 0 && (
        <section className="mt-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Similar Products
            </h2>
            <Link
              to="/"
              className="text-blue-600 text-xs font-bold flex items-center gap-1"
            >
              See All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {trending.length > 0 && (
        <section className="mt-20 pb-20">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trending.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
