import admin from "../config/firebaseAdmin.js";
const db = admin.firestore();
import { getTrendingProducts as calculateTrendingProducts } from "../utils/trendingAlgorithm.js";
import {
  checkStockAvailability,
  checkMultipleProductsStock,
  getStockStatus,
} from "../utils/stockManagement.js";
import { populateSellerInfo } from "./productController.js";

// 1. MARKETPLACE: Latest to Oldest with PAGINATION
export const getAllProducts = async (req, res) => {
  try {
    const {
      category,
      vehicleType,
      make,
      model,
      isBundle,
      isSeasonal,
      page = 0,
      limit = 20,
      sortBy = "newest",
    } = req.query;

    let query = db.collection("products");

    if (isBundle !== "true") {
      query = query.where("isBundle", "==", false);
    }

    query = query.orderBy("createdAt", "desc");

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = pageNum * limitNum;

    const batchSize = 100;
    const snapshot = await query.offset(offset).limit(batchSize).get();

    let products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (category) {
      products = products.filter(
        (p) => p.categories && p.categories.includes(category),
      );
    }

    if (vehicleType) {
      products = products.filter(
        (p) => p.vehicleCompatibility?.type === vehicleType,
      );
    }

    if (make) {
      products = products.filter((p) =>
        p.vehicleCompatibility?.makes?.includes(make),
      );
    }

    if (model) {
      products = products.filter((p) =>
        p.vehicleCompatibility?.models?.includes(model),
      );
    }

    if (isSeasonal === "true") {
      products = products.filter((p) => p.isSeasonal === true);
    }

    const totalFiltered = products.length;
    products = products.slice(0, limitNum);
    const hasMore = totalFiltered > limitNum;

    products = await populateSellerInfo(products);

    res.json({
      products,
      page: pageNum,
      limit: limitNum,
      hasMore,
      total: products.length,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch products", error: err.message });
  }
};

// 2. TRENDING: Refined algorithm using normalized metrics
export const getTrendingProducts = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const snapshot = await db.collection("products").limit(200).get();

    let products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    products = products.map((p) => {
      let avgRating = p.ratingAverage || 0;
      if (!avgRating && p.ratings && p.ratings.length > 0) {
        avgRating = p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length;
      }

      return {
        ...p,
        ratingAverage: parseFloat(avgRating.toFixed(1)),
        soldCount: p.soldCount || 0,
        viewCount: p.viewCount || 0,
        ratingsCount: p.ratingsCount || 0,
      };
    });

    const trendingProducts = calculateTrendingProducts(
      products,
      parseInt(limit),
    );

    const productsWithSellerInfo = await populateSellerInfo(trendingProducts);

    res.json(productsWithSellerInfo);
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Failed to fetch trending products",
        error: err.message,
      });
  }
};

// Trending products filtered by seller
export const getTrendingProductsBySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { limit = 20 } = req.query;
    if (!sellerId)
      return res.status(400).json({ message: "sellerId required" });

    const snapshot = await db
      .collection("products")
      .where("sellerId", "==", sellerId)
      .limit(200)
      .get();
    let products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    products = products.map((p) => {
      let avgRating = p.ratingAverage || 0;
      if (!avgRating && p.ratings && p.ratings.length > 0) {
        avgRating = p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length;
      }

      return {
        ...p,
        ratingAverage: parseFloat(avgRating.toFixed(1)),
        soldCount: p.soldCount || 0,
        viewCount: p.viewCount || 0,
        ratingsCount: p.ratingsCount || 0,
      };
    });

    const trendingProducts = calculateTrendingProducts(
      products,
      parseInt(limit),
    );
    const productsWithSellerInfo = await populateSellerInfo(trendingProducts);
    res.json(productsWithSellerInfo);
  } catch (err) {
    console.error("getTrendingProductsBySeller error:", err);
    res.status(500).json({
      message: "Failed to get trending products by seller",
      error: err.message,
    });
  }
};

