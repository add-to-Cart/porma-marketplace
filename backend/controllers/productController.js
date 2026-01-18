import admin from "../config/firebaseAdmin.js";
const db = admin.firestore();
import { uploadProductImage } from "../services/cloudinary_service.js";

// productController.js

// 1. MARKETPLACE: Global Discovery with Metadata Awareness
export const getAllProducts = async (req, res) => {
  try {
    const { category, vehicleType, make, model, isBundle, isSeasonal } =
      req.query;
    let query = db.collection("products");

    // Metadata Filtering (Marketplace Constraints)
    if (category) query = query.where("category", "==", category);
    if (vehicleType)
      query = query.where("vehicleCompatibility.type", "==", vehicleType);
    // For specific vehicle filtering without a search keyword
    if (make)
      query = query.where("vehicleCompatibility.makes", "array-contains", make);

    // Default: Sort by newest (limit to reasonable number to avoid performance issues)
    const snapshot = await query.orderBy("createdAt", "desc").limit(100).get();

    let products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // In-memory filter for Model (since Firestore handles only 1 array-contains per query)
    if (model) {
      products = products.filter((p) =>
        p.vehicleCompatibility?.models?.includes(model),
      );
    }

    // In-memory filter for bundle/seasonal to avoid complex Firestore indexing
    if (isBundle === "true") {
      products = products.filter((p) => p.isBundle === true);
    }
    if (isSeasonal === "true") {
      products = products.filter((p) => p.isSeasonal === true);
    }

    res.json(products);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch marketplace", error: err.message });
  }
};

export const getTrendingProducts = async (req, res) => {
  try {
    const snapshot = await db
      .collection("products")
      .where("isAvailable", "==", true)
      .orderBy("soldCount", "desc") // Start with top sold
      .limit(50) // Fetch more to compute
      .get();

    let products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Compute trending score
    products = products.map((p) => {
      const sold = p.soldCount || 0;
      const views = p.viewCount || 0;
      const avgRating = p.rating || 0;
      const numRatings = p.ratingsCount || 0;

      // Credibility factor for ratings (based on number of ratings)
      const credibility = Math.min(numRatings / 5, 1); // Max at 5 ratings

      // Base score
      let score = sold * 1.0 + avgRating * 0.8 * credibility + views * 0.6;

      // Penalize bad products with high sales
      if (avgRating < 2.5 && sold > 20) {
        score *= 0.7;
      }

      return { ...p, trendingScore: score };
    });

    // Sort by score descending
    products.sort((a, b) => b.trendingScore - a.trendingScore);

    // Return top 8
    res.json(products.slice(0, 8));
  } catch (err) {
    console.error("TRENDING_ERROR:", err.message);
    res
      .status(500)
      .json({ message: "Failed to fetch trending", error: err.message });
  }
};

export const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params; // The current product ID to exclude
    const { category, make } = req.query;

    let query = db.collection("products");

    // 1. Filter by Category
    if (category) {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.limit(10).get();

    // 2. Map results and Filter out the current product in memory
    // and prioritize items that match the vehicle 'make'
    let related = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((p) => p.id !== id);

    if (make) {
      // Sort so products matching the same brand appear first
      related.sort((a, b) => {
        const aMatch = a.vehicleCompatibility?.makes?.includes(make);
        const bMatch = b.vehicleCompatibility?.makes?.includes(make);
        return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
      });
    }

    res.json(related.slice(0, 4)); // Return top 4
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch related products",
      error: err.message,
    });
  }
};

