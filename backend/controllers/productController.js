import admin from "../config/firebaseAdmin.js";
const db = admin.firestore();
import { uploadProductImage } from "../services/cloudinary_service.js";
import { getTrendingProducts as calculateTrendingProducts } from "../utils/trendingAlgorithm.js";

// Helper function to populate seller information for products
const populateSellerInfo = async (products) => {
  // Get unique seller IDs
  const sellerIds = [
    ...new Set(products.map((p) => p.sellerId).filter((id) => id)),
  ];

  if (sellerIds.length === 0) return products;

  // Batch fetch seller documents
  const sellerPromises = sellerIds.map((id) =>
    db.collection("users").doc(id).get(),
  );
  const sellerDocs = await Promise.all(sellerPromises);

  // Create seller info map
  const sellerMap = {};
  sellerDocs.forEach((doc, index) => {
    if (doc.exists) {
      const sellerData = doc.data();
      const sellerId = sellerIds[index];

      // Check for approved seller profile first
      if (sellerData.role === "seller" && sellerData.seller) {
        sellerMap[sellerId] = {
          storeName: sellerData.seller.storeName,
          owner: sellerData.seller.storeName,
        };
      }
      // If no approved seller profile, check for pending application
      else if (sellerData.sellerApplication?.status === "pending") {
        sellerMap[sellerId] = {
          storeName: sellerData.sellerApplication.storeName,
          owner: sellerData.sellerApplication.storeName,
        };
      }
      // Fallback to display name
      else {
        sellerMap[sellerId] = {
          storeName: sellerData.displayName || "Unknown Seller",
          owner: sellerData.displayName || "Unknown Seller",
        };
      }
    }
  });

  // Merge seller info into products
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

  // 1. Add name parts
  if (data.name) {
    data.name
      .toLowerCase()
      .split(/\s+/)
      .forEach((word) => {
        if (word.length > 1) tags.add(word);
      });
  }

  // 2. Add category
  if (data.category) tags.add(data.category.toLowerCase());

  // 3. Add vehicle details
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

  // 4. Add bundle/seasonal flags
  if (data.isBundle) tags.add("bundle");
  if (data.isSeasonal) tags.add("seasonal");

  // 5. Add seasonal category if exists
  if (data.seasonalCategory) {
    tags.add(data.seasonalCategory.toLowerCase());
  }

  return Array.from(tags).filter((tag) => tag && tag.length > 1);
};

