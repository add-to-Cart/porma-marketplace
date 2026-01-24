import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, subtotal, deliveryFee, total } =
    useCart();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCheckout = () => {
    // Check if user is authenticated
    if (!user) {
      toast.error("Please log in to proceed with checkout");
      navigate("/login");
      return;
    }

    // Check if cart is empty
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Navigate to checkout page
    navigate("/checkout");
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-3xl font-bold mb-2 text-gray-900">
            Your Cart is Empty
          </h1>
          <p className="text-gray-500 mb-6">Add some products to get started</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold"
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      <div className="space-y-4">
        {cart.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 border rounded-lg p-4 bg-white"
          >
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-20 h-20 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{item.name}</h3>
              <p className="text-gray-600 text-sm">
                ₱{(Number(item.basePrice) || 0).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="p-1 border rounded hover:bg-gray-100"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-semibold">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="p-1 border rounded hover:bg-gray-100"
              >
                <Plus size={14} />
              </button>
            </div>
            <p className="font-bold text-gray-900 w-24 text-right">
              ₱
              {(
                (Number(item.basePrice) || 0) * (Number(item.quantity) || 0)
              ).toLocaleString()}
            </p>
            <button
              onClick={() => removeFromCart(item.id)}
              className="text-red-600 hover:text-red-800 p-2"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="mt-6 border-t pt-4 bg-white rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4">Order Summary</h2>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold">₱{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delivery Fee:</span>
            <span
              className={
                deliveryFee === 0
                  ? "text-green-600 font-semibold"
                  : "font-semibold"
              }
            >
              {deliveryFee === 0 ? "FREE" : `₱${deliveryFee.toLocaleString()}`}
            </span>
          </div>
          {deliveryFee > 0 && (
            <p className="text-xs text-gray-500">
              Free delivery on orders over ₱1,000
            </p>
          )}
          <div className="border-t pt-2 flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span className="text-blue-600">₱{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Authentication Status */}
        {user ? (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              ✓ <strong>Logged in as {user?.displayName || user?.email}</strong>
            </p>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              ⚠️ <strong>Please log in to proceed with checkout</strong>
            </p>
          </div>
        )}

        <button
          onClick={handleCheckout}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-lg transition-colors"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
