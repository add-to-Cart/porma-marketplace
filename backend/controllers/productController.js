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

export const createProduct = async (req, res) => {
  try {
    const data = req.body;

    // Normalization logic: ensure data is clean before saving
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

      // Structure the compatibility nested object
      vehicleCompatibility: {
        type: data.vehicleCompatibility?.type || "Universal",
        isUniversalFit: data.vehicleCompatibility?.isUniversalFit || false,
        makes: data.vehicleCompatibility?.makes || [],
        models: data.vehicleCompatibility?.models || [],
        yearRange: data.vehicleCompatibility?.yearRange || null,
      },

      // Clean tags and styles
      tags: (data.tags || []).map((t) => t.toLowerCase().trim()),
      styles: data.styles || [],
    };

    const newDoc = await db.collection("products").add(normalizedProduct);

    res.status(201).json({
      id: newDoc.id,
      ...normalizedProduct,
    });
  } catch (err) {
    console.error("Create Product Error:", err);
    res.status(500).json({ message: "Failed to create product" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;

    const ref = db.collection("products").doc(id);
    await ref.update(productData);

    res.json({ message: "Product updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update product" });
  }
};
