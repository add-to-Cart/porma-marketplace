import admin from "../config/firebaseAdmin.js";

const db = admin.firestore();

// Get leading stores (top sellers by sales/orders)
export const getLeadingStores = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    // Get all sellers from `sellers` collection if present, otherwise `users` with role 'seller'
    const sellersRef = db.collection("sellers");
    const sellersSnap = await sellersRef.get();
    const sellers = sellersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Fallback: if sellers collection is empty, query users with role 'seller'
    if (sellers.length === 0) {
      const usersSnap = await db
        .collection("users")
        .where("role", "==", "seller")
        .get();
      usersSnap.forEach((d) => sellers.push({ id: d.id, ...d.data() }));
    }

    const storeStats = [];

    for (const s of sellers) {
      const sellerId = s.id;
      const sellerData = s;

      // Skip inactive sellers
      if (sellerData.isActive === false) continue;

      // Aggregate products for this seller
      const productsSnap = await db
        .collection("products")
        .where("sellerId", "==", sellerId)
        .get();

      let totalSales = 0;
      let totalProducts = 0;
      let totalRatings = 0;
      let ratingCount = 0;

      productsSnap.forEach((pdoc) => {
        const p = pdoc.data();
        totalProducts += 1;
        totalSales += (p.soldCount || 0) * (p.price || 0);
        if (p.ratingAverage && p.ratingsCount) {
          totalRatings += p.ratingAverage * p.ratingsCount;
          ratingCount += p.ratingsCount;
        }
      });

      // Count completed/delivered orders that include this seller via items array
      const ordersSnap = await db.collection("orders").get();
      let totalOrders = 0;
      ordersSnap.forEach((odoc) => {
        const order = odoc.data();
        const items = Array.isArray(order.items) ? order.items : [];
        if (
          items.some((it) => it.sellerId === sellerId) &&
          ["completed", "delivered"].includes(order.status)
        ) {
          totalOrders += 1;
        }
      });

      const avgRating = ratingCount > 0 ? totalRatings / ratingCount : 0;

      storeStats.push({
        sellerId,
        storeName:
          sellerData.storeName ||
          sellerData.seller?.storeName ||
          sellerData.displayName ||
          "Unknown",
        totalSales,
        totalOrders,
        totalProducts,
        avgRating: Math.round(avgRating * 10) / 10,
        score: totalSales + totalOrders * 100 + avgRating * 500,
      });
    }

    storeStats.sort((a, b) => b.score - a.score);
    const leadingStores = storeStats.slice(0, limit);

    return res.json({
      success: true,
      stores: leadingStores,
      total: storeStats.length,
    });
  } catch (err) {
    console.error("Error fetching leading stores:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leading stores",
      error: err.message,
    });
  }
};

// Get trending products (across all sellers or specific seller)
export const getTrendingProducts = async (req, res) => {
  try {
    const sellerId = req.query.sellerId;
    const limit = parseInt(req.query.limit) || 10;
    const timeframe = parseInt(req.query.timeframe) || 30; // days

    let productsQuery = db.collection("products");

    // Filter by seller if specified
    if (sellerId) {
      productsQuery = productsQuery.where("sellerId", "==", sellerId);
    }

    const productsSnapshot = await productsQuery.get();

    const trendingProducts = [];
    const now = Date.now();
    const timeframeMs = timeframe * 24 * 60 * 60 * 1000;

    productsSnapshot.forEach((doc) => {
      const product = doc.data();
      const createdAt = product.createdAt?._seconds
        ? product.createdAt._seconds * 1000
        : product.createdAt?.seconds
          ? product.createdAt.seconds * 1000
          : now;

      const ageInDays = (now - createdAt) / (24 * 60 * 60 * 1000);

      // Only include products within timeframe
      if (ageInDays <= timeframe) {
        // Calculate trending score
        const soldCount = product.soldCount || 0;
        const viewCount = product.viewCount || 0;
        const ratingBonus =
          (product.ratingAverage || 0) * (product.ratingsCount || 0);

        // Weight recent activity more heavily
        const recencyMultiplier = Math.max(0.1, 1 - ageInDays / timeframe);

        const score =
          (soldCount * 10 + viewCount * 0.1 + ratingBonus * 2) *
          recencyMultiplier;

        trendingProducts.push({
          id: doc.id,
          productName: product.name,
          name: product.name,
          sellerId: product.sellerId,
          storeName: product.storeName,
          soldCount,
          viewCount,
          ratingAverage: product.ratingAverage || 0,
          ratingsCount: product.ratingsCount || 0,
          price: product.price,
          imageUrl: product.imageUrl,
          trendingData: {
            score: Math.round(score * 100) / 100,
            ageInDays: Math.round(ageInDays),
            recencyMultiplier: Math.round(recencyMultiplier * 100) / 100,
          },
        });
      }
    });

    // Sort by trending score
    trendingProducts.sort(
      (a, b) => b.trendingData.score - a.trendingData.score,
    );

    return res.json({
      success: true,
      products: trendingProducts.slice(0, limit),
      total: trendingProducts.length,
    });
  } catch (err) {
    console.error("Error fetching trending products:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trending products",
      error: err.message,
    });
  }
};

// Get seller analytics summary
export const getSellerSummary = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Verify the user is requesting their own data or is admin
    if (req.user.uid !== sellerId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get seller data
    const sellerDoc = await db.collection("users").doc(sellerId).get();
    if (!sellerDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    const sellerData = sellerDoc.data();

    // Get products
    const productsSnapshot = await db
      .collection("products")
      .where("sellerId", "==", sellerId)
      .get();

    let totalProducts = 0;
    let totalSales = 0;
    let totalViews = 0;
    let totalRatings = 0;
    let ratingCount = 0;

    productsSnapshot.forEach((doc) => {
      const product = doc.data();
      totalProducts++;
      totalViews += product.viewCount || 0;
      totalSales += (product.soldCount || 0) * (product.price || 0);

      if (product.ratingAverage && product.ratingsCount) {
        totalRatings += product.ratingAverage * product.ratingsCount;
        ratingCount += product.ratingsCount;
      }
    });

    // Get orders
    const ordersSnapshot = await db
      .collection("orders")
      .where("sellerId", "==", sellerId)
      .get();

    let completedOrders = 0;
    let pendingOrders = 0;

    ordersSnapshot.forEach((doc) => {
      const order = doc.data();
      if (order.status === "completed" || order.status === "delivered") {
        completedOrders++;
      } else if (
        order.status === "pending" ||
        order.paymentStatus === "pending_verification"
      ) {
        pendingOrders++;
      }
    });

    const avgRating = ratingCount > 0 ? totalRatings / ratingCount : 0;

    return res.json({
      success: true,
      summary: {
        storeName:
          sellerData.storeName ||
          sellerData.seller?.storeName ||
          sellerData.displayName,
        totalProducts,
        totalSales,
        totalViews,
        avgRating: Math.round(avgRating * 10) / 10,
        totalOrders: ordersSnapshot.size,
        completedOrders,
        pendingOrders,
        isActive: sellerData.isActive !== false,
        isRestricted: sellerData.isRestricted === true,
      },
    });
  } catch (err) {
    console.error("Error fetching seller summary:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch seller summary",
      error: err.message,
    });
  }
};
