// utils/stockManagement.js
import admin from "../config/firebaseAdmin.js";

let db;
try {
  const app = admin.app();
  if (app) {
    db = admin.firestore();
  }
} catch (error) {
  console.warn(
    "[WARNING] Firebase not initialized, stock management will use dummy data",
  );
  db = null;
}

/**
 * Check if sufficient stock is available
 */
export const checkStockAvailability = async (productId, quantity) => {
  try {
    if (!db) {
      // Dev mode without Firebase
      return {
        available: true,
        availableStock: 999,
        product: "Default Product",
      };
    }
    const doc = await db.collection("products").doc(productId).get();

    if (!doc.exists) {
      return { available: false, reason: "Product not found" };
    }

    const product = doc.data();
    const availableStock = product.stock || 0;

    if (availableStock < quantity) {
      return {
        available: false,
        reason: `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`,
        availableStock,
      };
    }

    return {
      available: true,
      availableStock,
      product: product.name,
    };
  } catch (err) {
    console.error("Stock check error:", err);
    return { available: false, reason: "Error checking stock" };
  }
};

/**
 * Check stock for multiple items
 */
export const checkMultipleProductsStock = async (items) => {
  const results = [];
  const insufficientItems = [];

  for (const item of items) {
    const result = await checkStockAvailability(item.id, item.quantity);
    results.push({
      ...item,
      ...result,
    });

    if (!result.available) {
      insufficientItems.push({
        productId: item.id,
        productName: item.name,
        requested: item.quantity,
        available: result.availableStock || 0,
      });
    }
  }

  return {
    allAvailable: insufficientItems.length === 0,
    insufficientItems,
    results,
  };
};

/**
 * Reserve stock for a pending order
 */
export const reserveStock = async (session, productId, quantity) => {
  if (!db) {
    // Dev mode without Firebase
    return;
  }
  const productRef = db.collection("products").doc(productId);
  const productDoc = await productRef.get();

  if (!productDoc.exists) {
    throw new Error(`Product ${productId} not found`);
  }

  const product = productDoc.data();
  const currentStock = product.stock || 0;

  if (currentStock < quantity) {
    throw new Error(
      `Insufficient stock for product. Available: ${currentStock}, Requested: ${quantity}`,
    );
  }

  session.update(productRef, {
    stock: currentStock - quantity,
    reservedStock: (product.reservedStock || 0) + quantity,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

/**
 * Release reserved stock back to available
 */
export const releaseReservedStock = async (session, productId, quantity) => {
  if (!db) {
    // Dev mode without Firebase
    return;
  }
  const productRef = db.collection("products").doc(productId);
  const productDoc = await productRef.get();

  if (!productDoc.exists) {
    throw new Error(`Product ${productId} not found`);
  }

  const product = productDoc.data();
  const currentStock = product.stock || 0;
  const reservedStock = product.reservedStock || 0;

  session.update(productRef, {
    stock: currentStock + quantity,
    reservedStock: Math.max(0, reservedStock - quantity),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

/**
 * Finalize stock after order completion
 */
export const finalizeOrderStock = async (session, productId, quantity) => {
  if (!db) {
    // Dev mode without Firebase
    return;
  }
  const productRef = db.collection("products").doc(productId);
  const productDoc = await productRef.get();

  if (!productDoc.exists) {
    throw new Error(`Product ${productId} not found`);
  }

  const product = productDoc.data();
  const reservedStock = product.reservedStock || 0;
  const currentSoldCount = product.soldCount || 0;

  session.update(productRef, {
    reservedStock: Math.max(0, reservedStock - quantity),
    soldCount: currentSoldCount + quantity,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

/**
 * Get stock status for a product
 */
export const getStockStatus = async (productId) => {
  try {
    if (!db) {
      // Dev mode without Firebase
      return {
        productId,
        productName: "Default",
        availableStock: 999,
        reservedStock: 0,
        totalStock: 999,
        soldCount: 0,
        isLowStock: false,
        isOutOfStock: false,
      };
    }
    const doc = await db.collection("products").doc(productId).get();

    if (!doc.exists) {
      return null;
    }

    const product = doc.data();

    return {
      productId,
      productName: product.name,
      availableStock: product.stock || 0,
      reservedStock: product.reservedStock || 0,
      totalStock: (product.stock || 0) + (product.reservedStock || 0),
      soldCount: product.soldCount || 0,
      isLowStock: (product.stock || 0) < 5,
      isOutOfStock: (product.stock || 0) === 0,
    };
  } catch (err) {
    console.error("Get stock status error:", err);
    return null;
  }
};

/**
 * Get stock status for all seller's products
 */
export const getSellerStockStatus = async (sellerId) => {
  try {
    if (!db) {
      // Dev mode without Firebase
      return [];
    }
    const snapshot = await db
      .collection("products")
      .where("sellerId", "==", sellerId)
      .get();

    const products = [];
    snapshot.forEach((doc) => {
      const product = doc.data();
      const availableStock = product.stock || 0;
      const reservedStock = product.reservedStock || 0;

      products.push({
        productId: doc.id,
        productName: product.name,
        category: product.category,
        price: product.price,
        availableStock,
        reservedStock,
        totalStock: availableStock + reservedStock,
        soldCount: product.soldCount || 0,
        isLowStock: availableStock < 5,
        isOutOfStock: availableStock === 0,
      });
    });

    // Sort by low stock first
    products.sort((a, b) => {
      if (a.isOutOfStock && !b.isOutOfStock) return -1;
      if (!a.isOutOfStock && b.isOutOfStock) return 1;
      if (a.isLowStock && !b.isLowStock) return -1;
      if (!a.isLowStock && b.isLowStock) return 1;
      return a.availableStock - b.availableStock;
    });

    return products;
  } catch (err) {
    console.error("Get seller stock status error:", err);
    return [];
  }
};

/**
 * Restock a product
 */
export const restockProduct = async (productId, additionalQuantity) => {
  try {
    if (!db) {
      // Dev mode without Firebase
      return { success: true, newStock: additionalQuantity };
    }
    const productRef = db.collection("products").doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      throw new Error(`Product ${productId} not found`);
    }

    const product = productDoc.data();
    const currentStock = product.stock || 0;

    await productRef.update({
      stock: currentStock + additionalQuantity,
      restockHistory: admin.firestore.FieldValue.arrayUnion({
        quantity: additionalQuantity,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      newStock: currentStock + additionalQuantity,
    };
  } catch (err) {
    console.error("Restock error:", err);
    return { success: false, error: err.message };
  }
};

export default {
  checkStockAvailability,
  checkMultipleProductsStock,
  reserveStock,
  releaseReservedStock,
  finalizeOrderStock,
  getStockStatus,
  getSellerStockStatus,
  restockProduct,
};
