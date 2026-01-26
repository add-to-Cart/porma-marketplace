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
  return res.data.products || res.data || [];
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
 * Add review to product - FIXED VERSION
 */
export const addReview = async (
  productId,
  rating,
  reviewText,
  buyerId,
  buyerName,
) => {
  try {
    console.log("API call to add review:", {
      productId,
      rating,
      reviewText,
      buyerId,
      buyerName,
    });

    const res = await api.post(`/products/${productId}/review`, {
      rating: Number(rating),
      reviewText: reviewText || "",
      buyerId,
      buyerName: buyerName || "Anonymous",
    });

    console.log("Review API response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Review API error:", error.response?.data || error);
    throw error;
  }
};

/**
 * Get reviews for a product - FIXED VERSION
 */
export const getProductReviews = async (productId) => {
  try {
    console.log("Fetching reviews for product:", productId);

    if (!productId) {
      throw new Error("Product ID is required");
    }

    const res = await api.get(`/products/${productId}/reviews`);
    console.log("Reviews API response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Get reviews API error:", error.response?.data || error);
    throw error;
  }
};

/**
 * Reply to a review as a seller
 */
export const replyToReview = async (reviewId, replyText) => {
  try {
    console.log("Replying to review:", { reviewId, replyText });

    if (!reviewId) {
      throw new Error("Review ID is required");
    }

    if (!replyText || replyText.trim() === "") {
      throw new Error("Reply text is required");
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Authentication required");
    }

    const res = await api.put(
      `/products/reviews/${reviewId}/reply`,
      {
        replyText,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log("Reply API response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Reply API error:", error.response?.data || error);
    throw error;
  }
};
