// Simple client-side order utilities using localStorage
const ORDERS_KEY = "mock_orders_v1";

function loadOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load orders", e);
    return [];
  }
}

function saveOrders(orders) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error("Failed to save orders", e);
  }
}

export function createSimulatedOrder({
  buyerId,
  items,
  subtotal,
  deliveryFee,
  total,
}) {
  const id = `order_${Date.now().toString(36)}_${Math.floor(Math.random() * 10000)}`;
  const createdAt = new Date().toISOString();

  // Randomized estimated delivery between 2 and 7 days
  const estimatedDays = Math.floor(Math.random() * 6) + 2;

  const stages = [
    { key: "processing", label: "Processing", etaHours: 2 },
    {
      key: "packed",
      label: "Packed",
      etaHours: 12 + Math.floor(Math.random() * 24),
    },
    {
      key: "shipped",
      label: "Shipped",
      etaHours: 24 + Math.floor(Math.random() * 72),
    },
    { key: "out_for_delivery", label: "Out for Delivery", etaHours: 24 },
    { key: "delivered", label: "Delivered", etaHours: estimatedDays * 24 },
  ];

  const order = {
    id,
    buyerId: buyerId || null,
    items,
    subtotal,
    deliveryFee,
    total,
    createdAt,
    estimatedDays,
    status: "processing",
    stages,
  };

  const orders = loadOrders();
  orders.unshift(order);
  saveOrders(orders);

  return order;
}

export function getOrders() {
  updateOrderStatuses();
  return loadOrders();
}

export function getOrder(id) {
  updateOrderStatuses();
  return loadOrders().find((o) => o.id === id) || null;
}

export function updateOrderStatuses() {
  const orders = loadOrders();
  const now = new Date();

  orders.forEach((order) => {
    const createdAt = new Date(order.createdAt);
    const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);

    // Find the appropriate stage based on time elapsed
    let newStatus = "processing";
    for (const stage of order.stages) {
      if (hoursElapsed >= stage.etaHours) {
        newStatus = stage.key;
      } else {
        break;
      }
    }

    order.status = newStatus;
  });

  saveOrders(orders);
  return orders;
}

export function getOrdersBySeller(sellerId) {
  updateOrderStatuses();
  const allOrders = loadOrders();
  return allOrders.filter((order) =>
    order.items.some((item) => item.sellerId === sellerId),
  );
}
