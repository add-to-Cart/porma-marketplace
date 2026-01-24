import { useRef } from "react";

export default function Receipt({ order, onClose }) {
  const receiptRef = useRef();

  const handleDownload = () => {
    // Simple download as image (for thesis demo)
    // In production, you'd generate a proper PDF
    const element = receiptRef.current;
    // This is a basic implementation - in real app, use html2canvas or similar
    alert("Receipt download feature - would generate PDF in production");
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Order Receipt</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div ref={receiptRef} className="p-8 bg-white">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Porma Marketplace
            </h1>
            <p className="text-gray-600">Your trusted auto parts marketplace</p>
          </div>

          {/* Order Details */}
          <div className="border-b pb-6 mb-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">
                  Order Information
                </h3>
                <p className="text-sm text-gray-600">
                  Order ID:{" "}
                  <span className="font-mono">
                    {order.id?.slice(-8).toUpperCase()}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Date:{" "}
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString()
                    : new Date().toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  Payment Method: {order.paymentMethod?.toUpperCase()}
                </p>
                {order.paymentReferenceNumber && (
                  <p className="text-sm text-gray-600">
                    Reference:{" "}
                    <span className="font-mono">
                      {order.paymentReferenceNumber}
                    </span>
                  </p>
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">
                  Delivery Details
                </h3>
                <p className="text-sm text-gray-600">
                  {order.deliveryDetails?.fullName}
                </p>
                <p className="text-sm text-gray-600">
                  {order.deliveryDetails?.phone}
                </p>
                <p className="text-sm text-gray-600">
                  {order.deliveryDetails?.address}
                </p>
                <p className="text-sm text-gray-600">
                  {order.deliveryDetails?.city},{" "}
                  {order.deliveryDetails?.province}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-2 border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.productName || item.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {item.productName || item.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₱
                      {(
                        (item.price || 0) * (item.quantity || 0)
                      ).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      ₱{item.price?.toLocaleString()} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₱{order.subtotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Fee:</span>
                <span>₱{order.deliveryFee?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t pt-2">
                <span>Total:</span>
                <span>₱{order.total?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t">
            <p className="text-sm text-gray-600">
              Thank you for shopping with Porma Marketplace!
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Payment verified on{" "}
              {order.paymentVerifiedAt
                ? new Date(order.paymentVerifiedAt).toLocaleDateString()
                : new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Download Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
