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
    // First try matching explicit `username` field
    let snap = await db
      .collection("users")
      .where("username", "==", identifier)
      .limit(1)
      .get();
    // If not found, fallback to `displayName` which some users may have
    if (snap.empty) {
      snap = await db
        .collection("users")
        .where("displayName", "==", identifier)
        .limit(1)
        .get();
    }
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
