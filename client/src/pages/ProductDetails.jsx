import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

import {
  getProductById,
  getRelatedProducts,
  getTrendingProducts,
  incrementViewCount,
  getProductReviews,
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
  const [reviews, setReviews] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();

  // SOLUTION 1: Use ref to track if view has been counted
  const viewCounted = useRef(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        setProduct(data);

        // CRITICAL FIX: Only increment view count ONCE
        // Check if view hasn't been counted yet
        if (!viewCounted.current) {
          await incrementViewCount(id);
          viewCounted.current = true; // Mark as counted
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    // Reset the ref when product ID changes
    viewCounted.current = false;
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product && id) {
      getRelatedProducts(id, {
        category: product.category,
        make: product.vehicleCompatibility?.makes?.[0],
        sellerId: product.sellerId,
      }).then(setRelated);

      getTrendingProducts().then(setTrending);

      // Fetch reviews for this product
      fetchProductReviews();
    }
  }, [product, id]);

  const fetchProductReviews = async () => {
    if (!id) return;
    try {
      setReviewsLoading(true);
      const data = await getProductReviews(id);
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-20 text-center animate-pulse text-gray-400 font-medium italic uppercase tracking-widest">
        Loading Part Details...
      </div>
    );
  if (!product)
    return (
      <div className="p-20 text-center font-bold text-zinc-400 uppercase">
        Product not found.
      </div>
    );

  const isUniversal = product.vehicleCompatibility?.isUniversalFit;
  // Fallback check for compatibility data
  const hasCompatibilityData =
    product.vehicleCompatibility?.type ||
    (product.vehicleCompatibility?.makes &&
      product.vehicleCompatibility.makes.length > 0) ||
    (product.vehicleCompatibility?.models &&
      product.vehicleCompatibility.models.length > 0);
  // Logic for expandable reviews
  const reviewsToShow = showAllReviews ? reviews : reviews.slice(0, 3);

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
        {/* 2. Media Section */}
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

        {/* 3. Buying Section */}
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
                  product.price?.toLocaleString()}
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
                  👁️ {product.viewCount || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase">
                  Rating
                </div>
                <div className="text-xl font-black text-amber-600">
                  {product.ratingsCount > 0
                    ? `${product.ratingAverage || 0}/5`
                    : "N/A"}
                </div>
              </div>
            </div>

            {/* FIX: Rating Details Fallback */}
            <div className="text-sm text-gray-600 mb-4">
              {product.ratingsCount && product.ratingsCount > 0 ? (
                <>
                  Based on{" "}
                  <span className="font-bold">
                    {product.ratingsCount} reviews
                  </span>
                </>
              ) : (
                <span className="italic text-gray-400">
                  No reviews yet for this product
                </span>
              )}
            </div>

            {product.isBundle && product.compareAtPrice && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded border border-emerald-100 w-fit">
                <Percent size={14} />
                <span className="text-[10px] font-black uppercase">
                  Bundle Savings: ₱
                  {(
                    product.compareAtPrice - (product.price || product.price)
                  )?.toLocaleString()}
                </span>
              </div>
            )}

            {product.isBundle && (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-2 py-1">
                <ListChecks size={10} /> Bundle Pack
              </span>
            )}

            {product.isSeasonal && (
              <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded border border-purple-100 w-fit">
                <Snowflake size={14} />
                <span className="text-[10px] font-black uppercase">
                  Seasonal Item
                </span>
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1">
                  <Snowflake size={10} />{" "}
                  {product.seasonalCategory || "Seasonal"}
                </span>
              </div>
            )}

            {/* Rating */}
            <Rating
              productId={product.id}
              averageRating={product.ratingAverage || 0}
              numRatings={product.ratingsCount || 0}
              readOnly={true} // Add this if your Rating component supports it
            />
          </div>

          {/* Bundle Contents */}
          {product.isBundle &&
            product.bundleContents &&
            ((Array.isArray(product.bundleContents) &&
              product.bundleContents.length > 0) ||
              (!Array.isArray(product.bundleContents) &&
                product.bundleContents?.trim().length > 0)) && (
              <div className="mt-10 p-6 border-4 border-zinc-900 bg-zinc-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-4">
                  <ListChecks size={20} className="text-zinc-900" />
                  <h3 className="font-black uppercase tracking-tighter text-sm italic">
                    The Kit Manifest (What's in the box)
                  </h3>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(Array.isArray(product.bundleContents)
                    ? product.bundleContents
                    : product.bundleContents?.split(",") || []
                  ).map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-xs font-bold text-zinc-600"
                    >
                      <div className="mt-1 w-2 h-2 bg-zinc-900 rounded-full shrink-0" />
                      {typeof item === "string" ? item.trim() : item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Compatibility Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 mt-6">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Compatibility Profile
            </h3>
            {isUniversal ? (
              <p className="text-sm text-gray-700 font-bold uppercase flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-600" />
                Universal Fit
              </p>
            ) : hasCompatibilityData ? (
              <div className="text-sm text-gray-700 font-semibold space-y-2">
                {product.vehicleCompatibility?.type && (
                  <div>
                    <strong className="text-[10px] uppercase text-gray-400 mr-2">
                      Type:
                    </strong>{" "}
                    {product.vehicleCompatibility.type}
                  </div>
                )}
                {product.vehicleCompatibility?.makes && (
                  <div>
                    <strong className="text-[10px] uppercase text-gray-400 mr-2">
                      Makes:
                    </strong>{" "}
                    {Array.isArray(product.vehicleCompatibility.makes)
                      ? product.vehicleCompatibility.makes.join(", ")
                      : product.vehicleCompatibility.makes}
                  </div>
                )}
                {product.vehicleCompatibility?.models && (
                  <div>
                    <strong className="text-[10px] uppercase text-gray-400 mr-2">
                      Models:
                    </strong>{" "}
                    {Array.isArray(product.vehicleCompatibility.models)
                      ? product.vehicleCompatibility.models.join(", ")
                      : product.vehicleCompatibility.models}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                General compatibility (Check description for details)
              </p>
            )}
          </div>

          {/* Quantity and Actions */}
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
                  onClick={() => {
                    if (!user) {
                      toast.error("Please log in to proceed to checkout.");
                      navigate("/login");
                      return;
                    }

                    navigate("/checkout", {
                      state: {
                        quickCheckout: {
                          product: { ...product, quantity },
                          quantity,
                        },
                      },
                    });
                  }}
                  className="w-full h-12 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all text-sm mt-2"
                >
                  Buy Now
                </button>
              </>
            )}
            {/* Trust Factors */}
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

      {/* Description Section */}
      <div className="mt-16 pt-10 border-t border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Detailed Description
        </h2>
        <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
          {product.description}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 pt-8 border-t border-gray-100">
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-tighter italic">
            Customer Reviews
          </h3>

          {product.ratingsCount > 0 ? (
            <div className="space-y-6">
              {/* Individual Written Reviews */}
              <div className="grid grid-cols-1 gap-4">
                {reviews.length > 0 ? (
                  <>
                    {reviewsToShow.map((review) => (
                      <div
                        key={review.id}
                        className="bg-white p-5 border-l-4 border-zinc-900 shadow-sm transition-all"
                      >
                        <div className="flex text-amber-400 text-xs mb-2 pointer-events-none">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={
                                i < review.rating ? "opacity-100" : "opacity-20"
                              }
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-700 font-medium leading-relaxed">
                          "{review.comment}"
                        </p>
                        <div className="mt-3 text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2
                            size={10}
                            className="text-emerald-500"
                          />{" "}
                          Verified Purchase
                        </div>
                      </div>
                    ))}

                    {/* Expand/Collapse Button */}
                    {reviews.length > 3 && (
                      <button
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="mt-4 flex items-center justify-center gap-2 w-full py-3 border-2 border-zinc-200 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all"
                      >
                        {showAllReviews ? (
                          <>
                            Show Fewer Reviews <ChevronUp size={16} />
                          </>
                        ) : (
                          <>
                            Show All {reviews.length} Reviews{" "}
                            <ChevronDown size={16} />
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-400 italic text-sm">
                      No written reviews provided yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                Be the first to rate this product
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
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

      {/* Trending Products */}
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
