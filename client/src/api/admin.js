// Helper to get admin username from localStorage
const getAdminUsername = () => {
  const adminData = localStorage.getItem("adminData");
  if (adminData) {
    try {
      const { username } = JSON.parse(adminData);
      return username;
    } catch (e) {
      return "admin";
    }
  }
  return "admin";
};

// Helper to create admin headers (no auth token needed)
const getAdminHeaders = () => {
  return {
    "Content-Type": "application/json",
    "x-admin-username": getAdminUsername(),
  };
};

// Sales Analytics
export const getSalesAnalytics = async () => {
  const res = await fetch("http://localhost:3002/admin/analytics/sales", {
    method: "GET",
    headers: getAdminHeaders(),
  });
  return res.json();
};

// Sellers with Products
export const getSellersWithProducts = async () => {
  const res = await fetch("http://localhost:3002/admin/sellers-with-products", {
    method: "GET",
    headers: getAdminHeaders(),
  });
  return res.json();
};

// Seller Details
export const getSellerDetails = async (sellerId) => {
  const res = await fetch(`http://localhost:3002/admin/sellers/${sellerId}`, {
    method: "GET",
    headers: getAdminHeaders(),
  });
  return res.json();
};

// User Management
export const getAllUsers = async () => {
  const res = await fetch("http://localhost:3002/admin/users", {
    method: "GET",
    headers: getAdminHeaders(),
  });
  return res.json();
};

export const getUserById = async (userId) => {
  const res = await fetch(`http://localhost:3002/admin/users/${userId}`, {
    method: "GET",
    headers: getAdminHeaders(),
  });
  return res.json();
};

export const updateUserStatus = async (userId, action, reason = "") => {
  const res = await fetch(
    `http://localhost:3002/admin/users/${userId}/status`,
    {
      method: "PUT",
      headers: getAdminHeaders(),
      body: JSON.stringify({ action, reason }),
    },
  );
  return res.json();
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

// Top Sellers
export const getTopSellers = async (limit = 10) => {
  const res = await fetch(
    `http://localhost:3002/admin/analytics/top-sellers?limit=${limit}`,
    {
      method: "GET",
      headers: getAdminHeaders(),
    },
  );
  return res.json();
};

// Seller Applications
export const getSellerApplications = async () => {
  const res = await fetch("http://localhost:3002/admin/applications", {
    method: "GET",
    headers: getAdminHeaders(),
  });
  return res.json();
};

export const approveSellerApplication = async (userId) => {
  const res = await fetch(
    `http://localhost:3002/admin/applications/${userId}/approve`,
    {
      method: "POST",
      headers: getAdminHeaders(),
    },
  );
  return res.json();
};

export const rejectSellerApplication = async (userId, reason = "") => {
  const res = await fetch(
    `http://localhost:3002/admin/applications/${userId}/reject`,
    {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ reason }),
    },
  );
  return res.json();
};
