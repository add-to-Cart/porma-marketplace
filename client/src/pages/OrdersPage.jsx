import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getBuyerOrders } from "@/api/orders";
import {
  ChevronDown,
  ChevronUp,
  Truck,
  Clock,
  CheckCircle2,
  Star,
  AlertCircle,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [ratingOrder, setRatingOrder] = useState(null);
  const [ratingValues, setRatingValues] = useState({});

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getBuyerOrders(user.uid);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-blue-100 text-blue-800",
      shipped: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      completed: "bg-emerald-100 text-emerald-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getDeliveryStatusSteps = (deliveryStatus) => {
    const steps = [
      { key: "processing", label: "Processing" },
      { key: "packed", label: "Packed" },
      { key: "shipped", label: "Shipped" },
      { key: "out_for_delivery", label: "Out for Delivery" },
      { key: "delivered", label: "Delivered" },
    ];

    const currentIndex = steps.findIndex((s) => s.key === deliveryStatus);
    return steps.map((step, idx) => ({
      ...step,
      completed: idx <= currentIndex,
      active: idx === currentIndex,
    }));
  };

  if (!user) {
    return (
      <div className="p-10 text-center">
        <p className="text-gray-600">Please log in to view your orders.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-10 text-center">
        <p className="text-gray-500 animate-pulse">Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-semibold text-gray-900 mb-2">
            No orders yet
          </p>
          <p className="text-gray-600 mb-6">
            Start shopping to place your first order!
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Order Header */}
            <button
              onClick={() =>
                setExpandedOrder(expandedOrder === order.id ? null : order.id)
              }
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 text-left">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-bold text-gray-900">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(
                        order.createdAt?.toDate?.() || order.createdAt,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(
                        order.status,
                      )}`}
                    >
                      {order.status?.charAt(0).toUpperCase() +
                        order.status?.slice(1)}
                    </span>
                  </div>
                  <div className="ml-auto">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-black text-gray-900">
                      ₱{order.total?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-gray-400">
                {expandedOrder === order.id ? (
                  <ChevronUp size={24} />
                ) : (
                  <ChevronDown size={24} />
                )}
              </div>
            </button>

            {/* Expanded Details */}
            {expandedOrder === order.id && (
              <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-6">
                {/* Delivery Progress */}
                {order.deliveryStatus && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Truck size={18} />
                      Delivery Progress
                    </h3>
                    <div className="flex items-center justify-between">
                      {getDeliveryStatusSteps(order.deliveryStatus).map(
                        (step, idx, arr) => (
                          <div
                            key={step.key}
                            className="flex-1 flex flex-col items-center"
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-colors ${
                                step.completed
                                  ? "bg-green-500 text-white"
                                  : step.active
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-300 text-gray-600"
                              }`}
                            >
                              {step.completed ? (
                                <CheckCircle2 size={20} />
                              ) : (
                                <Clock size={20} />
                              )}
                            </div>
                            <p className="text-xs font-semibold text-gray-900 text-center">
                              {step.label}
                            </p>
                            {idx < arr.length - 1 && (
                              <div
                                className={`h-1 w-full my-2 transition-colors ${
                                  step.completed
                                    ? "bg-green-500"
                                    : "bg-gray-300"
                                }`}
                              />
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-4">Items</h3>
                  <div className="space-y-3">
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex gap-4 bg-white p-4 rounded-lg border border-gray-200"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity}
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            ₱{(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                        {order.status === "completed" && (
                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={() => {
                                setRatingOrder(order.id);
                                setRatingValues({
                                  ...ratingValues,
                                  [item.id]: ratingValues[item.id] || 0,
                                });
                              }}
                              className="text-blue-600 font-bold text-sm hover:text-blue-700 flex items-center gap-1"
                            >
                              <Star size={16} />
                              Rate
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">
                      ₱{order.subtotal?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-semibold">
                      ₱{order.deliveryFee?.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-lg text-blue-600">
                      ₱{order.total?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Rating Section */}
                {ratingOrder === order.id && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="font-bold text-gray-900 mb-4">
                      Rate Products
                    </p>
                    <div className="space-y-4">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-gray-900 flex-1">
                            {item.name}
                          </span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() =>
                                  setRatingValues({
                                    ...ratingValues,
                                    [item.id]: star,
                                  })
                                }
                                className={`text-2xl transition-colors ${
                                  (ratingValues[item.id] || 0) >= star
                                    ? "text-amber-400"
                                    : "text-gray-300"
                                }`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => {
                          toast.success("Ratings saved!");
                          setRatingOrder(null);
                        }}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                      >
                        Submit Ratings
                      </button>
                      <button
                        onClick={() => setRatingOrder(null)}
                        className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
