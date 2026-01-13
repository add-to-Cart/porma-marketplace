import api from "./api";

export const getAllProducts = async (filters) => {
  // Convert the filter object into URL parameters (?category=...&vehicleType=...)
  const params = new URLSearchParams(filters).toString();
  const res = await api.get(`/products?${params}`);
  return res.data;
};

export const searchProducts = async (filters) => {
  // Convert filter object to query string
  const params = new URLSearchParams(filters).toString();
  const res = await api.get(`/products/search?${params}`);
  return res.data;
};

export const getTrendingProducts = async () => {
  const res = await api.get("/products/trending");
  return res.data;
};

export const getProductById = async (id) => {
  const res = await api.get(`/products/${id}`);
  return res.data;
};

export const createProduct = async (productData) => {
  // Sending the structured object to the POST /products route
  const res = await api.post("/products", productData);
  return res.data;
};

export const updateProduct = async (id, productData) => {
  const res = await api.patch(`/products/${id}`, productData);
  return res.data;
};
