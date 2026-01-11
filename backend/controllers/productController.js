import admin from "../config/firebaseAdmin.js";
const db = admin.firestore();

export const getAllProducts = async (req, res) => {
  try {
    const snapshot = await db.collection("products").get();

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
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
    comp.makes?.forEach((make) => words.add(make.toLowerCase()));
    comp.models?.forEach((model) => words.add(model.toLowerCase()));
    if (comp.type) words.add(comp.type.toLowerCase());
  }

  // Remove empty strings or very short words (optional)
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

// --- NEW: SEARCH FUNCTION WITH MULTI-CRITERIA RANKING ---
export const searchProducts = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const searchTerm = query.toLowerCase().trim();

    // 1. Efficient Retrieval: O(1) per keyword match using Firestore Index
    const snapshot = await db
      .collection("products")
      .where("searchIndex", "array-contains", searchTerm)
      .limit(50)
      .get();

    let products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // 2. Multi-Criteria Ranking (The "Number 2" Logic)
    // We manually score results to ensure the most relevant item is first
    products = products.map((product) => {
      let score = 0;

      // Exact name match (Weight: 10)
      if (product.name.toLowerCase() === searchTerm) score += 10;
      else if (product.name.toLowerCase().includes(searchTerm)) score += 5;

      // Vehicle match (Weight: 8)
      const isVehicleMatch = product.vehicleCompatibility?.models.some(
        (m) => m.toLowerCase() === searchTerm
      );
      if (isVehicleMatch) score += 8;

      // Tag match (Weight: 5)
      if (product.tags?.includes(searchTerm)) score += 5;

      return { ...product, searchScore: score };
    });

    // Sort by score descending
    products.sort((a, b) => b.searchScore - a.searchScore);

    res.json(products);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ message: "Search failed" });
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