// 3. DEALS PAGE: Bundles and Seasonal Items
export const getDealsProducts = async (req, res) => {
  try {
    const bundlesSnapshot = await db
      .collection("products")
      .where("isBundle", "==", true)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const seasonalSnapshot = await db
      .collection("products")
      .where("isSeasonal", "==", true)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const bundles = bundlesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const seasonal = seasonalSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const bundlesWithSeller = await populateSellerInfo(bundles);
    const seasonalWithSeller = await populateSellerInfo(seasonal);

    res.json({
      bundles: bundlesWithSeller,
      seasonal: seasonalWithSeller,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch deals", error: err.message });
  }
};

// Get products by seller with pagination
export const getProductsBySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { page = 0, limit = 20 } = req.query;

    if (!sellerId) {
      return res
        .status(400)
        .json({ message: "sellerId parameter is required" });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = pageNum * limitNum;

    const snapshot = await db
      .collection("products")
      .where("sellerId", "==", sellerId)
      .orderBy("createdAt", "desc")
      .offset(offset)
      .limit(limitNum + 1)
      .get();

    let products = snapshot.docs.slice(0, limitNum).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const hasMore = snapshot.docs.length > limitNum;

    const productsWithSeller = await populateSellerInfo(products);

    return res.json({
      products: productsWithSeller,
      page: pageNum,
      limit: limitNum,
      hasMore,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch seller products", error: err.message });
  }
};

// Get related products
export const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, make, sellerId } = req.query;

    let query = db.collection("products").where("isBundle", "==", false);

    const snapshot = await query.limit(50).get();

    let related = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((p) => p.id !== id);

    if (category) {
      related = related.filter(
        (p) => p.categories && p.categories.includes(category),
      );
    }

    related.sort((a, b) => {
      const aSameStore = a.sellerId === sellerId ? 1 : 0;
      const bSameStore = b.sellerId === sellerId ? 1 : 0;
      if (aSameStore !== bSameStore) return bSameStore - aSameStore;

      if (make) {
        const aMatch = a.vehicleCompatibility?.makes?.includes(make) ? 1 : 0;
        const bMatch = b.vehicleCompatibility?.makes?.includes(make) ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
      }

      return (b.soldCount || 0) - (a.soldCount || 0);
    });

    const relatedWithSeller = await populateSellerInfo(related.slice(0, 8));

    res.json(relatedWithSeller);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch related products",
      error: err.message,
    });
  }
};

// Get product by ID with seller information
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("products").doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const productData = snapshot.data();

    const product = { id: snapshot.id, ...productData };

    const populated = await populateSellerInfo([product]);

    res.json(populated[0]);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch product", error: err.message });
  }
};

// Search products
export const searchProducts = async (req, res) => {
  try {
    const { query, category, vehicleType, make, model, isBundle, isSeasonal } =
      req.query;

    if (!query || query.trim().length < 2) {
      return res.json([]);
    }

    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((k) => k.length > 0);

    let firestoreQuery = db.collection("products");

    if (vehicleType) {
      firestoreQuery = firestoreQuery.where(
        "vehicleCompatibility.type",
        "==",
        vehicleType,
      );
    }

    firestoreQuery = firestoreQuery.where(
      "searchTags",
      "array-contains-any",
      keywords.slice(0, 10),
    );

    const snapshot = await firestoreQuery.get();
    let products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (category) {
      products = products.filter(
        (p) => p.categories && p.categories.includes(category),
      );
    }
    if (make) {
      products = products.filter((p) =>
        p.vehicleCompatibility?.makes?.includes(make),
      );
    }
    if (model) {
      products = products.filter((p) =>
        p.vehicleCompatibility?.models?.includes(model),
      );
    }
    if (isBundle === "true") {
      products = products.filter((p) => p.isBundle === true);
    } else if (isBundle === "false") {
      products = products.filter((p) => p.isBundle !== true);
    }
    if (isSeasonal === "true") {
      products = products.filter((p) => p.isSeasonal === true);
    }

    products = await populateSellerInfo(products);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Search failed", error: err.message });
  }
};

export const getProductsByTag = async (req, res) => {
  try {
    const { tag } = req.query;
    const snapshot = await db
      .collection("products")
      .where("searchTags", "array-contains", tag.toLowerCase())
      .limit(8)
      .get();

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(products);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch products by tag", error: err.message });
  }
};

export const incrementViewCount = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("products").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const currentViewCount = doc.data().viewCount || 0;

    await docRef.update({
      viewCount: currentViewCount + 1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      id,
      viewCount: currentViewCount + 1,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update view count", error: err.message });
  }
};

/**
 * Check stock availability for a single product
 */
export const checkProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity = 1 } = req.query;

    const result = await checkStockAvailability(id, parseInt(quantity));

    if (!result.available) {
      return res.status(400).json(result);
    }

    res.json({
      productId: id,
      ...result,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to check stock", error: err.message });
  }
};

/**
 * Check stock for multiple products at once
 */
export const checkMultipleStock = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items array is required" });
    }

    const result = await checkMultipleProductsStock(items);

    res.json(result);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to check stock", error: err.message });
  }
};

/**
 * Get detailed stock status for a product
 */
export const getProductStockStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const status = await getStockStatus(id);

    if (!status) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(status);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to get stock status", error: err.message });
  }
};

