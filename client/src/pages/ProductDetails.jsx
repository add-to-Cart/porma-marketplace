import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

import {
  getProductById,
  getRelatedProducts,
  getTrendingProducts,
  incrementViewCount,
} from "@/api/products";
import { createOrder } from "@/api/orders";
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
import toast from "react-hot-toast";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [related, setRelated] = useState([]);
  const [trending, setTrending] = useState([]);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        setProduct(data);
        // Increment view count when product is viewed
        await incrementViewCount(id);
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
        sellerId: product.sellerId,
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
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                {product.name}
              </h1>
              <div className="text-sm text-gray-600 mt-1">
                Sold by:{" "}
                {product.storeName ? (
                  <Link
                    to={product.owner ? `/seller/${product.owner}` : "#"}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    {product.storeName}
                  </Link>
                ) : (
                  <span className="font-medium">Unknown Seller</span>
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-4 flex-wrap">
              {product.isBundle && product.compareAtPrice && (
                <span className="text-2xl text-zinc-400 line-through font-bold decoration-red-500/50">
                  ₱{product.compareAtPrice.toLocaleString()}
                </span>
              )}
              <span className="text-5xl font-black tracking-tighter">
                ₱
                {product.price?.toLocaleString() ||
                  product.basePrice?.toLocaleString()}
              </span>
            </div>

            {/* Metadata Display */}
            <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100 my-4">
              <div className="text-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase">
                  Sold
                </div>
                <div className="text-xl font-black text-gray-900">
                  {product.soldCount || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase">
                  Views
                </div>
                <div className="text-xl font-black text-gray-900">
                  👁 {product.viewCount || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase">
                  Rating
                </div>
                <div className="text-xl font-black text-amber-600">
                  {product.ratingAverage || product.averageRating || 0}/5
                </div>
              </div>
            </div>

            {/* Rating Details */}
            {product.ratingsCount && (
              <div className="text-sm text-gray-600 mb-4">
                Based on{" "}
                <span className="font-bold">
                  {product.ratingsCount || 0} reviews
                </span>
              </div>
            )}

            {product.isBundle && product.compareAtPrice && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded border border-emerald-100 w-fit">
                <Percent size={14} />
                <span className="text-[10px] font-black uppercase">
                  Bundle Savings: ₱
                  {(
                    product.compareAtPrice -
                    (product.price || product.basePrice)
                  )?.toLocaleString()}
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
              averageRating={
                product.ratingAverage || product.averageRating || 0
              }
              numRatings={product.ratingsCount || product.numRatings || 0}
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
            {isUniversal ? (
              <p className="text-sm text-gray-700 font-semibold">
                Fits all standard vehicle types
              </p>
            ) : (
              <div className="text-sm text-gray-700 font-semibold space-y-1">
                {product.vehicleCompatibility?.type && (
                  <div>
                    <strong className="font-bold">Type:</strong>{" "}
                    {product.vehicleCompatibility.type}
                  </div>
                )}
                {product.vehicleCompatibility?.makes && (
                  <div>
                    <strong className="font-bold">Makes:</strong>{" "}
                    {product.vehicleCompatibility.makes.join(", ")}
                  </div>
                )}
                {product.vehicleCompatibility?.models && (
                  <div>
                    <strong className="font-bold">Models:</strong>{" "}
                    {product.vehicleCompatibility.models.join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Quantity and Actions (Slimmer) */}
          <div className="space-y-3 mb-8">
            {user?.uid === product.sellerId ? (
              <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-lg text-center">
                <p className="text-sm font-bold text-yellow-700">
                  ⚠️ This is your product. You cannot purchase your own items.
                </p>
              </div>
            ) : (
              <>
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
                <button
                  onClick={async () => {
                    if (!user) {
                      toast.error("Please log in to place an order");
                      return;
                    }

                    try {
                      const orderData = {
                        buyerId: user.uid,
                        items: [{ ...product, quantity }],
                        subtotal:
                          (product.price || product.basePrice) * quantity,
                        deliveryFee: 150,
                        total:
                          (product.price || product.basePrice) * quantity + 150,
                      };

                      const order = await createOrder(orderData);
                      toast.success(
                        `Order placed successfully! Order #${order.id.slice(-8)}`,
                      );
                      navigate("/orders");
                    } catch (err) {
                      console.error("Failed to place order:", err);
                      toast.error("Failed to place order. Please try again.");
                    }
                  }}
                  className="w-full h-12 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all text-sm mt-2"
                >
                  Buy Now
                </button>
              </>
            )}
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
          </div>
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

      {/* 5. Reviews Section (Display-Only) */}
      <div className="mt-12 pt-8 border-t border-gray-100">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Product Rating & Reviews Summary
          </h3>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-4xl font-black text-amber-600">
                {product.ratingAverage || product.averageRating || 0}
              </div>
              <div className="text-sm text-gray-600">Average Rating</div>
              <div className="text-xs text-gray-500">out of 5 stars</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-gray-900">
                {product.ratingsCount || product.numRatings || 0}
              </div>
              <div className="text-sm text-gray-600">Total Reviews</div>
              <div className="text-xs text-gray-500">customer ratings</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-green-600">
                {product.soldCount || 0}
              </div>
              <div className="text-sm text-gray-600">Units Sold</div>
              <div className="text-xs text-gray-500">verified purchases</div>
            </div>
          </div>

          {/* Rating Distribution Bar (if ratings exist) */}
          {product.ratings && product.ratings.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-3">
                Rating Distribution
              </h4>
              {[5, 4, 3, 2, 1].map((star) => {
                const count =
                  product.ratings?.filter((r) => r === star).length || 0;
                const percentage = product.ratingsCount
                  ? (count / product.ratingsCount) * 100
                  : 0;
                return (
                  <div key={star} className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold text-gray-700 w-8">
                      {star}★
                    </span>
                    <div className="flex-grow h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded text-sm text-blue-900">
            <p className="font-semibold">✓ Verified Reviews</p>
            <p className="text-xs mt-1">
              These are reviews from verified buyers who purchased this product.
            </p>
          </div>
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
              <ProductCard
                key={item.id}
                product={item}
                onClick={() => navigate(`/products/${item.id}`)}
              />
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
