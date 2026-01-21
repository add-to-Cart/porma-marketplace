import admin from "../config/firebaseAdmin.js";

// Create or update user document
export const createOrUpdateUser = async (req, res) => {
  try {
    const db = admin.firestore();
    const uid = req.user.uid;
    const payload = req.body || {};
    const userRef = db.collection("users").doc(uid);
    await userRef.set(
      {
        uid,
        email: payload.email || req.user.email || null,
        username: payload.username || payload.email?.split("@")[0] || null,
        ...payload,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    const snap = await userRef.get();
    res.json({ id: snap.id, ...snap.data() });
  } catch (err) {
    console.error("Error saving user:", err);
    res.status(500).json({ error: "Failed to save user" });
  }
};

// Resolve email from username
export const resolveEmail = async (req, res) => {
  const { identifier } = req.query;
  if (!identifier) return res.status(400).json({ error: "Missing identifier" });
  try {
    if (identifier.includes("@")) return res.json({ email: identifier });
    const db = admin.firestore();
    const snap = await db
      .collection("users")
      .where("username", "==", identifier)
      .limit(1)
      .get();
    if (snap.empty) return res.status(404).json({ error: "Not found" });
    const data = snap.docs[0].data();
    res.json({ email: data.email });
  } catch (err) {
    console.error("Error resolving email:", err);
    res.status(500).json({ error: "Resolve failed" });
  }
};

// Get current user's view history
export const getViewHistory = async (req, res) => {
  try {
    const db = admin.firestore();
    const uid = req.user.uid;
    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("viewHistory")
      .orderBy("viewedAt", "desc")
      .limit(100)
      .get();
    const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ entries });
  } catch (err) {
    console.error("Error fetching view history:", err);
    res.status(500).json({ error: "Failed to fetch view history" });
  }
};

// Append/update view history
export const addViewHistory = async (req, res) => {
  try {
    const db = admin.firestore();
    const uid = req.user.uid;
    const { productId, payload } = req.body || {};
    if (!productId) return res.status(400).json({ error: "Missing productId" });
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("viewHistory")
      .doc(productId);
    await ref.set(
      {
        viewedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(payload || {}),
      },
      { merge: true },
    );
    const snap = await ref.get();
    res.json({ id: snap.id, ...snap.data() });
  } catch (err) {
    console.error("Error writing view history:", err);
    res.status(500).json({ error: "Failed to write view history" });
  }
};

// List followers
export const getFollowers = async (req, res) => {
  try {
    const { uid } = req.params;
    const limit = Number(req.query.limit) || 100;
    const db = admin.firestore();
    const snap = await db
      .collectionGroup("follows")
      .where(admin.firestore.FieldPath.documentId(), "==", uid)
      .limit(limit)
      .get();

    const followers = snap.docs.map((d) => {
      const parent = d.ref.parent;
      const userDoc = parent.parent;
      return {
        followerId: userDoc.id,
        ...d.data(),
      };
    });

    res.json({ followers });
  } catch (err) {
    console.error("Error fetching followers:", err);
    res.status(500).json({ error: "Failed to fetch followers" });
  }
};

// List following
export const getFollowing = async (req, res) => {
  try {
    const { uid } = req.params;
    const limit = Number(req.query.limit) || 100;
    const db = admin.firestore();
    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("follows")
      .orderBy("followedAt", "desc")
      .limit(limit)
      .get();

    const following = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ following });
  } catch (err) {
    console.error("Error fetching following:", err);
    res.status(500).json({ error: "Failed to fetch following" });
  }
};

// Get follow counts
export const getFollowCounts = async (req, res) => {
  try {
    const { uid } = req.params;
    const db = admin.firestore();
    const followersSnap = await db
      .collectionGroup("follows")
      .where(admin.firestore.FieldPath.documentId(), "==", uid)
      .get();
    const followingSnap = await db
      .collection("users")
      .doc(uid)
      .collection("follows")
      .get();

    res.json({
      followers: followersSnap.size,
      following: followingSnap.size,
    });
  } catch (err) {
    console.error("Error fetching follow counts:", err);
    res.status(500).json({ error: "Failed to fetch follow counts" });
  }
};

