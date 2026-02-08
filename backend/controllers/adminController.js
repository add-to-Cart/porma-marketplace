import admin from "../config/firebaseAdmin.js";
const db = admin.firestore();

export const getAllUsers = async (req, res) => {
  // Dev mode: Allow all requests
  // if (!req.user || !req.user.isAdmin) {
  //   return res.status(403).json({ error: "Forbidden" });
  // }
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(users);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: err.message });
  }
};

export const getAllSellers = async (req, res) => {
  // Dev mode: Allow all requests
  // if (!req.user || !req.user.isAdmin) {
  //   return res.status(403).json({ error: "Forbidden" });
  // }
  try {
    const snapshot = await db.collection("sellers").get();
    const sellers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(sellers);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch sellers", error: err.message });
  }
};

// Return top sellers by total sales. If seller doc doesn't include totalSales,
// compute from products collection as a fallback.
export const getTopSellers = async (req, res) => {
  // Dev mode: Allow all requests
  // if (!req.user || !req.user.isAdmin) {
  //   return res.status(403).json({ error: "Forbidden" });
  // }

  try {
    const limit = parseInt(req.query.limit) || 10;
    const sellersSnap = await db.collection("sellers").get();
    const sellers = await Promise.all(
      sellersSnap.docs.map(async (doc) => {
        const data = doc.data();
        const sellerId = doc.id;

        let totalSales = data.totalSales || 0;
        let totalProducts = data.totalProducts || 0;
        let averageRating = data.ratingAverage || data.averageRating || 0;

        // prepare product list and compute sales/ratings if missing
        let prods = [];
        if (!data.totalSales || !data.totalProducts) {
          const prodSnap = await db
            .collection("products")
            .where("sellerId", "==", sellerId)
            .get();
          prods = prodSnap.docs.map((p) => ({ id: p.id, ...p.data() }));
          totalProducts = prods.length;
          // compute total sales as revenue (price * soldCount)
          totalSales = prods.reduce(
            (s, p) => s + (p.soldCount || 0) * (p.price || 0),
            0,
          );
          if (!averageRating) {
            const ratings = prods
              .map((p) => p.ratingAverage || 0)
              .filter((r) => typeof r === "number");
            averageRating = ratings.length
              ? ratings.reduce((a, b) => a + b, 0) / ratings.length
              : 0;
          }
        } else {
          // if seller document already contains totals, still try to sample a product
          const prodSnap = await db
            .collection("products")
            .where("sellerId", "==", sellerId)
            .limit(1)
            .get();
          prods = prodSnap.docs.map((p) => ({ id: p.id, ...p.data() }));
        }

        // choose a representative product (top sold or latest)
        let sampleProduct = null;
        if (prods.length > 0) {
          // prefer highest soldCount, fallback to first
          const sortedProds = [...prods].sort(
            (a, b) => (b.soldCount || 0) - (a.soldCount || 0),
          );
          const p = sortedProds[0];
          sampleProduct = {
            id: p.id,
            name: p.name || p.productName || p.title || "",
            image: p.imageUrl || (p.images && p.images[0]) || null,
            soldCount: p.soldCount || 0,
          };
        }

        return {
          id: sellerId,
          storeName: data.storeName || data.name || "",
          ownerName: data.ownerName || data.owner || "",
          totalSales,
          totalProducts,
          averageRating,
          sampleProduct,
        };
      }),
    );

    const sorted = sellers
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit);
    res.json(sorted);
  } catch (err) {
    console.error("getTopSellers error:", err);
    res
      .status(500)
      .json({ message: "Failed to compute top sellers", error: err.message });
  }
};

