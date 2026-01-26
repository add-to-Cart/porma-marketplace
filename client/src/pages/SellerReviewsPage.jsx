import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getProductsBySeller } from "@/api/products";
import { getProductReviews, replyToReview } from "@/api/products";
import { MessageSquare, Star, Send, User } from "lucide-react";
import toast from "react-hot-toast";

export default function SellerReviewsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (user) {
      fetchSellerProducts();
    }
  }, [user]);

  useEffect(() => {
    if (selectedProduct) {
      fetchProductReviews(selectedProduct.id);
    }
  }, [selectedProduct]);

  const fetchSellerProducts = async () => {
    try {
      setLoading(true);
      const sellerProducts = await getProductsBySeller(user.uid);
      setProducts(sellerProducts);
      if (sellerProducts.length > 0) {
        setSelectedProduct(sellerProducts[0]);
      }
    } catch (error) {
      console.error("Failed to fetch seller products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductReviews = async (productId) => {
    try {
      const productReviews = await getProductReviews(productId);
      setReviews(productReviews);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      toast.error("Failed to load reviews");
    }
  };

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    try {
      await replyToReview(reviewId, replyText);
      toast.success("Reply sent successfully");

      // Refresh reviews
      if (selectedProduct) {
        await fetchProductReviews(selectedProduct.id);
      }

      setReplyingTo(null);
      setReplyText("");
    } catch (error) {
      console.error("Failed to send reply:", error);
      toast.error("Failed to send reply");
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={`${
          i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <MessageSquare className="text-amber-500" size={24} />
        <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
      </div>

      {/* Product Selector */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Select Product</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className={`p-4 border rounded-lg text-left transition-colors ${
                selectedProduct?.id === product.id
                  ? "border-amber-500 bg-amber-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <img
                  src={product.imageUrl || "/placeholder-product.png"}
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {product.ratingsCount || 0} reviews
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {selectedProduct && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">
              Reviews for {selectedProduct.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {reviews.length} customer reviews
            </p>
          </div>

          <div className="divide-y">
            {reviews.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No reviews yet for this product.
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Buyer Avatar */}
                    <div className="flex-shrink-0">
                      {review.buyerAvatarUrl ? (
                        <img
                          src={review.buyerAvatarUrl}
                          alt={review.buyerName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User size={20} className="text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Review Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">
                          {review.buyerName}
                        </span>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-4">{review.reviewText}</p>

                      {/* Seller Reply */}
                      {review.sellerReply && (
                        <div className="bg-gray-50 rounded-lg p-4 mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-amber-600">
                              Your Reply
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(
                                review.sellerReply.repliedAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700">
                            {review.sellerReply.text}
                          </p>
                        </div>
                      )}

                      {/* Reply Button/Form */}
                      {!review.sellerReply && (
                        <div className="mt-4">
                          {replyingTo === review.id ? (
                            <div className="space-y-3">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write your reply..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleReply(review.id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                                >
                                  <Send size={16} />
                                  Send Reply
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText("");
                                  }}
                                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReplyingTo(review.id)}
                              className="flex items-center gap-2 px-4 py-2 text-amber-600 hover:text-amber-700 transition-colors"
                            >
                              <MessageSquare size={16} />
                              Reply to Review
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
