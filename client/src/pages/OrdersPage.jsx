import { useState, useEffect } from "react";
import { getOrders } from "@/utils/orders";
import DeliveryTracker from "@/components/DeliveryTracker";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  // Update orders periodically and on window focus
  useEffect(() => {
    const updateOrders = () => {
      setOrders(getOrders());
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
  }, []);

  if (orders.length === 0)
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Your Orders</h1>
        <p className="text-gray-500">You have no orders yet.</p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-bold">Order #{o.id.split("_").pop()}</div>
                <div className="text-sm text-gray-500">
                  Placed: {new Date(o.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">Est: {o.estimatedDays} days</div>
                <div className="text-sm text-gray-500">Status: {o.status}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                {o.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center gap-4 py-2 border-b last:border-b-0"
                  >
                    <img
                      src={it.imageUrl}
                      alt={it.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <div className="font-semibold">{it.name}</div>
                      <div className="text-sm text-gray-500">
                        Qty: {it.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-right">
                <div className="font-bold">₱{o.total.toLocaleString()}</div>
                <div className="text-sm text-gray-500">
                  Delivery: ₱{o.deliveryFee}
                </div>
              </div>
            </div>

            {/* Delivery Tracker */}
            <div className="mt-4">
              <DeliveryTracker order={o} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