// 1. MARKETPLACE: Latest to Oldest (exclude bundles)
export const getAllProducts = async (req, res) => {
  try {
    const { category, vehicleType, make, model, isBundle, isSeasonal } =
      req.query;
    let query = db.collection("products");

    // Filter out bundles for marketplace
    if (isBundle !== "true") {
      query = query.where("isBundle", "==", false);
    }

    // Metadata Filtering
    if (category) query = query.where("category", "==", category);
    if (vehicleType) {
      query = query.where("vehicleCompatibility.type", "==", vehicleType);
    }

    // Sort by newest first (latest to oldest)
    const snapshot = await query.orderBy("createdAt", "desc").limit(100).get();

    let products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

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

    // Populate seller information
    products = await populateSellerInfo(products);

    res.json(products);
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
    // Get all available products (including bundles)
    const snapshot = await db
      .collection("products")
      .limit(200) // Get a larger set to rank
      .get();

    let products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Normalize data before scoring
    products = products.map((p) => {
      // Calculate average from ratings array if ratingAverage is missing
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

    // Use the new trending algorithm to rank products
    const trendingProducts = calculateTrendingProducts(products, 20);

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
      .where("isAvailable", "==", true)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const seasonalSnapshot = await db
      .collection("products")
      .where("isSeasonal", "==", true)
      .where("isAvailable", "==", true)
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

// Get products by seller
export const getProductsBySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res
        .status(400)
        .json({ message: "sellerId parameter is required" });
    }

    const snapshot = await db
      .collection("products")
      .where("sellerId", "==", sellerId)
      .get();

    let products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort in memory by createdAt desc
    products.sort((a, b) => {
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bTime - aTime;
    });

    // Populate seller information
    const productsWithSeller = await populateSellerInfo(products);

    return res.json(productsWithSeller);
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

    let query = db.collection("products").where("isBundle", "==", false); // Exclude bundles

    if (category) {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.limit(50).get();

    let related = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((p) => p.id !== id);

    // Prioritize products from the same store first
    related.sort((a, b) => {
      // Same store has highest priority
      const aSameStore = a.sellerId === sellerId ? 1 : 0;
      const bSameStore = b.sellerId === sellerId ? 1 : 0;
      if (aSameStore !== bSameStore) return bSameStore - aSameStore;

      // Then prioritize by make
      if (make) {
        const aMatch = a.vehicleCompatibility?.makes?.includes(make) ? 1 : 0;
        const bMatch = b.vehicleCompatibility?.makes?.includes(make) ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
      }

      // Finally, sort by soldCount (most popular)
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

// Get product by ID
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
          // Check for approved seller profile first
          if (sellerData.role === "seller" && sellerData.seller) {
            sellerInfo = {
              storeName: sellerData.seller.storeName,
              owner: sellerData.seller.storeName,
            };
          }
          // If no approved seller profile, check for pending application
          else if (sellerData.sellerApplication?.status === "pending") {
            sellerInfo = {
              storeName: sellerData.sellerApplication.storeName,
              owner: sellerData.sellerApplication.storeName,
            };
          }
          // Fallback to display name
          else {
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
      ...sellerInfo, // Merge seller info into product data
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

    // Simple equality filters
    if (category) {
      firestoreQuery = firestoreQuery.where("category", "==", category);
    }
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

// Create product
export const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    // Parse stringified objects
    if (typeof productData.vehicleCompatibility === "string") {
      productData.vehicleCompatibility = JSON.parse(
        productData.vehicleCompatibility,
      );
    }

    // Parse boolean fields
    if (productData.isBundle) {
      productData.isBundle = productData.isBundle === "true";
    }
    if (productData.isSeasonal) {
      productData.isSeasonal = productData.isSeasonal === "true";
    }
    if (productData.compareAtPrice) {
      productData.compareAtPrice = Number(productData.compareAtPrice);
    }

    // Initialize metrics
    productData.rating = 0;
    productData.ratingAverage = 0;
    productData.ratingsCount = 0;
    productData.totalRating = 0;
    productData.viewCount = 0;
    productData.soldCount = 0;
    productData.isAvailable = true;

    // Generate searchTags (unified field)
    productData.searchTags = generateSearchTags(productData);

    // Handle image upload
    if (req.file) {
      const userId = productData.sellerId || "anonymous";
      const sanitizedName = productData.name.replace(/\s+/g, "-").toLowerCase();
      const publicId = `products/${userId}-${sanitizedName}`;
      const uploadResult = await uploadProductImage(req.file, publicId);
      productData.imageUrl = uploadResult.url;
      productData.cloudinaryId = uploadResult.publicId;
    }

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

    // Parse stringified objects
    if (typeof updateData.vehicleCompatibility === "string") {
      updateData.vehicleCompatibility = JSON.parse(
        updateData.vehicleCompatibility,
      );
    }

    // Parse boolean fields
    if (updateData.isBundle !== undefined) {
      updateData.isBundle = updateData.isBundle === "true";
    }
    if (updateData.isSeasonal !== undefined) {
      updateData.isSeasonal = updateData.isSeasonal === "true";
    }
    if (updateData.compareAtPrice) {
      updateData.compareAtPrice = Number(updateData.compareAtPrice);
    }

    // Get existing product
    const docRef = db.collection("products").doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const currentData = snapshot.data();

    // Merge data for searchTags generation
    const fullData = {
      ...currentData,
      ...updateData,
      vehicleCompatibility: {
        ...(currentData.vehicleCompatibility || {}),
        ...(updateData.vehicleCompatibility || {}),
      },
    };

    // Regenerate searchTags
    const updatedSearchTags = generateSearchTags(fullData);

    // Handle image upload if new file provided
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

    // Prepare final update
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
