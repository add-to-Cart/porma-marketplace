import { useState, useEffect } from "react";
import { getOrdersBySeller } from "@/utils/orders";
import { useAuth } from "@/contexts/AuthContext";
import DeliveryTracker from "@/components/DeliveryTracker";
import SellerProducts from "@/components/SellerProducts";
import { Package, ShoppingCart, TrendingUp } from "lucide-react";

export default function SellerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);

  // Update orders periodically and on window focus
  useEffect(() => {
    const updateOrders = () => {
      if (user?.uid) {
        setOrders(getOrdersBySeller(user.uid));
      }
    };

    updateOrders(); // Initial load

    // Update every 30 seconds
    const interval = setInterval(updateOrders, 30000);

    // Update when window regains focus
    const handleFocus = () => updateOrders();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user?.uid]);

  const tabs = [
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "products", label: "Products", icon: Package },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
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

              {orders.length === 0 ? (
                <div className="bg-white rounded-lg p-12 text-center">
                  <ShoppingCart
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
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                    >
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Order #{order.id.split("_").pop()}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Placed:{" "}
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              ₱{order.total.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              Status: {order.status}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                            >
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  {item.name}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  Qty: {item.quantity}
                                </p>
                              </div>
                              <p className="font-semibold text-gray-900">
                                ₱{(item.price * item.quantity).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-6">
                        <DeliveryTracker order={order} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "products" && (
            <div>
              <SellerProducts />
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