export const addRating = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, buyerId } = req.body;

    if (!productId || rating === undefined || !buyerId) {
      return res.status(400).json({
        message: "Missing required fields: productId, rating, buyerId",
      });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    const productRef = db.collection("products").doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = productDoc.data();
    const ratings = product.ratings || [];

    ratings.push(rating);

    const ratingAverage =
      ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : 0;

    await productRef.update({
      ratings,
      ratingsCount: ratings.length,
      ratingAverage: Math.round(ratingAverage * 10) / 10,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updatedDoc = await productRef.get();
    res.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to add rating", error: err.message });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const { id } = req.params; // Changed from productId to id to match route

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const reviewsSnapshot = await db
      .collection("reviews")
      .where("productId", "==", id)
      .orderBy("createdAt", "desc")
      .get();

    const reviews = [];
    reviewsSnapshot.forEach((doc) => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
        sellerReply: data.sellerReply
          ? {
              ...data.sellerReply,
              repliedAt:
                data.sellerReply.repliedAt?.toDate?.() ||
                data.sellerReply.repliedAt ||
                null,
            }
          : null,
      });
    });

    const buyerIds = [
      ...new Set(reviews.map((r) => r.buyerId).filter((id) => id)),
    ];
    if (buyerIds.length > 0) {
      const buyerPromises = buyerIds.map((id) =>
        db.collection("users").doc(id).get(),
      );
      const buyerDocs = await Promise.all(buyerPromises);
      const buyerMap = {};
      buyerDocs.forEach((doc, index) => {
        if (doc.exists) {
          const userData = doc.data();
          buyerMap[buyerIds[index]] = {
            avatarUrl: userData.photoURL || null,
          };
        }
      });
      reviews.forEach((review) => {
        if (review.buyerId && buyerMap[review.buyerId]) {
          review.buyerAvatarUrl = buyerMap[review.buyerId].avatarUrl;
        }
      });
    }

    const sellerIds = [
      ...new Set(
        reviews.map((r) => r.sellerReply?.sellerId).filter((id) => id),
      ),
    ];
    if (sellerIds.length > 0) {
      const sellerPromises = sellerIds.map((id) =>
        db.collection("users").doc(id).get(),
      );
      const sellerDocs = await Promise.all(sellerPromises);
      const sellerMap = {};
      sellerDocs.forEach((doc, index) => {
        if (doc.exists) {
          const userData = doc.data();
          sellerMap[sellerIds[index]] = {
            avatarUrl: userData.photoURL || null,
            name: userData.displayName || userData.name || "Seller",
          };
        }
      });
      reviews.forEach((review) => {
        if (
          review.sellerReply?.sellerId &&
          sellerMap[review.sellerReply.sellerId]
        ) {
          review.sellerReply.sellerAvatarUrl =
            sellerMap[review.sellerReply.sellerId].avatarUrl;
          review.sellerReply.sellerName =
            sellerMap[review.sellerReply.sellerId].name;
        }
      });
    }

    res.json(reviews);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: err.message,
    });
  }
};

export const addReview = async (req, res) => {
  try {
    const { id } = req.params; // product ID
    const { rating, reviewText, buyerId, buyerName } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5",
      });
    }

    if (!buyerId) {
      return res.status(400).json({
        success: false,
        message: "Buyer ID is required",
      });
    }

    const orderSnapshot = await db
      .collection("orders")
      .where("buyerId", "==", buyerId)
      .where("status", "==", "completed")
      .get();

    let hasPurchased = false;
    orderSnapshot.forEach((doc) => {
      const order = doc.data();
      if (order.items && Array.isArray(order.items)) {
        const hasProdItem = order.items.some((item) => item.productId === id);
        if (hasProdItem) {
          hasPurchased = true;
        }
      }
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: "You must complete a purchase of this product to review it",
      });
    }

    const review = {
      productId: id,
      buyerId: buyerId,
      buyerName: buyerName || "Anonymous",
      rating: Number(rating),
      reviewText: reviewText || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const reviewDoc = await db.collection("reviews").add(review);

    const productRef = db.collection("products").doc(id);
    const productDoc = await productRef.get();

    if (productDoc.exists) {
      const product = productDoc.data();
      const ratings = product.ratings || [];
      ratings.push(Number(rating));

      const ratingAverage =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b) / ratings.length
          : 0;

      await productRef.update({
        ratings,
        ratingsCount: ratings.length,
        ratingAverage: Math.round(ratingAverage * 10) / 10,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.json({
      success: true,
      id: reviewDoc.id,
      ...review,
      createdAt: new Date(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to add review",
      error: err.message,
    });
  }
};
