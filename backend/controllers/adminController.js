import admin from "../config/firebaseAdmin.js";
const db = admin.firestore();

export const getAllUsers = async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }
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
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }
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
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

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

        // If totalSales or totalProducts missing, compute from products
        if (!data.totalSales || !data.totalProducts) {
          const prodSnap = await db
            .collection("products")
            .where("sellerId", "==", sellerId)
            .get();
          const prods = prodSnap.docs.map((p) => ({ id: p.id, ...p.data() }));
          totalProducts = prods.length;
          totalSales = prods.reduce((s, p) => s + (p.soldCount || 0), 0);
          if (!averageRating) {
            const ratings = prods
              .map((p) => p.ratingAverage || 0)
              .filter((r) => typeof r === "number");
            averageRating = ratings.length
              ? ratings.reduce((a, b) => a + b, 0) / ratings.length
              : 0;
          }
        }

        // choose a representative product (top sold or latest)
        let sampleProduct = null;
        if (prods && prods.length > 0) {
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