// Get all sellers with their products and sales data
export const getSellersWithProducts = async (req, res) => {
  // Dev mode: Allow all requests
  // if (!req.user || !req.user.isAdmin) {
  //   return res.status(403).json({ error: "Forbidden" });
  // }

  try {
    const sellersSnap = await db.collection("sellers").get();
    const sellers = await Promise.all(
      sellersSnap.docs.map(async (doc) => {
        const sellerData = doc.data();
        const sellerId = doc.id;

        // Get all products for this seller
        const productsSnap = await db
          .collection("products")
          .where("sellerId", "==", sellerId)
          .get();

        const products = productsSnap.docs.map((pdoc) => {
          const pdata = pdoc.data();
          return {
            id: pdoc.id,
            name: pdata.name || pdata.productName || "",
            price: pdata.price || 0,
            stock: pdata.stock || 0,
            soldCount: pdata.soldCount || 0,
            ratingAverage: pdata.ratingAverage || 0,
            imageUrl:
              pdata.imageUrl || (pdata.images && pdata.images[0]) || null,
            totalRevenue: (pdata.price || 0) * (pdata.soldCount || 0),
          };
        });

        // Calculate totals
        const totalProducts = products.length;
        const totalSoldCount = products.reduce(
          (sum, p) => sum + p.soldCount,
          0,
        );
        const totalRevenue = products.reduce(
          (sum, p) => sum + p.totalRevenue,
          0,
        );
        const averageRating =
          products.length > 0
            ? products.reduce((sum, p) => sum + p.ratingAverage, 0) /
              products.length
            : 0;

        return {
          id: sellerId,
          storeName: sellerData.storeName || "Unknown Store",
          ownerName: sellerData.ownerName || "Unknown Owner",
          avatarUrl: sellerData.avatarUrl || null,
          status: sellerData.status || "active",
          totalProducts,
          totalSoldCount,
          totalRevenue,
          averageRating,
          products: products.sort((a, b) => b.soldCount - a.soldCount),
        };
      }),
    );

    const sorted = sellers.sort((a, b) => b.totalRevenue - a.totalRevenue);
    res.json(sorted);
  } catch (err) {
    console.error("getSellersWithProducts error:", err);
    res.status(500).json({
      message: "Failed to fetch sellers with products",
      error: err.message,
    });
  }
};

