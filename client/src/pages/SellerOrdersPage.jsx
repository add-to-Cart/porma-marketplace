import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getSellerOrders } from "@/api/orders";
import toast from "react-hot-toast";

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pending_verification");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getSellerOrders(user.uid);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const pendingVerification = orders.filter(
    (o) => o.paymentStatus === "pending_verification",
  );
  const activeOrders = orders.filter(
    (o) => o.paymentStatus === "verified" && o.status !== "completed",
  );
  const completedOrders = orders.filter((o) => o.status === "completed");

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

  const handleVerifyPayment = async (orderId, verified) => {
    if (!verified && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/orders/${orderId}/verify-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            verified,
            sellerId: user.uid,
            rejectionReason: verified ? null : rejectionReason,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(verified ? "Payment accepted!" : "Payment rejected!");
        setRejectModal(null);
        setRejectionReason("");
        await fetchOrders();
      } else {
        toast.error(data.message || "Failed to verify payment");
      }
    } catch (err) {
      console.error("Verify payment error:", err);
      toast.error("Failed to verify payment");
    }
  };

  const handleUpdateDelivery = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3000/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveryStatus: newStatus,
          status: newStatus === "delivered" ? "completed" : "pending",
        }),
      });

      if (response.ok) {
        toast.success(`Order marked as ${newStatus}!`);
        await fetchOrders();
      } else {
        toast.error("Failed to update delivery status");
      }
    } catch (err) {
      console.error("Update delivery error:", err);
      toast.error("Failed to update delivery status");
    }
  };

  const openRejectModal = (orderId) => {
    setRejectModal(orderId);
    setRejectionReason("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <p className="text-gray-500 animate-pulse">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-10 text-center">
        <p className="text-gray-600">Please log in to view your orders.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Desk</h1>
          <p className="text-gray-600 mt-2">
            Manage customer orders and verify payments
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg border shadow-sm">
          <button
            onClick={() => setActiveTab("pending_verification")}
            className={`flex-1 px-6 py-3 rounded-md font-bold transition-all ${
              activeTab === "pending_verification"
                ? "bg-amber-500 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            🔐 Pending Verification ({pendingVerification.length})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 px-6 py-3 rounded-md font-bold transition-all ${
              activeTab === "active"
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            📦 Active Orders ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex-1 px-6 py-3 rounded-md font-bold transition-all ${
              activeTab === "completed"
                ? "bg-green-500 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            ✓ Completed ({completedOrders.length})
          </button>
        </div>

        {/* Pending Verification Tab */}
        {activeTab === "pending_verification" && (
          <div className="space-y-4">
            {pendingVerification.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center border shadow-sm">
                <p className="text-gray-500">
                  No payments waiting for verification
                </p>
              </div>
            ) : (
              pendingVerification.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg border shadow-sm overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="bg-amber-50 border-b-2 border-amber-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                            ⏱️ NEEDS VERIFICATION
                          </span>
                          <h3 className="font-bold text-gray-900">
                            Order #{order.id.slice(-8).toUpperCase()}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          From: {order.deliveryDetails?.fullName || "Unknown"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-gray-900">
                          ₱{order.total?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.paymentMethod?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Proof Section */}
                  <div className="p-6 space-y-6">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                      <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                        💳 Payment Proof Submitted
                      </h4>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Screenshot */}
                        {order.paymentProofUrl && (
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-3">
                              Receipt Screenshot:
                            </p>
                            <div
                              onClick={() =>
                                setLightboxImage(order.paymentProofUrl)
                              }
                              className="relative cursor-pointer group"
                            >
                              <img
                                src={order.paymentProofUrl}
                                alt="Payment proof"
                                className="w-full max-w-xs rounded-lg border-2 border-blue-300 shadow-md group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 bg-white/90 px-3 py-1 rounded text-sm font-bold">
                                  🔍 Click to enlarge
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Details */}
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded-lg border border-blue-200">
                            <p className="text-xs font-semibold text-gray-600 mb-1">
                              Transaction Reference:
                            </p>
                            <p className="text-2xl font-black text-blue-600 font-mono tracking-wider">
                              {order.paymentReferenceNumber || "N/A"}
                            </p>
                          </div>

                          <div className="bg-white p-4 rounded-lg border border-blue-200">
                            <p className="text-xs font-semibold text-gray-600 mb-1">
                              Amount Paid:
                            </p>
                            <p className="text-3xl font-black text-green-600">
                              ₱{order.total?.toLocaleString()}
                            </p>
                          </div>

                          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                            <p className="text-xs font-bold text-amber-900 mb-2">
                              ⚠️ Verification Steps:
                            </p>
                            <ol className="text-xs text-amber-800 space-y-1 list-decimal list-inside">
                              <li>
                                Check your {order.paymentMethod?.toUpperCase()}{" "}
                                app/bank
                              </li>
                              <li>
                                Find transaction with ref:{" "}
                                <strong>{order.paymentReferenceNumber}</strong>
                              </li>
                              <li>
                                Verify amount matches:{" "}
                                <strong>
                                  ₱{order.total?.toLocaleString()}
                                </strong>
                              </li>
                              <li>Accept if correct, reject if not found</li>
                            </ol>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => handleVerifyPayment(order.id, true)}
                          className="flex-1 bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 transition-all shadow-lg"
                        >
                          ✓ Accept Payment - Funds Confirmed
                        </button>
                        <button
                          onClick={() => openRejectModal(order.id)}
                          className="flex-1 bg-red-600 text-white py-4 rounded-lg font-bold hover:bg-red-700 transition-all shadow-lg"
                        >
                          ✗ Reject Payment - Not Received
                        </button>
                      </div>
                    </div>

                    {/* Delivery Details */}
                    <div className="bg-gray-50 border rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-3">
                        📍 Delivery Information
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Name:</p>
                          <p className="font-semibold">
                            {order.deliveryDetails?.fullName}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Phone:</p>
                          <p className="font-semibold">
                            {order.deliveryDetails?.phone}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-600">Address:</p>
                          <p className="font-semibold">
                            {order.deliveryDetails?.address},{" "}
                            {order.deliveryDetails?.city},{" "}
                            {order.deliveryDetails?.province}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-3">
                        📦 Order Items
                      </h4>
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-center mb-3">
                          <img
                            src={item.imageUrl}
                            alt={item.productName || item.name}
                            className="w-16 h-16 rounded object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-semibold">
                              {item.productName || item.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity} × ₱
                              {item.price?.toLocaleString()}
                            </p>
                          </div>
                          <p className="font-bold">
                            ₱
                            {(
                              (item.price || 0) * (item.quantity || 0)
                            ).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Active Orders Tab */}
        {activeTab === "active" && (
          <div className="space-y-4">
            {activeOrders.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center border shadow-sm">
                <p className="text-gray-500">No active orders</p>
              </div>
            ) : (
              activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg border shadow-sm p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {order.deliveryDetails?.fullName || "Unknown"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        ₱{order.total?.toLocaleString()}
                      </p>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                        ✓ Verified
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateDelivery(order.id, "packed")}
                      className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                    >
                      Mark as Packed
                    </button>
                    <button
                      onClick={() => handleUpdateDelivery(order.id, "shipped")}
                      className="px-4 py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700"
                    >
                      Mark as Shipped
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateDelivery(order.id, "delivered")
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700"
                    >
                      Mark as Delivered
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Completed Tab */}
        {activeTab === "completed" && (
          <div className="space-y-4">
            {completedOrders.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center border shadow-sm">
                <p className="text-gray-500">No completed orders yet</p>
              </div>
            ) : (
              completedOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg border shadow-sm p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {order.deliveryDetails?.fullName || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Completed:{" "}
                        {order.completedAt
                          ? new Date(order.completedAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">
                        ₱{order.total?.toLocaleString()}
                      </p>
                      <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded">
                        ✓ Completed
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
          >
            <img
              src={lightboxImage}
              alt="Full size proof"
              className="max-w-full max-h-full rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 bg-white text-black rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl hover:bg-gray-200"
            >
              ✕
            </button>
          </div>
        )}

        {/* Reject Modal */}
        {rejectModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Reject Payment</h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejection:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full border-2 rounded-lg p-3 mb-4 resize-none"
                rows="4"
                placeholder="e.g., Payment not found in my account, Amount mismatch, Wrong reference number..."
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleVerifyPayment(rejectModal, false)}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => setRejectModal(null)}
                  className="flex-1 bg-gray-200 text-gray-900 py-3 rounded-lg font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
