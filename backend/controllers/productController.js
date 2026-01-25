import admin from "../config/firebaseAdmin.js";
const db = admin.firestore();
import { uploadProductImage } from "../services/cloudinary_service.js";
import { getTrendingProducts as calculateTrendingProducts } from "../utils/trendingAlgorithm.js";
import {
  checkStockAvailability,
  checkMultipleProductsStock,
  getStockStatus,
  getSellerStockStatus,
} from "../utils/stockManagement.js";

// Helper function to populate seller information for products
const populateSellerInfo = async (products) => {
  const sellerIds = [
    ...new Set(products.map((p) => p.sellerId).filter((id) => id)),
  ];

  if (sellerIds.length === 0) return products;

  const sellerPromises = sellerIds.map((id) =>
    db.collection("users").doc(id).get(),
  );
  const sellerDocs = await Promise.all(sellerPromises);

  const sellerMap = {};
  sellerDocs.forEach((doc, index) => {
    if (doc.exists) {
      const sellerData = doc.data();
      const sellerId = sellerIds[index];

      if (sellerData.role === "seller" && sellerData.seller) {
        sellerMap[sellerId] = {
          storeName: sellerData.seller.storeName,
          owner: sellerData.seller.storeName,
        };
      } else if (sellerData.sellerApplication?.status === "pending") {
        sellerMap[sellerId] = {
          storeName: sellerData.sellerApplication.storeName,
          owner: sellerData.sellerApplication.storeName,
        };
      } else {
        sellerMap[sellerId] = {
          storeName: sellerData.displayName || "Unknown Seller",
          owner: sellerData.displayName || "Unknown Seller",
        };
      }
    }
  });

  return products.map((product) => ({
    ...product,
    ...(sellerMap[product.sellerId] || {
      storeName: "Unknown Seller",
      owner: "Unknown Seller",
    }),
  }));
};

// Helper to generate comprehensive search tags
const generateSearchTags = (data) => {
  const tags = new Set();

  const addPrefixes = (word) => {
    if (word.length > 2) {
      // Only for words longer than 2 chars
      for (let i = 3; i <= word.length; i++) {
        tags.add(word.substring(0, i));
      }
    } else {
      tags.add(word);
    }
  };

  if (data.name) {
    data.name
      .toLowerCase()
      .split(/\s+/)
      .forEach((word) => {
        if (word.length > 1) addPrefixes(word);
      });
  }

  // Handle categories as array
  if (data.categories && Array.isArray(data.categories)) {
    data.categories.forEach((cat) => tags.add(cat.toLowerCase()));
  }

  const comp = data.vehicleCompatibility;
  if (comp) {
    if (comp.isUniversalFit) {
      tags.add("universal");
    } else {
      comp.makes?.forEach((make) => tags.add(make.toLowerCase()));
      comp.models?.forEach((model) => tags.add(model.toLowerCase()));
    }
    if (comp.type && comp.type !== "Universal") {
      tags.add(comp.type.toLowerCase());
    }
  }

  if (data.isBundle) tags.add("bundle");
  if (data.isSeasonal) tags.add("seasonal");
  if (data.seasonalCategory) {
    tags.add(data.seasonalCategory.toLowerCase());
  }

  return Array.from(tags).filter((tag) => tag && tag.length > 1);
};

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

    // Start with a simple query - only filter bundles
    let query = db.collection("products");

    // Filter out bundles for marketplace (unless explicitly requested)
    if (isBundle !== "true") {
      query = query.where("isBundle", "==", false);
    }

    // Sort by newest first
    query = query.orderBy("createdAt", "desc");

    // Get more documents to account for in-memory filtering
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = pageNum * limitNum;

    // Get a larger batch to filter from
    const batchSize = 100; // Get more products to filter
    const snapshot = await query.offset(offset).limit(batchSize).get();

    let products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply all filters in memory
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

    // In-memory filters for complex queries
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

    // Apply pagination after filtering
    const totalFiltered = products.length;
    products = products.slice(0, limitNum);
    const hasMore = totalFiltered > limitNum;

    // Populate seller information
    products = await populateSellerInfo(products);

    res.json({
      products,
      page: pageNum,
      limit: limitNum,
      hasMore,
      total: products.length,
    });
  } catch (err) {
    console.error("Marketplace Error:", err);
    res.status(500).json({
      message: "Failed to fetch marketplace",
      error: err.message,
    });
  }
};

