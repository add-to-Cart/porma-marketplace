import api from "./api";

export const getAllProducts = async () => {
  const res = await api.get("/products");
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

export const searchProducts = async (query) => {
  const res = await api.get(`/products/search?query=${query}`);
  return res.data;
};
