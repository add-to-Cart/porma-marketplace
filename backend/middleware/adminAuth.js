import admin from "../config/firebaseAdmin.js";

const db = admin.firestore();

async function verifyAdminMiddleware(req, res, next) {
  try {
    // Get admin identifier from header or query
    const adminUsername =
      req.headers["x-admin-username"] || req.query.adminUsername;

    if (!adminUsername) {
      return res.status(401).json({ error: "Missing admin identifier" });
    }

    // Fetch admin from Firestore
    const snapshot = await db
      .collection("admins")
      .where("username", "==", adminUsername)
      .get();

    if (snapshot.empty) {
      return res.status(403).json({ error: "Admin not found" });
    }

    const adminData = snapshot.docs[0].data();

    // Attach admin info to request
    req.user = {
      username: adminData.username,
      email: adminData.email,
      role: adminData.role,
      isAdmin: true,
    };

    next();
  } catch (err) {
    console.error(
      "Admin auth middleware error:",
      err && err.message ? err.message : err,
    );
    return res.status(500).json({ error: "Server error" });
  }
}

export const verifyAdmin = verifyAdminMiddleware;
export default verifyAdminMiddleware;
