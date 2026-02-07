import admin from "../config/firebaseAdmin.js";

const db = admin.firestore();

/**
 * Synchronously update seller metrics when a product is sold
 * This ensures product sales and seller revenue are always in sync
 */
export const syncSellerMetricsOnSale = async (sellerId, quantity, revenue) => {
  try {
    const sellerRef = db.collection("sellers").doc(sellerId);
    const sellerDoc = await sellerRef.get();

    if (sellerDoc.exists) {
      const seller = sellerDoc.data();
      await sellerRef.update({
        totalSales: (seller.totalSales || 0) + quantity,
        totalRevenue: (seller.totalRevenue || 0) + revenue,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error("Error syncing seller metrics:", err);
    throw err;
  }
};

/**
 * Calculate actual sales metrics from products collection
 * Used to verify or rebuild seller metrics if out of sync
 */
export const recalculateSellerMetrics = async (sellerId) => {
  try {
    const productsSnap = await db
      .collection("products")
      .where("sellerId", "==", sellerId)
      .get();

    let totalSales = 0;
    let totalRevenue = 0;
    let productCount = 0;

    productsSnap.forEach((doc) => {
      const product = doc.data();
      const soldCount = product.soldCount || 0;
      const price = product.price || 0;

      totalSales += soldCount;
      totalRevenue += price * soldCount;
      productCount += 1;
    });

    // Update seller with calculated metrics
    const sellerRef = db.collection("sellers").doc(sellerId);
    await sellerRef.update({
      totalSales,
      totalRevenue,
      totalProducts: productCount,
      lastMetricsSync: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      sellerId,
      totalSales,
      totalRevenue,
      productCount,
    };
  } catch (err) {
    console.error("Error recalculating seller metrics:", err);
    throw err;
  }
};

/**
 * Sync all sellers' metrics
 * Rebuilds seller sales and revenue from product data
 */
export const syncAllSellerMetrics = async () => {
  try {
    const sellersSnap = await db.collection("sellers").get();
    const results = [];

    for (const sellerDoc of sellersSnap.docs) {
      const sellerId = sellerDoc.id;
      const result = await recalculateSellerMetrics(sellerId);
      results.push(result);
    }

    return {
      success: true,
      syncedSellers: results.length,
      details: results,
    };
  } catch (err) {
    console.error("Error syncing all seller metrics:", err);
    throw err;
  }
};

/**
 * Verify data consistency between orders, products, and sellers
 */
export const verifyDataConsistency = async () => {
  try {
    const report = {
      totalOrders: 0,
      totalProductSales: 0,
      totalSellerSales: 0,
      inconsistencies: [],
    };

    // Get all orders
    const ordersSnap = await db.collection("orders").get();
    const completedOrders = ordersSnap.docs.filter(
      (doc) => doc.data().status === "completed",
    );
    report.totalOrders = completedOrders.length;

    // Calculate total sales from orders
    let ordersTotalSales = 0;
    completedOrders.forEach((doc) => {
      const order = doc.data();
      order.items?.forEach((item) => {
        ordersTotalSales += item.quantity || 0;
      });
    });
    report.ordersTotalSales = ordersTotalSales;

    // Get total sales from products
    const productsSnap = await db.collection("products").get();
    let productsTotalSales = 0;
    productsSnap.forEach((doc) => {
      productsTotalSales += doc.data().soldCount || 0;
    });
    report.productsTotalSales = productsTotalSales;

    // Get total sales from sellers
    const sellersSnap = await db.collection("sellers").get();
    let sellersTotalSales = 0;
    sellersSnap.forEach((doc) => {
      sellersTotalSales += doc.data().totalSales || 0;
    });
    report.sellersTotalSales = sellersTotalSales;

    // Check for inconsistencies
    if (productsTotalSales !== sellersTotalSales) {
      report.inconsistencies.push({
        type: "PRODUCT_SELLER_MISMATCH",
        message: `Products totalSales (${productsTotalSales}) != Sellers totalSales (${sellersTotalSales})`,
      });
    }

    if (ordersTotalSales !== productsTotalSales) {
      report.inconsistencies.push({
        type: "ORDER_PRODUCT_MISMATCH",
        message: `Orders totalSales (${ordersTotalSales}) != Products totalSales (${productsTotalSales})`,
      });
    }

    return report;
  } catch (err) {
    console.error("Error verifying data consistency:", err);
    throw err;
  }
};

/**
 * Get seller sales trends (useful for admin dashboard)
 */
export const getSellerSalesTrend = async (sellerId, daysBack = 30) => {
  try {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - daysBack);

    const ordersSnap = await db.collection("orders").get();
    const relevantOrders = ordersSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((order) => {
        const orderDate =
          order.createdAt?.toDate?.() || new Date(order.createdAt);
        return (
          orderDate >= daysAgo &&
          order.items.some((item) => item.sellerId === sellerId) &&
          order.status === "completed"
        );
      });

    // Group by date
    const trend = {};
    relevantOrders.forEach((order) => {
      const orderDate =
        order.createdAt?.toDate?.() || new Date(order.createdAt);
      const dateKey = orderDate.toISOString().split("T")[0];

      if (!trend[dateKey]) {
        trend[dateKey] = { sales: 0, revenue: 0 };
      }

      order.items
        .filter((item) => item.sellerId === sellerId)
        .forEach((item) => {
          trend[dateKey].sales += item.quantity || 0;
          trend[dateKey].revenue += (item.price || 0) * (item.quantity || 0);
        });
    });

    return trend;
  } catch (err) {
    console.error("Error getting seller sales trend:", err);
    throw err;
  }
};