// Get user by uid
export const getUserById = async (req, res) => {
  try {
    const { uid } = req.params;
    const db = admin.firestore();
    const snap = await db.collection("users").doc(uid).get();
    if (!snap.exists) return res.status(404).json({ error: "User not found" });
    const userData = { id: snap.id, ...snap.data() };
    const sellerSnap = await db.collection("sellers").doc(uid).get();
    if (sellerSnap.exists) userData.seller = sellerSnap.data();
    res.json(userData);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Follow user
export const followUser = async (req, res) => {
  try {
    const db = admin.firestore();
    const uid = req.user.uid;
    const { targetId } = req.body || {};
    if (!targetId) return res.status(400).json({ error: "Missing targetId" });
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("follows")
      .doc(targetId);
    await ref.set({ followedAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ ok: true });
  } catch (err) {
    console.error("Error following user:", err);
    res.status(500).json({ error: "Failed to follow" });
  }
};

// Unfollow user
export const unfollowUser = async (req, res) => {
  try {
    const db = admin.firestore();
    const uid = req.user.uid;
    const { targetId } = req.params;
    if (!targetId) return res.status(400).json({ error: "Missing targetId" });
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("follows")
      .doc(targetId);
    await ref.delete();
    res.json({ ok: true });
  } catch (err) {
    console.error("Error unfollowing user:", err);
    res.status(500).json({ error: "Failed to unfollow" });
  }
};

// Check if following
export const isFollowing = async (req, res) => {
  try {
    const db = admin.firestore();
    const uid = req.user.uid;
    const { targetId } = req.query;
    if (!targetId) return res.status(400).json({ error: "Missing targetId" });
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("follows")
      .doc(targetId);
    const snap = await ref.get();
    res.json({ following: snap.exists });
  } catch (err) {
    console.error("Error checking following:", err);
    res.status(500).json({ error: "Failed to check following" });
  }
};

// Garage: Get user's vehicles
export const getGarage = async (req, res) => {
  try {
    const db = admin.firestore();
    const uid = req.user.uid;
    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("garage")
      .orderBy("addedAt", "desc")
      .get();
    const vehicles = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ vehicles });
  } catch (err) {
    console.error("Error fetching garage:", err);
    res.status(500).json({ error: "Failed to fetch garage" });
  }
};

// Garage: Add vehicle
export const addVehicleToGarage = async (req, res) => {
  try {
    const db = admin.firestore();
    const uid = req.user.uid;
    const vehicleData = req.body || {};
    if (!vehicleData.make || !vehicleData.model || !vehicleData.year) {
      return res.status(400).json({ error: "Missing make, model, or year" });
    }
    const ref = db.collection("users").doc(uid).collection("garage").doc();
    await ref.set({
      ...vehicleData,
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).json({ id: ref.id, ...vehicleData });
  } catch (err) {
    console.error("Error adding vehicle:", err);
    res.status(500).json({ error: "Failed to add vehicle" });
  }
};

// Garage: Remove vehicle
export const removeVehicleFromGarage = async (req, res) => {
  try {
    const db = admin.firestore();
    const uid = req.user.uid;
    const { vehicleId } = req.params;
    if (!vehicleId) return res.status(400).json({ error: "Missing vehicleId" });
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("garage")
      .doc(vehicleId);
    await ref.delete();
    res.json({ success: true });
  } catch (err) {
    console.error("Error removing vehicle:", err);
    res.status(500).json({ error: "Failed to remove vehicle" });
  }
};

// Wishlist: Get user's wishlist
export const getWishlist = async (req, res) => {
  try {
    const db = admin.firestore();
    const uid = req.user.uid;
    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("wishlist")
      .orderBy("addedAt", "desc")
      .get();
    const wishlist = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    // Optionally fetch full product details
    const productIds = wishlist.map((item) => item.productId);
    if (productIds.length > 0) {
      const productsSnap = await db
        .collection("products")
        .where(
          admin.firestore.FieldPath.documentId(),
          "in",
          productIds.slice(0, 10),
        )
        .get();
      const productsMap = {};
      productsSnap.docs.forEach((doc) => {
        productsMap[doc.id] = { id: doc.id, ...doc.data() };
      });
      wishlist.forEach((item) => {
        item.product = productsMap[item.productId] || null;
      });
    }
    res.json({ wishlist });
  } catch (err) {
    console.error("Error fetching wishlist:", err);
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
};

// Wishlist: Add product
export const addToWishlist = async (req, res) => {
  try {
    const db = admin.firestore();
    const uid = req.user.uid;
    const { productId } = req.body || {};
    if (!productId) return res.status(400).json({ error: "Missing productId" });
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("wishlist")
      .doc(productId);
    await ref.set({
      productId,
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Error adding to wishlist:", err);
    res.status(500).json({ error: "Failed to add to wishlist" });
  }
};

// Wishlist: Remove product
export const removeFromWishlist = async (req, res) => {
  try {
    const db = admin.firestore();
    const uid = req.user.uid;
    const { productId } = req.params;
    if (!productId) return res.status(400).json({ error: "Missing productId" });
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("wishlist")
      .doc(productId);
    await ref.delete();
    res.json({ success: true });
  } catch (err) {
    console.error("Error removing from wishlist:", err);
    res.status(500).json({ error: "Failed to remove from wishlist" });
  }
};

export const applySeller = async (req, res) => {
  try {
    const db = admin.firestore();
    const uid = req.user.uid;
    const { storeName, storeDescription } = req.body;

    if (!storeName) {
      return res
        .status(400)
        .json({ success: false, message: "Store name is required" });
    }

    // Prevent already-approved sellers from applying again
    if (req.user && req.user.role === "seller") {
      return res
        .status(400)
        .json({ success: false, message: "You are already a seller" });
    }

    // Prevent duplicate pending applications
    if (
      req.user &&
      req.user.sellerApplication &&
      req.user.sellerApplication.status === "pending"
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Application already pending" });
    }

    // Persist application on the user's document for admin review
    await db
      .collection("users")
      .doc(uid)
      .update({
        sellerApplication: {
          status: "pending",
          storeName,
          storeDescription: storeDescription || null,
          appliedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      });

    res.json({ success: true, message: "Application submitted" });
  } catch (err) {
    console.error("Apply Seller Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
