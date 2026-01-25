import api from "./api";

/**
 * Get all products with pagination and filtering
 * @param {Object} filters - Filter parameters
 * @param {number} page - Page number (0-indexed)
 * @param {number} limit - Items per page
 */
export const getAllProducts = async (filters = {}, page = 0, limit = 20) => {
  const params = new URLSearchParams({
    category: filters.category || "",
    vehicleType: filters.vehicleType || "",
    isBundle: filters.isBundle || false,
    isSeasonal: filters.isSeasonal || false,
    make: filters.vehicle?.make || "",
    model: filters.vehicle?.model || "",
    page: page.toString(),
    limit: limit.toString(),
    sortBy: filters.sortBy || "newest",
  });

  const res = await api.get(`/products?${params.toString()}`);
  return res.data;
};

/**
 * Search products with fuzzy matching
 * @param {Object} filters - Search and filter parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 */
export const searchProducts = async (filters, page = 0, limit = 20) => {
  const params = new URLSearchParams({
    query: filters.query || "",
    category: filters.category || "",
    vehicleType: filters.vehicleType || "",
    isBundle: filters.isBundle || false,
    isSeasonal: filters.isSeasonal || false,
    make: filters.vehicle?.make || "",
    model: filters.vehicle?.model || "",
    page: page.toString(),
    limit: limit.toString(),
    sortBy: filters.sortBy || "relevance",
  });

  const res = await api.get(`/products/search?${params.toString()}`);
  return res.data;
};

/**
 * Get trending products using enhanced algorithm
 * @param {number} limit - Number of trending items to return
 */
export const getTrendingProducts = async (limit = 20) => {
  const res = await api.get(`/products/trending?limit=${limit}`);
  return res.data;
};

/**
 * Get related products for a specific product
 */
export const getRelatedProducts = async (id, params) => {
  const query = new URLSearchParams(params).toString();
  const res = await api.get(`/products/${id}/related?${query}`);
  return res.data;
};

/**
 * Get single product by ID
 */
export const getProductById = async (id) => {
  const res = await api.get(`/products/${id}`);
  return res.data;
};

/**
 * Get products by seller
 */
export const getProductsBySeller = async (sellerId, page = 0, limit = 20) => {
  const res = await api.get(
    `/products/seller/${sellerId}?page=${page}&limit=${limit}`,
  );
  return res.data;
};

/**
 * Create a new product
 */
export const createProduct = async (productData) => {
  const res = await api.post("/products", productData);
  return res.data;
};

/**
 * Update existing product
 */
export const updateProduct = async (id, productData) => {
  const res = await api.patch(`/products/${id}`, productData);
  return res.data;
};

/**
 * Increment view count
 */
export const incrementViewCount = async (id) => {
  try {
    const res = await api.patch(`/products/${id}/view`);
    return res.data;
  } catch (err) {
    console.error("Failed to update view count:", err);
  }
};

/**
 * Add rating to product
 */
export const addRating = async (productId, rating, buyerId) => {
  const res = await api.post(`/products/${productId}/rating`, {
    rating,
    buyerId,
  });
  return res.data;
};

/**
 * Add review to product
 */
export const addReview = async (
  productId,
  rating,
  reviewText,
  buyerId,
  buyerName,
) => {
  const res = await api.post(`/products/${productId}/review`, {
    rating,
    reviewText,
    buyerId,
    buyerName,
  });
  return res.data;
};

/**
 * Get reviews for a product
 */
export const getProductReviews = async (productId) => {
  const res = await api.get(`/products/${productId}/reviews`);
  return res.data;
};
