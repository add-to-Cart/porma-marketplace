import api from "./api";

export const getAllProducts = async (filters) => {
  // Flatten the filters to handle nested vehicle object
  const flattened = {
    category: filters.category || "",
    vehicleType: filters.vehicleType || "",
    isBundle: filters.isBundle || false,
    isSeasonal: filters.isSeasonal || false,
    make: filters.vehicle?.make || "",
    model: filters.vehicle?.model || "",
  };
  const params = new URLSearchParams(flattened).toString();
  const res = await api.get(`/products?${params}`);
  return res.data;
};

export const searchProducts = async (filters) => {
  // Flatten the filters
  const flattened = {
    query: filters.query || "",
    category: filters.category || "",
    vehicleType: filters.vehicleType || "",
    isBundle: filters.isBundle || false,
    isSeasonal: filters.isSeasonal || false,
    make: filters.vehicle?.make || "",
    model: filters.vehicle?.model || "",
  };
  const params = new URLSearchParams(flattened).toString();
  const res = await api.get(`/products/search?${params}`);
  return res.data;
};

export const getTrendingProducts = async () => {
  const res = await api.get("/products/trending");
  return res.data;
};

export const getRelatedProducts = async (id, params) => {
  const query = new URLSearchParams(params).toString();
  const res = await api.get(`/products/${id}/related?${query}`);
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