// 2. TRENDING: Refined algorithm using normalized metrics
export const getTrendingProducts = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get all available products (including bundles)
    const snapshot = await db.collection("products").limit(200).get();

    let products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Normalize data before scoring
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

    // Use the trending algorithm to rank products
    const trendingProducts = calculateTrendingProducts(
      products,
      parseInt(limit),
    );

    // Populate seller information
    const productsWithSellerInfo = await populateSellerInfo(trendingProducts);

    res.json(productsWithSellerInfo);
  } catch (err) {
    console.error("Trending Error:", err);
    res.status(500).json({
      message: "Failed to fetch trending products",
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

    // Populate seller information
    const bundlesWithSeller = await populateSellerInfo(bundles);
    const seasonalWithSeller = await populateSellerInfo(seasonal);

    res.json({
      bundles: bundlesWithSeller,
      seasonal: seasonalWithSeller,
    });
  } catch (err) {
    console.error("Deals Error:", err);
    res.status(500).json({
      message: "Failed to fetch deals",
      error: err.message,
    });
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

    // Populate seller information
    const productsWithSeller = await populateSellerInfo(products);

    return res.json({
      products: productsWithSeller,
      page: pageNum,
      limit: limitNum,
      hasMore,
    });
  } catch (err) {
    console.error("Failed to fetch seller products:", err);
    return res.status(500).json({
      message: "Failed to fetch seller products",
      error: err.message,
    });
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

    // Filter by category in memory
    if (category) {
      related = related.filter(
        (p) => p.categories && p.categories.includes(category),
      );
    }

    // Prioritize products from the same store first
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

    // Populate seller information
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

    // Fetch seller information if sellerId exists
    let sellerInfo = null;
    if (productData.sellerId) {
      try {
        const sellerDoc = await db
          .collection("users")
          .doc(productData.sellerId)
          .get();
        if (sellerDoc.exists) {
          const sellerData = sellerDoc.data();
          if (sellerData.role === "seller" && sellerData.seller) {
            sellerInfo = {
              storeName: sellerData.seller.storeName,
              owner: sellerData.seller.storeName,
            };
          } else if (sellerData.sellerApplication?.status === "pending") {
            sellerInfo = {
              storeName: sellerData.sellerApplication.storeName,
              owner: sellerData.sellerApplication.storeName,
            };
          } else {
            sellerInfo = {
              storeName: sellerData.displayName || "Unknown Seller",
              owner: sellerData.displayName || "Unknown Seller",
            };
          }
        }
      } catch (error) {
        console.error("Error fetching seller info:", error);
      }
    }

    res.json({
      id: snapshot.id,
      ...productData,
      ...sellerInfo,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch product" });
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

    // Search using searchTags
    firestoreQuery = firestoreQuery.where(
      "searchTags",
      "array-contains-any",
      keywords.slice(0, 10),
    );

    const snapshot = await firestoreQuery.get();
    let products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // In-memory filters
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

    // Populate seller information
    products = await populateSellerInfo(products);

    res.json(products);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ message: "Search failed", error: err.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    // 1. IMAGE VALIDATION: Prevent creation if no file is uploaded
    if (!req.file) {
      return res.status(400).json({
        message: "Product creation failed: An image is required.",
      });
    }

    const {
      name,
      categories,
      description,
      price,
      stock,
      compareAtPrice,
      isSeasonal,
      seasonalCategory,
      vehicleCompatibility,
      isUniversalFit,
      sellerId,
      storeName,
    } = req.body;
    const parsedCategories = JSON.parse(categories || "[]");

    const productData = {
      name: name.trim(),
      categories: parsedCategories,
      description: description.trim(),
      price: Number(price) || 0,
      stock: Number(stock) || 1,
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      isSeasonal: isSeasonal === "true",
      seasonalCategory: seasonalCategory ? seasonalCategory.trim() : null,
      vehicleCompatibility: vehicleCompatibility
        ? JSON.parse(vehicleCompatibility)
        : {},
      isUniversalFit: isUniversalFit === "true",
      sellerId: sellerId || null,
      storeName: storeName || null,
    };

    // 2. DATA TYPE CORRECTION
    if (typeof productData.vehicleCompatibility === "string") {
      productData.vehicleCompatibility = JSON.parse(
        productData.vehicleCompatibility,
      );
    }

    // Ensure Booleans and Numbers are correctly casted
    productData.isBundle = productData.isBundle === "true";
    productData.isSeasonal = productData.isSeasonal === "true";
    productData.price = Number(productData.price);

    if (productData.compareAtPrice) {
      productData.compareAtPrice = Number(productData.compareAtPrice);
    }

    // 3. BUNDLE METADATA: Handle contents
    if (
      productData.bundleContents &&
      typeof productData.bundleContents === "string"
    ) {
      try {
        productData.bundleContents = JSON.parse(productData.bundleContents);
      } catch (e) {
        // Fallback for comma-separated text
        productData.bundleContents = productData.bundleContents
          .split(",")
          .map((item) => item.trim());
      }
    }

    // 4. METRICS INITIALIZATION
    productData.ratingAverage = 0;
    productData.ratingsCount = 0;
    productData.viewCount = 0;
    productData.soldCount = 0;
    productData.isAvailable = true;

    // 5. FUZZY SEARCH PREPARATION
    // This function generates the prefixes and keywords used by your search logic
    productData.searchTags = generateSearchTags(productData);

    // 6. IMAGE UPLOAD
    const userId = productData.sellerId || "anonymous";
    const sanitizedName = productData.name.replace(/\s+/g, "-").toLowerCase();
    const publicId = `products/${userId}-${sanitizedName}`;

    const uploadResult = await uploadProductImage(req.file, publicId);
    productData.imageUrl = uploadResult.url;
    productData.cloudinaryId = uploadResult.publicId;

    // 7. FIRESTORE PERSISTENCE
    const docRef = await db.collection("products").add({
      ...productData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ id: docRef.id, ...productData });
  } catch (err) {
    console.error("Error in createProduct:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Parse categories if it's a JSON string
    if (updateData.categories && typeof updateData.categories === "string") {
      updateData.categories = JSON.parse(updateData.categories);
    }

    if (typeof updateData.vehicleCompatibility === "string") {
      updateData.vehicleCompatibility = JSON.parse(
        updateData.vehicleCompatibility,
      );
    }

    if (updateData.isBundle !== undefined) {
      updateData.isBundle = updateData.isBundle === "true";
    }
    if (updateData.isSeasonal !== undefined) {
      updateData.isSeasonal = updateData.isSeasonal === "true";
    }
    if (updateData.compareAtPrice) {
      updateData.compareAtPrice = Number(updateData.compareAtPrice);
    }
    if (
      updateData.bundleContents &&
      typeof updateData.bundleContents === "string"
    ) {
      try {
        updateData.bundleContents = JSON.parse(updateData.bundleContents);
      } catch (e) {
        // If it's not JSON, treat as comma-separated string and split
        updateData.bundleContents = updateData.bundleContents
          .split(",")
          .map((item) => item.trim());
      }
    }

    const docRef = db.collection("products").doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const currentData = snapshot.data();

    const fullData = {
      ...currentData,
      ...updateData,
      vehicleCompatibility: {
        ...(currentData.vehicleCompatibility || {}),
        ...(updateData.vehicleCompatibility || {}),
      },
    };

    const updatedSearchTags = generateSearchTags(fullData);

    if (req.file) {
      const userId = updateData.sellerId || currentData.sellerId || "anonymous";
      const sanitizedName = (updateData.name || currentData.name)
        .replace(/\s+/g, "-")
        .toLowerCase();
      const publicId = `products/${userId}-${sanitizedName}`;
      const uploadResult = await uploadProductImage(req.file, publicId);
      updateData.imageUrl = uploadResult.url;
      updateData.cloudinaryId = uploadResult.publicId;
    }

    const finalUpdate = {
      ...updateData,
      searchTags: updatedSearchTags,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await docRef.update(finalUpdate);

    res.json({ id, ...finalUpdate });
  } catch (err) {
    console.error("Update Product Error:", err);
    res.status(500).json({ message: "Failed to update product" });
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
    res.status(500).json({ message: "Failed to fetch products by tag" });
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
    console.error("Increment View Count Error:", err);
    res.status(500).json({ message: "Failed to update view count" });
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
    console.error("Check stock error:", err);
    res.status(500).json({ message: "Failed to check stock" });
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
    console.error("Check multiple stock error:", err);
    res.status(500).json({ message: "Failed to check stock" });
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
    console.error("Get stock status error:", err);
    res.status(500).json({ message: "Failed to get stock status" });
  }
};

/**
 * Get stock status for all seller's products
 */
export const getSellerInventoryStatus = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res.status(400).json({ message: "Seller ID is required" });
    }

    const inventory = await getSellerStockStatus(sellerId);

    res.json({
      sellerId,
      totalProducts: inventory.length,
      outOfStockCount: inventory.filter((p) => p.isOutOfStock).length,
      lowStockCount: inventory.filter((p) => p.isLowStock).length,
      products: inventory,
    });
  } catch (err) {
    console.error("Get inventory status error:", err);
    res.status(500).json({ message: "Failed to get inventory status" });
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
    console.error("Add Rating Error:", err);
    res.status(500).json({ message: "Failed to add rating" });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const { id } = req.params; // Changed from productId to id to match route

    console.log("Getting reviews for product ID:", id);

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
      });
    });

    console.log(`Found ${reviews.length} reviews for product ${id}`);

    res.json(reviews);
  } catch (err) {
    console.error("Get Reviews Error:", err);
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

    console.log("Adding review:", {
      productId: id,
      rating,
      reviewText,
      buyerId,
      buyerName,
    });

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

    // ✅ VERIFY buyer has completed an order for this product
    // This prevents review spam and fake reviews
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

    // Create review document
    const review = {
      productId: id,
      buyerId: buyerId,
      buyerName: buyerName || "Anonymous",
      rating: Number(rating),
      reviewText: reviewText || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    console.log("Creating review document:", review);

    const reviewDoc = await db.collection("reviews").add(review);

    console.log("Review created with ID:", reviewDoc.id);

    // ✅ Update product ratings (NOT soldCount - that's done in completeOrder)
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

      console.log("Product ratings updated:", {
        ratingsCount: ratings.length,
        ratingAverage: Math.round(ratingAverage * 10) / 10,
      });
    }

    res.json({
      success: true,
      id: reviewDoc.id,
      ...review,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("Add Review Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to add review",
      error: err.message,
    });
  }
};
