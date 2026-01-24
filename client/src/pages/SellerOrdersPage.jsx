import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSellerOrders,
  updateOrderStatus,
  completeOrder,
  uploadPaymentProof,
} from "@/api/orders";
import {
  Package,
  Truck,
  CheckCircle2,
  ChevronDown,
  Clock,
  MapPin,
  Upload,
  CreditCard,
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
  { key: "processing", label: "Processing", icon: Clock },
  { key: "packed", label: "Packed", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [uploadingQR, setUploadingQR] = useState(null);
  const [qrFileInput, setQRFileInput] = useState({});

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getSellerOrders(user.uid);
      setOrders(data || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdating(orderId);
      await updateOrderStatus(orderId, {
        status: newStatus,
        buyerNotified: false,
      });
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      console.error("Failed to update order:", err);
      toast.error("Failed to update order");
    } finally {
      setUpdating(null);
    }
  };

  const handleDeliveryUpdate = async (orderId, newDeliveryStatus) => {
    try {
      setUpdating(orderId);
      await updateOrderStatus(orderId, { deliveryStatus: newDeliveryStatus });
      toast.success(`Delivery status updated`);
      fetchOrders();
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
      toast.success("Order completed! Ratings have been updated.");
      fetchOrders();
    } catch (err) {
      console.error("Failed to complete order:", err);
      toast.error("Failed to complete order");
    } finally {
      setUpdating(null);
    }
  };

  const handleQRUpload = async (orderId, file) => {
    if (!file) return;

    try {
      setUploadingQR(orderId);

      // Convert file to Base64 for simple implementation
      // In production, you might want to use Cloudinary or another service
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target.result;

        try {
          await uploadPaymentProof(orderId, base64String);
          toast.success("Payment proof uploaded successfully!");
          setQRFileInput({ ...qrFileInput, [orderId]: null });
          fetchOrders();
        } catch (err) {
          console.error("Failed to upload payment proof:", err);
          toast.error("Failed to upload payment proof");
        } finally {
          setUploadingQR(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error processing file:", err);
      toast.error("Error processing file");
      setUploadingQR(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-6">Orders to Process</h1>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Orders to Process</h1>
        <div className="bg-gray-50 rounded-lg p-12 border border-gray-200">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">
            No orders to process at the moment.
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    return ORDER_STATUSES.find((s) => s.key === status)?.color || "";
  };

  const getDeliveryProgress = (deliveryStatus) => {
    const index = DELIVERY_STATUSES.findIndex((s) => s.key === deliveryStatus);
    return ((index + 1) / DELIVERY_STATUSES.length) * 100;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Orders to Process</h1>
      <p className="text-gray-600 mb-6">
        Manage buyer orders and track deliveries
      </p>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div
              className="p-6 bg-gray-50 cursor-pointer"
              onClick={() =>
                setExpandedOrder(expandedOrder === order.id ? null : order.id)
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900">
                    Order #{order.id.slice(-8).toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    From: Buyer ID {order.buyerId?.slice(0, 8)}...
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      ₱{order.total?.toLocaleString()}
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded text-xs font-bold mt-1 ${getStatusColor(
                        order.status,
                      )}`}
                    >
                      {
                        ORDER_STATUSES.find((s) => s.key === order.status)
                          ?.label
                      }
                    </span>
                  </div>

                  <ChevronDown
                    size={20}
                    className={`transition-transform ${
                      expandedOrder === order.id ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedOrder === order.id && (
              <div className="p-6 border-t border-gray-200 space-y-6">
                {/* Status Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">
                      Order Status
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {ORDER_STATUSES.map((status) => (
                        <button
                          key={status.key}
                          onClick={() =>
                            handleStatusUpdate(order.id, status.key)
                          }
                          disabled={updating === order.id}
                          className={`px-3 py-2 rounded text-xs font-bold transition-all ${
                            order.status === status.key
                              ? status.color
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          } disabled:opacity-50`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">
                      Delivery Status
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {DELIVERY_STATUSES.map((status) => (
                        <button
                          key={status.key}
                          onClick={() =>
                            handleDeliveryUpdate(order.id, status.key)
                          }
                          disabled={updating === order.id}
                          className={`px-3 py-2 rounded text-xs font-bold transition-all ${
                            order.deliveryStatus === status.key
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          } disabled:opacity-50`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Delivery Address Section */}
                {order.deliveryDetails && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin size={18} />
                      Delivery Address
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Full Name</p>
                        <p className="font-semibold text-gray-900">
                          {order.deliveryDetails.fullName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Phone</p>
                        <p className="font-semibold text-gray-900">
                          {order.deliveryDetails.phone || "N/A"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600">Email</p>
                        <p className="font-semibold text-gray-900">
                          {order.deliveryDetails.email || "N/A"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600">Address</p>
                        <p className="font-semibold text-gray-900">
                          {order.deliveryDetails.address || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">City</p>
                        <p className="font-semibold text-gray-900">
                          {order.deliveryDetails.city || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Province</p>
                        <p className="font-semibold text-gray-900">
                          {order.deliveryDetails.province || "N/A"}
                        </p>
                      </div>
                      {order.deliveryDetails.zipCode && (
                        <div>
                          <p className="text-gray-600">Zip Code</p>
                          <p className="font-semibold text-gray-900">
                            {order.deliveryDetails.zipCode}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivery Progress */}
                {order.deliveryStatus && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-900">
                      Delivery Progress
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="flex-grow h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all"
                          style={{
                            width: `${getDeliveryProgress(order.deliveryStatus)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {DELIVERY_STATUSES.find(
                          (s) => s.key === order.deliveryStatus,
                        )?.label || "Unknown"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900">Items Ordered</h4>
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-grow">
                        <div className="font-semibold text-gray-900">
                          {item.productName}
                        </div>
                        <div className="text-sm text-gray-600">
                          Qty: {item.quantity} × ₱{item.price?.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right font-bold">
                        ₱{(item.price * item.quantity)?.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">
                      ₱{order.subtotal?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee:</span>
                    <span className="font-semibold">
                      ₱{order.deliveryFee?.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-lg text-blue-600">
                      ₱{order.total?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Payment Method Section */}
                {order.paymentMethod && order.paymentMethod !== "cod" && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard size={18} className="text-amber-700" />
                      <h4 className="font-bold text-amber-900">
                        Payment Proof Required
                      </h4>
                    </div>
                    <p className="text-sm text-amber-800 mb-3">
                      Payment Method:{" "}
                      <span className="font-semibold">
                        {order.paymentMethod === "bank"
                          ? "Bank Transfer"
                          : order.paymentMethod === "gcash"
                            ? "GCash"
                            : order.paymentMethod}
                      </span>
                    </p>

                    {order.paymentProofUrl ? (
                      <div className="space-y-2">
                        <div className="bg-white p-3 rounded border border-amber-200">
                          <p className="text-xs text-gray-600 mb-2">
                            Payment Proof (QR/Receipt):
                          </p>
                          <img
                            src={order.paymentProofUrl}
                            alt="Payment proof"
                            className="max-w-xs rounded border border-gray-200"
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Uploaded on{" "}
                            {order.paymentProofUploadedAt
                              ? new Date(
                                  typeof order.paymentProofUploadedAt ===
                                    "object" &&
                                    order.paymentProofUploadedAt.toDate
                                    ? order.paymentProofUploadedAt.toDate()
                                    : order.paymentProofUploadedAt,
                                ).toLocaleDateString()
                              : "Unknown"}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            document
                              .getElementById(`qr-upload-${order.id}`)
                              ?.click()
                          }
                          className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          Update Proof
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="file"
                          id={`qr-upload-${order.id}`}
                          accept="image/*"
                          onChange={(e) => {
                            setQRFileInput({
                              ...qrFileInput,
                              [order.id]: e.target.files?.[0],
                            });
                          }}
                          className="hidden"
                        />
                        {qrFileInput[order.id] ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-grow">
                              <p className="text-sm text-gray-900 font-semibold">
                                {qrFileInput[order.id].name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(qrFileInput[order.id].size / 1024).toFixed(2)}{" "}
                                KB
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                handleQRUpload(order.id, qrFileInput[order.id])
                              }
                              disabled={uploadingQR === order.id}
                              className="bg-amber-600 text-white px-4 py-2 rounded font-bold hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              <Upload size={16} />
                              {uploadingQR === order.id
                                ? "Uploading..."
                                : "Upload"}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              document
                                .getElementById(`qr-upload-${order.id}`)
                                ?.click()
                            }
                            className="w-full border-2 border-dashed border-amber-300 p-4 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <Upload size={18} />
                            Upload QR Code / Payment Receipt
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {order.paymentMethod === "cod" && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <p className="text-green-700 font-semibold">
                      Cash on Delivery (COD)
                    </p>
                    <p className="text-sm text-green-600">
                      No payment proof required for COD orders.
                    </p>
                  </div>
                )}

                {/* Complete Order Button */}
                {order.status !== "completed" && (
                  <button
                    onClick={() => handleCompleteOrder(order.id)}
                    disabled={updating === order.id}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {updating === order.id
                      ? "Processing..."
                      : "✓ Mark as Completed"}
                  </button>
                )}

                {order.status === "completed" && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                    <p className="text-green-700 font-semibold">
                      ✓ Order Completed
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Product ratings have been updated.
                    </p>
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
