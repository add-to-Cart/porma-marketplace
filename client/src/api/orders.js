import api from "./api";

export const createOrder = async (orderData) => {
  const res = await api.post("/orders", orderData);
  return res.data;
};

export const getBuyerOrders = async (buyerId) => {
  const res = await api.get(`/orders/buyer/${buyerId}`);
  return res.data;
};

export const getSellerOrders = async (sellerId) => {
  const res = await api.get(`/orders/seller/${sellerId}`);
  return res.data;
};

export const getOrder = async (orderId) => {
  const res = await api.get(`/orders/${orderId}`);
  return res.data;
};

export const updateOrderStatus = async (orderId, statusData) => {
  const res = await api.patch(`/orders/${orderId}`, statusData);
  return res.data;
};

export const completeOrder = async (orderId) => {
  const res = await api.patch(`/orders/${orderId}/complete`);
  return res.data;
};