// Get admin dashboard sales analytics
export const getSalesAnalytics = async (req, res) => {
  // Dev mode: Allow all requests
  // if (!req.user || !req.user.isAdmin) {
  //   return res.status(403).json({ error: "Forbidden" });
  // }

  try {
    // Get all orders
    const ordersSnap = await db.collection("orders").get();
    const orders = ordersSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get all products
    const productsSnap = await db.collection("products").get();
    const products = productsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get all sellers
    const sellersSnap = await db.collection("sellers").get();
    const sellers = sellersSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate analytics
    const completedOrders = orders.filter((o) => o.status === "completed");
    const totalOrderValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const completedOrderValue = completedOrders.reduce(
      (sum, o) => sum + (o.total || 0),
      0,
    );
    const totalItemsSold = products.reduce(
      (sum, p) => sum + (p.soldCount || 0),
      0,
    );

    // Top performing products
    const topProducts = products
      .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        name: p.name || p.productName || "",
        soldCount: p.soldCount || 0,
        price: p.price || 0,
        revenue: (p.price || 0) * (p.soldCount || 0),
        sellerId: p.sellerId,
      }));

    // Top earning sellers
    const sellerEarnings = {};
    topProducts.forEach((p) => {
      if (!sellerEarnings[p.sellerId]) {
        sellerEarnings[p.sellerId] = { revenue: 0, soldCount: 0 };
      }
      sellerEarnings[p.sellerId].revenue += p.revenue;
      sellerEarnings[p.sellerId].soldCount += p.soldCount;
    });

    const topEarningSellers = Object.entries(sellerEarnings)
      .map(([sellerId, data]) => {
        const seller = sellers.find((s) => s.id === sellerId);
        return {
          sellerId,
          storeName: seller?.storeName || "Unknown",
          ...data,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      totals: {
        totalOrders: orders.length,
        completedOrders: completedOrders.length,
        pendingOrders: orders.filter((o) => o.status === "pending").length,
        totalOrderValue,
        completedOrderValue,
        totalItemsSold,
        totalProducts: products.length,
        totalSellers: sellers.length,
      },
      topProducts,
      topEarningSellers,
      chartData: {
        orders: orders.map((o) => ({
          id: o.id,
          total: o.total,
          status: o.status,
          date: o.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error("getSalesAnalytics error:", err);
    res.status(500).json({
      message: "Failed to compute sales analytics",
      error: err.message,
    });
  }
};

// User management: Restrict/Deactivate user account
export const updateUserStatus = async (req, res) => {
  // Dev mode: Allow all requests
  // if (!req.user || !req.user.isAdmin) {
  //   return res.status(403).json({ error: "Forbidden" });
  // }

  try {
    const { userId } = req.params;
    const { action, reason } = req.body; // action: 'deactivate', 'restrict', 'activate'

    if (!["deactivate", "restrict", "activate"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Build a small, consistent set of fields to update.
    const now = admin.firestore.FieldValue.serverTimestamp();
    const updates = { updatedAt: now };

    // Normalize state: status string + boolean flags for easier querying.
    if (action === "deactivate") {
      updates.status = "deactivated";
      updates.isActive = false;
      updates.isRestricted = false;
      updates.deactivationReason = reason || "Admin deactivation";
      updates.deactivatedAt = now;
    } else if (action === "restrict") {
      updates.status = "restricted";
      updates.isActive = false;
      updates.isRestricted = true;
      updates.restrictionReason = reason || "Account restricted";
      updates.restrictedAt = now;
    } else if (action === "activate") {
      updates.status = "active";
      updates.isActive = true;
      updates.isRestricted = false;
      updates.activatedAt = now;
    }

    // Apply to the user document (single, consistent write)
    await userRef.update(updates);

    // If this user has an associated seller document, mirror the minimal state there too.
    const userData = userDoc.data();
    if (userData.role === "seller") {
      const sellerRef = db.collection("sellers").doc(userId);
      const sellerDoc = await sellerRef.get();
      if (sellerDoc.exists) {
        const sellerUpdates = { updatedAt: now };
        // Mirror only the canonical fields to avoid duplicate/conflicting keys.
        sellerUpdates.status = updates.status;
        sellerUpdates.isActive = updates.isActive;
        sellerUpdates.isRestricted = updates.isRestricted;
        if (updates.deactivationReason)
          sellerUpdates.deactivationReason = updates.deactivationReason;
        if (updates.restrictionReason)
          sellerUpdates.restrictionReason = updates.restrictionReason;
        if (updates.deactivatedAt)
          sellerUpdates.deactivatedAt = updates.deactivatedAt;
        if (updates.restrictedAt)
          sellerUpdates.restrictedAt = updates.restrictedAt;
        if (updates.activatedAt)
          sellerUpdates.activatedAt = updates.activatedAt;

        await sellerRef.update(sellerUpdates);
      }
    }

    const updatedDoc = await userRef.get();
    res.json({
      message: `User ${action}d successfully`,
      user: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (err) {
    console.error("updateUserStatus error:", err);
    res.status(500).json({
      message: "Failed to update user status",
      error: err.message,
    });
  }
};

// Get user details
export const getUserById = async (req, res) => {
  // Dev mode: Allow all requests
  // if (!req.user || !req.user.isAdmin) {
  //   return res.status(403).json({ error: "Forbidden" });
  // }

  try {
    const { userId } = req.params;

    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: userDoc.id,
      ...userDoc.data(),
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch user details",
      error: err.message,
    });
  }
};

// Get seller details with analytics
export const getSellerDetails = async (req, res) => {
  // Dev mode: Allow all requests
  // if (!req.user || !req.user.isAdmin) {
  //   return res.status(403).json({ error: "Forbidden" });
  // }

  try {
    const { sellerId } = req.params;

    const sellerDoc = await db.collection("sellers").doc(sellerId).get();

    if (!sellerDoc.exists) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const sellerData = sellerDoc.data();

    // Get seller's products
    const productsSnap = await db
      .collection("products")
      .where("sellerId", "==", sellerId)
      .get();

    const products = productsSnap.docs.map((pdoc) => {
      const pdata = pdoc.data();
      return {
        id: pdoc.id,
        name: pdata.name || pdata.productName || "",
        price: pdata.price || 0,
        stock: pdata.stock || 0,
        soldCount: pdata.soldCount || 0,
        ratingAverage: pdata.ratingAverage || 0,
      };
    });

    // Get seller's orders
    const ordersSnap = await db.collection("orders").get();
    const sellerOrders = ordersSnap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((order) => order.items.some((item) => item.sellerId === sellerId))
      .map((order) => ({
        ...order,
        items: order.items.filter((item) => item.sellerId === sellerId),
      }));

    const totalRevenue = products.reduce(
      (sum, p) => sum + p.price * p.soldCount,
      0,
    );
    const totalSoldCount = products.reduce((sum, p) => sum + p.soldCount, 0);

    res.json({
      id: sellerDoc.id,
      ...sellerData,
      products,
      orders: sellerOrders,
      analytics: {
        totalProducts: products.length,
        totalRevenue,
        totalSoldCount,
        averageRating:
          products.length > 0
            ? products.reduce((sum, p) => sum + p.ratingAverage, 0) /
              products.length
            : 0,
        totalOrders: sellerOrders.length,
      },
    });
  } catch (err) {
    console.error("getSellerDetails error:", err);
    res.status(500).json({
      message: "Failed to fetch seller details",
      error: err.message,
    });
  }
};

// Get all pending seller applications
export const getSellerApplications = async (req, res) => {
  try {
    const snapshot = await db
      .collection("users")
      .where("sellerApplication.status", "==", "pending")
      .get();

    const applications = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      applications.push({
        uid: doc.id,
        email: data.email,
        displayName: data.displayName,
        username: data.username,
        photoURL: data.photoURL,
        contact: data.contact,
        sellerApplication: data.sellerApplication,
      });
    });

    res.json({
      success: true,
      applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Approve seller application
export const approveSellerApplication = async (req, res) => {
  try {
    const { userId } = req.params;

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const userData = userDoc.data();

    if (
      !userData.sellerApplication ||
      userData.sellerApplication.status !== "pending"
    ) {
      return res
        .status(400)
        .json({ success: false, message: "No pending application found" });
    }

    // Update user document
    await userRef.update({
      role: "seller",
      "sellerApplication.status": "approved",
      "sellerApplication.approvedAt":
        admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create seller document
    const sellerRef = db.collection("sellers").doc(userId);
    await sellerRef.set({
      uid: userId,
      email: userData.email,
      displayName: userData.displayName,
      username: userData.username || userData.displayName,
      storeName: userData.sellerApplication.storeName,
      storeDescription: userData.sellerApplication.storeDescription,
      paymentDetails: userData.sellerApplication.paymentDetails,
      photoURL: userData.photoURL || null,
      contact: userData.contact || null,
      status: "active",
      isActive: true,
      totalProducts: 0,
      totalSales: 0,
      ratingAverage: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updatedDoc = await userRef.get();
    res.json({
      success: true,
      message: "Application approved successfully",
      user: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error) {
    console.error("approveSellerApplication error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve application",
      error: error.message,
    });
  }
};

// Reject seller application
export const rejectSellerApplication = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const userData = userDoc.data();

    if (
      !userData.sellerApplication ||
      userData.sellerApplication.status !== "pending"
    ) {
      return res
        .status(400)
        .json({ success: false, message: "No pending application found" });
    }

    // Update user document
    await userRef.update({
      "sellerApplication.status": "rejected",
      "sellerApplication.rejectionReason":
        reason || "Application rejected by admin",
      "sellerApplication.rejectedAt":
        admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updatedDoc = await userRef.get();
    res.json({
      success: true,
      message: "Application rejected successfully",
      user: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error) {
    console.error("rejectSellerApplication error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject application",
      error: error.message,
    });
  }
};
