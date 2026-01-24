import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { createOrder, uploadPaymentProof } from "@/api/orders";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

export default function Checkout() {
  const { user } = useAuth();
  const { cart, subtotal, deliveryFee, total, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentStep, setCurrentStep] = useState(1);
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [checkoutSubtotal, setCheckoutSubtotal] = useState(0);
  const [checkoutDeliveryFee, setCheckoutDeliveryFee] = useState(0);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    zipCode: "",
    paymentMethod: "gcash",
  });
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle quick checkout from Buy Now button
  useEffect(() => {
    if (location.state?.quickCheckout) {
      const { product, quantity } = location.state.quickCheckout;
      const itemSubtotal = (product.price || product.basePrice) * quantity;
      const itemDeliveryFee = itemSubtotal > 1000 ? 0 : 150;
      const itemTotal = itemSubtotal + itemDeliveryFee;

      setCheckoutItems([{ ...product, quantity }]);
      setCheckoutSubtotal(itemSubtotal);
      setCheckoutDeliveryFee(itemDeliveryFee);
      setCheckoutTotal(itemTotal);
    } else {
      // Use cart items
      setCheckoutItems(cart);
      setCheckoutSubtotal(subtotal);
      setCheckoutDeliveryFee(deliveryFee);
      setCheckoutTotal(total);
    }
  }, [location.state, cart, subtotal, deliveryFee, total]);

  // Load user data into form
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.displayName || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProofUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitOrder = async () => {
    if (!user) {
      toast.error("Please login to place an order");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        buyerId: user.uid,
        items: checkoutItems.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.basePrice,
          imageUrl: item.imageUrl,
          sellerId: item.sellerId,
          storeName: item.storeName,
        })),
        subtotal: checkoutSubtotal,
        deliveryFee: checkoutDeliveryFee,
        total: checkoutTotal,
        paymentMethod: formData.paymentMethod,
        deliveryDetails: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          zipCode: formData.zipCode,
        },
      };

      const response = await createOrder(orderData);
      setCreatedOrder(response);
      setCurrentStep(formData.paymentMethod === "cod" ? 3 : 2);
      toast.success("Order created successfully!");
    } catch (error) {
      console.error("Order creation failed:", error);
      toast.error("Failed to create order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadProof = async () => {
    if (!paymentProofFile || !referenceNumber.trim()) {
      toast.error("Please upload payment proof and enter reference number");
      return;
    }

    setIsSubmitting(true);
    try {
      // For now, we'll use a placeholder URL since cloudinary upload isn't implemented
      // In a real implementation, you'd upload the file to cloudinary first
      const paymentProofUrl = paymentProofPreview; // This is base64, not ideal for production

      await uploadPaymentProof(
        createdOrder.id,
        paymentProofUrl,
        referenceNumber.trim(),
      );
      setCurrentStep(3);
      toast.success("Payment proof submitted! Awaiting seller verification.");
    } catch (error) {
      console.error("Payment proof upload failed:", error);
      toast.error("Failed to upload payment proof. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Order Form
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Info */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-bold mb-4">
                  📍 Delivery Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border rounded-lg"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-3 border rounded-lg resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Province *
                      </label>
                      <input
                        type="text"
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Zip Code
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-bold mb-4">💳 Payment Method</h2>

                <div className="space-y-3">
                  <label
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer ${
                      formData.paymentMethod === "cod"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === "cod"}
                      onChange={handleInputChange}
                      className="w-4 h-4"
                    />
                    <div className="ml-4">
                      <p className="font-semibold">Cash on Delivery</p>
                      <p className="text-sm text-gray-600">
                        Pay when you receive
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer ${
                      formData.paymentMethod === "bank"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={formData.paymentMethod === "bank"}
                      onChange={handleInputChange}
                      className="w-4 h-4"
                    />
                    <div className="ml-4">
                      <p className="font-semibold">Bank Transfer</p>
                      <p className="text-sm text-gray-600">
                        Scan QR & upload proof
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer ${
                      formData.paymentMethod === "gcash"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="gcash"
                      checked={formData.paymentMethod === "gcash"}
                      onChange={handleInputChange}
                      className="w-4 h-4"
                    />
                    <div className="ml-4">
                      <p className="font-semibold">GCash</p>
                      <p className="text-sm text-gray-600">
                        Scan QR & upload proof
                      </p>
                    </div>
                  </label>
                </div>

                {formData.paymentMethod !== "cod" && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> You'll scan the seller's QR code
                      and upload payment proof in the next step.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting
                  ? "Processing..."
                  : formData.paymentMethod === "cod"
                    ? "Place Order"
                    : "Continue to Payment"}
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-sm border sticky top-6">
                <h2 className="text-lg font-bold mb-4">Order Summary</h2>

                <div className="space-y-3 mb-4">
                  {checkoutItems.map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          x{item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span className="font-semibold">
                      ₱{checkoutSubtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery</span>
                    <span className="font-semibold">
                      ₱{checkoutDeliveryFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="text-xl font-black text-blue-600">
                      ₱{checkoutTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: QR Payment & Proof Upload
  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">Order Created!</h1>
              <p className="text-gray-600 mt-2">
                Order #{createdOrder?.id.slice(-8)}
              </p>
            </div>

            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-900 font-semibold mb-2">
                📱 Payment Instructions:
              </p>
              <ol className="list-decimal list-inside text-sm text-amber-800 space-y-1">
                <li>Scan the QR code below using your banking app</li>
                <li>Complete the payment of ₱{total.toLocaleString()}</li>
                <li>Take a screenshot of the confirmation</li>
                <li>Upload screenshot and enter reference number</li>
              </ol>
              <p className="mt-3 text-xs font-semibold text-amber-900">
                ⚠️ Orders will only be processed once the seller confirms the
                funds have landed in their account. Please allow 5-10 minutes
                for verification.
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-gray-50 border-2 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-center mb-4">
                {formData.paymentMethod === "gcash" ? "GCash" : "Bank"} QR Code
              </h3>
              <div className="flex justify-center mb-4">
                <div className="w-64 h-64 bg-white border-4 rounded-lg shadow-lg flex items-center justify-center">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=GCash:09123456789"
                    alt="Payment QR"
                    className="w-full h-full"
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Amount to pay:</p>
                <p className="text-2xl font-black">₱{total.toLocaleString()}</p>
              </div>
            </div>

            {/* Upload Section */}
            <div className="space-y-4">
              <h3 className="font-bold">Upload Payment Proof</h3>

              {!paymentProofPreview ? (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center pt-5 pb-6">
                    <svg
                      className="w-12 h-12 mb-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <p className="text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span>{" "}
                      receipt screenshot
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG (MAX. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProofUpload}
                  />
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={paymentProofPreview}
                    alt="Payment proof"
                    className="w-full max-w-sm mx-auto rounded-lg border-2"
                  />
                  <button
                    onClick={() => setPaymentProofPreview(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Transaction Reference Number *
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="e.g., 1234567890"
                />
              </div>

              <button
                onClick={handleUploadProof}
                disabled={
                  isSubmitting || !paymentProofPreview || !referenceNumber
                }
                className="w-full bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? "Uploading..." : "📤 Submit Payment Proof"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Success
  useEffect(() => {
    if (currentStep === 3 && formData.paymentMethod === "cod") {
      clearCart();
      setTimeout(() => {
        navigate("/orders");
      }, 3000);
    } else if (currentStep === 3) {
      // For online payments, don't clear cart yet, wait for verification
      setTimeout(() => {
        navigate("/orders");
      }, 3000);
    }
  }, [currentStep, formData.paymentMethod, clearCart, navigate]);

  if (currentStep === 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {formData.paymentMethod === "cod"
              ? "Order Placed!"
              : "Payment Proof Submitted!"}
          </h1>
          <p className="text-gray-600 mb-4">
            {formData.paymentMethod === "cod"
              ? "Your order has been placed successfully."
              : "Your order is pending seller verification."}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-900 font-semibold">
              Order #{createdOrder?.id?.slice(-8)}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {formData.paymentMethod === "cod"
                ? "Your order will be prepared soon."
                : "You'll be notified once seller confirms payment."}
            </p>
          </div>
          <p className="text-sm text-gray-500 animate-pulse">
            Redirecting to your orders...
          </p>
        </div>
      </div>
    );
  }
}
