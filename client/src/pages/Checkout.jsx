import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { createOrder } from "@/api/orders";
import {
  ChevronDown,
  MapPin,
  Phone,
  User,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, subtotal, deliveryFee, total, clearCart } = useCart();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    zipCode: "",
    paymentMethod: "cod",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedItems, setExpandedItems] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user?.displayName || user?.username || "",
        email: user?.email || "",
        phone: user?.contact || "",
        address: user?.addressLine || "",
        city: user?.city || "",
        province: user?.province || "",
        zipCode: user?.zipCode || "",
      }));
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      toast.error("Please log in to continue");
      navigate("/login");
    }
  }, [user, navigate]);

  // Redirect if cart is empty
  useEffect(() => {
    if (user && cart.length === 0) {
      toast.error("Your cart is empty");
      navigate("/cart");
    }
  }, [user, cart, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Please enter your email");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }
    if (!/^\d{10,11}$/.test(formData.phone.replace(/\D/g, ""))) {
      toast.error("Please enter a valid 10-11 digit phone number");
      return false;
    }
    if (!formData.address.trim()) {
      toast.error("Please enter your delivery address");
      return false;
    }
    if (!formData.city.trim()) {
      toast.error("Please enter your city");
      return false;
    }
    if (!formData.province.trim()) {
      toast.error("Please enter your province");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const orderData = {
        buyerId: user.uid,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price || item.basePrice) || 0,
          quantity: Number(item.quantity) || 1,
          imageUrl: item.imageUrl,
          sellerId: item.sellerId,
          storeName: item.storeName || "Unknown Seller",
        })),
        subtotal: Number(subtotal) || 0,
        deliveryFee: Number(deliveryFee) || 0,
        total: Number(total) || 0,
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

      console.log("Submitting order:", orderData);

      const order = await createOrder(orderData);

      console.log("Order created successfully:", order);

      toast.success(
        `Order placed successfully! Order #${order.id.slice(-8).toUpperCase()}`,
        { duration: 4000 },
      );

      clearCart();

      // Navigate to orders page
      setTimeout(() => {
        navigate("/orders");
      }, 1000);
    } catch (err) {
      console.error("Failed to place order:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to place order. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">Your cart is empty</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Delivery Information Section */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-blue-600" />
                  Delivery Information
                </h2>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <span className="flex items-center gap-1">
                        <User size={16} />
                        Full Name *
                      </span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <span className="flex items-center gap-1">
                        <Phone size={16} />
                        Phone Number *
                      </span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="09XX-XXX-XXXX"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      We'll use this number for delivery updates
                    </p>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Street Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="House/Unit/Building No., Street Name, Barangay"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {/* City */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="City"
                      />
                    </div>

                    {/* Province */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Province *
                      </label>
                      <input
                        type="text"
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Province"
                      />
                    </div>

                    {/* Zip Code */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Zip Code
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Section */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard size={20} className="text-blue-600" />
                  Payment Method
                </h2>

                <div className="space-y-3">
                  {/* COD Option */}
                  <label
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.paymentMethod === "cod"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === "cod"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900">
                        Cash on Delivery (COD)
                      </p>
                      <p className="text-sm text-gray-600">
                        Pay when you receive the order
                      </p>
                    </div>
                  </label>

                  {/* Bank Transfer Option */}
                  <label
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.paymentMethod === "bank"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={formData.paymentMethod === "bank"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900">
                        Bank Transfer
                      </p>
                      <p className="text-sm text-gray-600">
                        Transfer to seller's bank account
                      </p>
                    </div>
                  </label>

                  {/* GCash Option */}
                  <label
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.paymentMethod === "gcash"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="gcash"
                      checked={formData.paymentMethod === "gcash"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900">GCash</p>
                      <p className="text-sm text-gray-600">Pay using GCash</p>
                    </div>
                  </label>
                </div>

                {/* Payment Note */}
                {formData.paymentMethod !== "cod" && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> After placing your order, you'll
                      need to upload payment proof (QR code or receipt
                      screenshot). The seller will verify your payment before
                      processing.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    Place Order
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm sticky top-6 p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>

              {/* Items Preview */}
              <div className="border-b pb-4">
                <button
                  type="button"
                  onClick={() => setExpandedItems(!expandedItems)}
                  className="w-full flex items-center justify-between font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                >
                  <span>Items ({cart.length})</span>
                  <ChevronDown
                    size={20}
                    className={`transition-transform ${
                      expandedItems ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {expandedItems && (
                  <div className="mt-3 space-y-3 max-h-64 overflow-y-auto">
                    {cart.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex gap-2 text-sm border-t pt-3"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 line-clamp-2">
                            {item.name}
                          </p>
                          <p className="text-gray-600">
                            x{item.quantity} @ ₱
                            {(
                              Number(item.price || item.basePrice) || 0
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">
                    ₱{(Number(subtotal) || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span
                    className={`font-semibold ${
                      deliveryFee === 0 ? "text-green-600" : ""
                    }`}
                  >
                    {(Number(deliveryFee) || 0) === 0
                      ? "FREE"
                      : `₱${(Number(deliveryFee) || 0).toLocaleString()}`}
                  </span>
                </div>

                {deliveryFee > 0 && (
                  <p className="text-xs text-gray-500">
                    Free delivery on orders over ₱1,000
                  </p>
                )}

                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-black text-blue-600">
                    ₱{(Number(total) || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Truck
                    size={16}
                    className="text-blue-600 mt-1 flex-shrink-0"
                  />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900">
                      Estimated Delivery
                    </p>
                    <p className="text-blue-700">3-5 business days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
