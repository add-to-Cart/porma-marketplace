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

export const uploadPaymentProof = async (
  orderId,
  paymentProofUrl,
  referenceNumber,
) => {
  const res = await api.post(`/orders/${orderId}/payment-proof`, {
    paymentProofUrl,
    referenceNumber,
  });
  return res.data;
};

export const verifyPayment = async (
  orderId,
  verified,
  sellerId,
  rejectionReason,
) => {
  const res = await api.post(`/orders/${orderId}/verify-payment`, {
    verified,
    sellerId,
    rejectionReason,
  });
  return res.data;
};
