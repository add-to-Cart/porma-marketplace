import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSellerOrders,
  updateOrderStatus,
  completeOrder,
} from "@/api/orders";
import AccountSidebar from "@/components/AccountSidebar";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const ORDER_STATUSES = [
  { key: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  { key: "accepted", label: "Accepted", color: "bg-blue-100 text-blue-700" },
  { key: "shipped", label: "Shipped", color: "bg-purple-100 text-purple-700" },
  {
    key: "delivered",
    label: "Delivered",
    color: "bg-green-100 text-green-700",
  },
  {
    key: "completed",
    label: "Completed",
    color: "bg-emerald-100 text-emerald-700",
  },
];

const DELIVERY_STATUSES = [
  { key: "processing", label: "Processing" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

export default function SellerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      fetchOrders();
    }
  }, [user?.uid]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getSellerOrders(user.uid);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      toast.error("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdating(orderId);
      await updateOrderStatus(orderId, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      await fetchOrders();
    } catch (err) {
      console.error("Failed to update order:", err);
      toast.error("Failed to update order status");
    } finally {
      setUpdating(null);
    }
  };

  const handleDeliveryUpdate = async (orderId, newDeliveryStatus) => {
    try {
      setUpdating(orderId);
      await updateOrderStatus(orderId, { deliveryStatus: newDeliveryStatus });
      toast.success(`Delivery status updated`);
      await fetchOrders();
    } catch (err) {
      console.error("Failed to update delivery:", err);
      toast.error("Failed to update delivery status");
    } finally {
      setUpdating(null);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      setUpdating(orderId);
      await completeOrder(orderId);
      toast.success("Order completed! Product metrics updated.");
      await fetchOrders();
    } catch (err) {
      console.error("Failed to complete order:", err);
      toast.error("Failed to complete order");
    } finally {
      setUpdating(null);
    }
  };

  const getNextStatus = (currentStatus) => {
    const statuses = [
      "pending",
      "accepted",
      "shipped",
      "delivered",
      "completed",
    ];
    const currentIndex = statuses.indexOf(currentStatus);
    return currentIndex < statuses.length - 1
      ? statuses[currentIndex + 1]
      : null;
  };

  const getNextDeliveryStatus = (currentStatus) => {
    const statuses = [
      "processing",
      "packed",
      "shipped",
      "out_for_delivery",
      "delivered",
    ];
    const currentIndex = statuses.indexOf(currentStatus);
    return currentIndex < statuses.length - 1
      ? statuses[currentIndex + 1]
      : null;
  };

  const tabs = [
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "products", label: "Products", icon: Package },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AccountSidebar />
      <div className="flex-1 p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage your products and track orders
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-white p-1 rounded-lg shadow-sm border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "orders" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Your Orders
                </h2>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {orders.length} orders
                </span>
              </div>

              {loading ? (
                <div className="bg-white rounded-lg p-12 text-center">
                  <p className="text-gray-500 animate-pulse">
                    Loading orders...
                  </p>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-lg p-12 text-center">
                  <AlertCircle
                    size={48}
                    className="mx-auto text-gray-400 mb-4"
                  />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No orders yet
                  </h3>
                  <p className="text-gray-500">
                    Orders from your products will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-lg border border-gray-200 shadow-sm"
                    >
                      {/* Order Header */}
                      <button
                        onClick={() =>
                          setExpandedOrder(
                            expandedOrder === order.id ? null : order.id,
                          )
                        }
                        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-left flex-1">
                          <h3 className="font-bold text-gray-900">
                            Order #{order.id.slice(-8).toUpperCase()}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(
                              order.createdAt?.toDate?.() || order.createdAt,
                            ).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              ₱{order.total?.toLocaleString()}
                            </p>
                            <span
                              className={`inline-block px-3 py-1 rounded text-xs font-bold mt-1 ${
                                ORDER_STATUSES.find(
                                  (s) => s.key === order.status,
                                )?.color
                              }`}
                            >
                              {order.status?.charAt(0).toUpperCase() +
                                order.status?.slice(1)}
                            </span>
                          </div>

                          <div className="text-gray-400">
                            {expandedOrder === order.id ? (
                              <ChevronUp size={24} />
                            ) : (
                              <ChevronDown size={24} />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {expandedOrder === order.id && (
                        <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-6">
                          {/* Items */}
                          <div>
                            <h4 className="font-bold text-gray-900 mb-3">
                              Items Ordered
                            </h4>
                            <div className="space-y-2">
                              {order.items?.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex gap-3 p-3 bg-white rounded border border-gray-200"
                                >
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900">
                                      {item.name}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Qty: {item.quantity}
                                    </p>
                                  </div>
                                  <p className="font-semibold">
                                    ₱
                                    {(
                                      item.price * item.quantity
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Status Controls */}
                          <div className="space-y-4 bg-white p-4 rounded border border-gray-200">
                            {/* Order Status */}
                            <div>
                              <label className="block text-sm font-bold text-gray-900 mb-2">
                                Order Status
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {ORDER_STATUSES.map((status) => (
                                  <button
                                    key={status.key}
                                    onClick={() =>
                                      handleStatusUpdate(order.id, status.key)
                                    }
                                    disabled={updating === order.id}
                                    className={`px-4 py-2 rounded text-sm font-bold transition-all ${
                                      order.status === status.key
                                        ? `${status.color} border-2 border-current`
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                                    }`}
                                  >
                                    {status.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Delivery Status */}
                            <div>
                              <label className="block text-sm font-bold text-gray-900 mb-2">
                                Delivery Status
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {DELIVERY_STATUSES.map((status) => (
                                  <button
                                    key={status.key}
                                    onClick={() =>
                                      handleDeliveryUpdate(order.id, status.key)
                                    }
                                    disabled={updating === order.id}
                                    className={`px-4 py-2 rounded text-sm font-bold transition-all ${
                                      order.deliveryStatus === status.key
                                        ? "bg-blue-600 text-white border-2 border-blue-700"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                                    }`}
                                  >
                                    {status.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Complete Order Button */}
                          {order.status !== "completed" && (
                            <button
                              onClick={() => handleCompleteOrder(order.id)}
                              disabled={updating === order.id}
                              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {updating === order.id
                                ? "Processing..."
                                : "✓ Complete Order & Update Metrics"}
                            </button>
                          )}

                          {order.status === "completed" && (
                            <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                              <CheckCircle2
                                size={24}
                                className="mx-auto text-green-600 mb-2"
                              />
                              <p className="text-green-700 font-semibold">
                                Order Completed
                              </p>
                              <p className="text-sm text-green-600">
                                Product metrics have been updated
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "products" && (
            <div className="bg-white rounded-lg p-8 text-center">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Products Coming Soon
              </h3>
              <p className="text-gray-500">
                Product management interface will be available here
              </p>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="bg-white rounded-lg p-8 text-center">
              <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Analytics Coming Soon
              </h3>
              <p className="text-gray-500">
                Detailed analytics and insights will be available here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
