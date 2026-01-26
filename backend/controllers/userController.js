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
    res.status(500).json({ error: "Resolve failed" });
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
    res.status(500).json({ error: "Failed to fetch user" });
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
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