export const getProductsByTag = async (req, res) => {
  try {
    const { tag } = req.query;
    const snapshot = await db
      .collection("products")
      .where("tags", "array-contains", tag.toLowerCase())
      .limit(8)
      .get();

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch deals" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("products").doc(id);

    // Increment view count
    await docRef.update({
      viewCount: admin.firestore.FieldValue.increment(1),
    });

    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      id: snapshot.id,
      ...snapshot.data(),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

// Helper to generate search keywords for the Inverted Index
const generateSearchIndex = (data) => {
  const words = new Set();

  // 1. Add name parts
  data.name
    ?.toLowerCase()
    .split(/\s+/)
    .forEach((word) => words.add(word));

  // 2. Add category
  words.add(data.category?.toLowerCase());

  // 3. Add tags
  data.tags?.forEach((tag) => words.add(tag.toLowerCase()));

  // 4. Add vehicle details (Makes & Models)
  const comp = data.vehicleCompatibility;
  if (comp) {
    if (comp.isUniversalFit) {
      words.add("universal");
    } else {
      comp.makes?.forEach((make) => words.add(make.toLowerCase()));
      comp.models?.forEach((model) => words.add(model.toLowerCase()));
    }
    if (comp.type) words.add(comp.type.toLowerCase());
  }

  // 5. Add marketing flags
  if (data.isBundle) words.add("bundle");
  if (data.isSeasonal) words.add("seasonal");

  return Array.from(words).filter((word) => word && word.length > 1);
};

// Inside productController.js
export const createProduct = async (req, res) => {
  try {
    // req.body contains text fields; req.file contains the image
    const productData = { ...req.body };

    // Parse stringified nested objects if you sent them that way
    if (typeof productData.vehicleCompatibility === "string") {
      productData.vehicleCompatibility = JSON.parse(
        productData.vehicleCompatibility,
      );
    }
    if (typeof productData.tags === "string") {
      productData.tags = JSON.parse(productData.tags);
    }

    // Parse boolean and number fields
    if (productData.isBundle)
      productData.isBundle = productData.isBundle === "true";
    if (productData.isSeasonal)
      productData.isSeasonal = productData.isSeasonal === "true";
    if (productData.compareAtPrice)
      productData.compareAtPrice = Number(productData.compareAtPrice);

    // Initialize ratings
    productData.rating = 0;
    productData.ratingsCount = 0;
    productData.totalRating = 0;
    productData.viewCount = 0;
    productData.soldCount = 0;
    productData.isApproved = true; // For now, auto-approve

    // Generate search index
    productData.searchIndex = generateSearchIndex(productData);

    // Handle the image upload to Cloudinary
    if (req.file) {
      // Generate custom publicId - use a default userId or from body
      const userId = productData.sellerId || "anonymous";
      const sanitizedName = productData.name.replace(/\s+/g, "-").toLowerCase();
      const publicId = `products/${userId}-${sanitizedName}`;
      // You need to pass the file buffer to your Cloudinary service
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

    // 1. Apply simple equality filters (These work fine with array-contains-any)
    if (category)
      firestoreQuery = firestoreQuery.where("category", "==", category);
    if (vehicleType)
      firestoreQuery = firestoreQuery.where(
        "vehicleCompatibility.type",
        "==",
        vehicleType,
      );

    // 2. APPLY SEARCH (Uses array-contains-any)
    firestoreQuery = firestoreQuery.where(
      "searchIndex",
      "array-contains-any",
      keywords.slice(0, 10),
    );

    const snapshot = await firestoreQuery.get();
    let products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // 3. APPLY VEHICLE FILTERS IN-MEMORY
    // This bypasses the Firestore "multiple array filter" limitation
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

    // 4. APPLY BUNDLE/SEASONAL FILTERS IN-MEMORY
    if (isBundle === "true") {
      products = products.filter((p) => p.isBundle === true);
    }
    if (isSeasonal === "true") {
      products = products.filter((p) => p.isSeasonal === true);
    }

    if (model) {
      products = products.filter((p) =>
        p.vehicleCompatibility?.models?.includes(model),
      );
    }

    res.json(products);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ message: "Search failed", error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Parse stringified nested objects
    if (typeof updateData.vehicleCompatibility === "string") {
      updateData.vehicleCompatibility = JSON.parse(
        updateData.vehicleCompatibility,
      );
    }
    if (typeof updateData.tags === "string") {
      updateData.tags = JSON.parse(updateData.tags);
    }

    // Parse boolean and number fields
    if (updateData.isBundle !== undefined)
      updateData.isBundle = updateData.isBundle === "true";
    if (updateData.isSeasonal !== undefined)
      updateData.isSeasonal = updateData.isSeasonal === "true";
    if (updateData.compareAtPrice)
      updateData.compareAtPrice = Number(updateData.compareAtPrice);

    // 1. Get the existing product first to ensure we have the full data context
    const docRef = db.collection("products").doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const currentData = snapshot.data();

    // 2. Merge current data with incoming updates
    // This ensures generateSearchIndex has access to name/tags even if they weren't updated
    const fullDataForIndexing = {
      ...currentData,
      ...updateData,
      // Ensure compatibility is merged properly if it's a nested update
      vehicleCompatibility: {
        ...(currentData.vehicleCompatibility || {}),
        ...(updateData.vehicleCompatibility || {}),
      },
    };

    // 3. Re-generate the Search Index based on the merged data
    const updatedSearchIndex = generateSearchIndex(fullDataForIndexing);

    // 4. Prepare the final update payload
    const finalUpdate = {
      ...updateData,
      searchIndex: updatedSearchIndex,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // 5. Save to Firestore
    await docRef.update(finalUpdate);

    res.json({ id, ...finalUpdate });
  } catch (err) {
    console.error("Update Product Error:", err);
    res.status(500).json({ message: "Failed to update product" });
  }
};
