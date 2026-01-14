import admin from "../config/firebaseAdmin.js";
const db = admin.firestore();

// productController.js

// 1. MARKETPLACE: Global Discovery with Metadata Awareness
export const getAllProducts = async (req, res) => {
  try {
    const { category, vehicleType, make, model } = req.query;
    let query = db.collection("products");

    // Metadata Filtering (Marketplace Constraints)
    if (category) query = query.where("category", "==", category);
    if (vehicleType)
      query = query.where("vehicleCompatibility.type", "==", vehicleType);

    // For specific vehicle filtering without a search keyword
    if (make)
      query = query.where("vehicleCompatibility.makes", "array-contains", make);

    // Default: Sort by newest
    const snapshot = await query.orderBy("createdAt", "desc").limit(50).get();

    let products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // In-memory filter for Model (since Firestore handles only 1 array-contains per query)
    if (model) {
      products = products.filter((p) =>
        p.vehicleCompatibility?.models?.includes(model)
      );
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
      .orderBy("viewCount", "desc") // Sorting by popularity
      .limit(8)
      .get();

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(products);
  } catch (err) {
    console.error("TRENDING_ERROR:", err.message); // Look at your terminal for this!
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
    res
      .status(500)
      .json({
        message: "Failed to fetch related products",
        error: err.message,
      });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db.collection("products").doc(id).get();

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
  return Array.from(words).filter((word) => word && word.length > 1);
};

export const createProduct = async (req, res) => {
  try {
    const data = req.body;

    const normalizedProduct = {
      name: data.name,
      description: data.description,
      category: data.category,
      price: parseFloat(data.price) || 0,
      stock: parseInt(data.stock) || 0,
      imageUrl: data.imageUrl || "/mockup.png",
      isAvailable: data.isAvailable ?? true,
      soldCount: 0,
      viewCount: 0,
      rating: 5.0,
      ratingsCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),

      vehicleCompatibility: {
        type: data.vehicleCompatibility?.type || "Universal",
        isUniversalFit: data.vehicleCompatibility?.isUniversalFit || false,
        makes: data.vehicleCompatibility?.makes || [],
        models: data.vehicleCompatibility?.models || [],
        yearRange: data.vehicleCompatibility?.yearRange || null,
      },

      tags: (data.tags || []).map((t) => t.toLowerCase().trim()),
      styles: data.styles || [],

      // --- NEW: THE SEARCH INDEX ---
      // This allows Firestore to perform O(1) keyword lookups
      searchIndex: generateSearchIndex(data),
    };

    const newDoc = await db.collection("products").add(normalizedProduct);
    res.status(201).json({ id: newDoc.id, ...normalizedProduct });
  } catch (err) {
    console.error("Create Product Error:", err);
    res.status(500).json({ message: "Failed to create product" });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const { query, category, vehicleType, make, model } = req.query;

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
        vehicleType
      );

    // 2. APPLY SEARCH (Uses array-contains-any)
    firestoreQuery = firestoreQuery.where(
      "searchIndex",
      "array-contains-any",
      keywords.slice(0, 10)
    );

    const snapshot = await firestoreQuery.get();
    let products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // 3. APPLY VEHICLE FILTERS IN-MEMORY
    // This bypasses the Firestore "multiple array filter" limitation
    if (make) {
      products = products.filter((p) =>
        p.vehicleCompatibility?.makes?.includes(make)
      );
    }

    if (model) {
      products = products.filter((p) =>
        p.vehicleCompatibility?.models?.includes(model)
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
