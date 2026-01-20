import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createSimulatedOrder } from "@/utils/orders";
import toast from "react-hot-toast";

export default function Cart() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    subtotal,
    deliveryFee,
    total,
    clearCart,
  } = useCart();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
        <p className="text-gray-500">Your cart is empty.</p>
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
            className="flex items-center gap-4 border rounded-lg p-4"
          >
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-gray-600">₱{item.price.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="p-1 border rounded"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="p-1 border rounded"
              >
                <Plus size={14} />
              </button>
            </div>
            <p className="font-semibold">
              ₱{(item.price * item.quantity).toLocaleString()}
            </p>
            <button
              onClick={() => removeFromCart(item.id)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-6 border-t pt-4">
        {/* Order Summary */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>₱{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Delivery Fee:</span>
            <span className={deliveryFee === 0 ? "text-green-600" : ""}>
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
            <span>₱{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Authentication Status */}
        {isAuthenticated ? (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              <strong>Welcome back, {user?.displayName || user?.email}!</strong>{" "}
              You're ready to complete your purchase.
            </p>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> You can add items to your cart as a guest,
              but you must log in to proceed with checkout and complete your
              purchase.
            </p>
          </div>
        )}

        <button
          onClick={() => {
            if (!isAuthenticated) return navigate("/login");

            // Create simulated order
            const order = createSimulatedOrder({
              buyerId: user?.uid || user?.id || null,
              items: cart,
              subtotal,
              deliveryFee,
              total,
            });

            // Clear cart stored in localStorage so CartContext picks it up on next load
            // Clear cart via context so UI updates
            clearCart();

            toast.success(
              `Order placed — est. delivery ${order.estimatedDays} days`,
            );
            navigate("/orders");
          }}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold"
        >
          {isAuthenticated ? "Complete Purchase" : "Proceed to Checkout"}
        </button>
      </div>
    </div>
  );
}
