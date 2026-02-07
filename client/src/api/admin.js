import api from "./api";

// Helper to get token
const getToken = () => {
  return localStorage.getItem("authToken");
};

// Helper to create auth headers
const getAuthHeaders = () => {
  const token = getToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Sales Analytics
export const getSalesAnalytics = async () => {
  const res = await api.get("/admin/analytics/sales", {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// Sellers with Products
export const getSellersWithProducts = async () => {
  const res = await api.get("/admin/sellers-with-products", {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// Seller Details
export const getSellerDetails = async (sellerId) => {
  const res = await api.get(`/admin/sellers/${sellerId}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// User Management
export const getAllUsers = async () => {
  const res = await api.get("/admin/users", {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const getUserById = async (userId) => {
  const res = await api.get(`/admin/users/${userId}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const updateUserStatus = async (userId, action, reason = "") => {
  const res = await api.put(
    `/admin/users/${userId}/status`,
    {
      action, // 'deactivate', 'restrict', 'activate'
      reason,
    },
    {
      headers: getAuthHeaders(),
    },
  );
  return res.data;
};

export const deactivateUser = async (userId, reason) => {
  return updateUserStatus(userId, "deactivate", reason);
};

export const restrictUser = async (userId, reason) => {
  return updateUserStatus(userId, "restrict", reason);
};

export const activateUser = async (userId) => {
  return updateUserStatus(userId, "activate", "");
};

// Data Synchronization
export const syncAllSellerMetrics = async () => {
  const res = await api.post(
    "/sync/sync-all-sellers",
    {},
    {
      headers: getAuthHeaders(),
    },
  );
  return res.data;
};

export const recalculateSellerMetrics = async (sellerId) => {
  const res = await api.post(
    `/sync/sync-seller/${sellerId}`,
    {},
    {
      headers: getAuthHeaders(),
    },
  );
  return res.data;
};

export const verifyDataConsistency = async () => {
  const res = await api.get("/sync/verify-consistency", {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const getSellerSalesTrend = async (sellerId, daysBack = 30) => {
  const res = await api.get(`/sync/seller-trend/${sellerId}`, {
    headers: getAuthHeaders(),
    params: { daysBack },
  });
  return res.data;
};

// Top Sellers
export const getTopSellers = async (limit = 10) => {
  const res = await api.get("/admin/analytics/top-sellers", {
    headers: getAuthHeaders(),
    params: { limit },
  });
  return res.data;
};
