import admin from "../config/firebaseAdmin.js";

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid Authorization header" });
    }

    if (!admin || !admin.auth) {
      return res.status(500).json({ error: "Firebase admin not initialized" });
    }

    // Extract token
    const idToken = authHeader.split(" ")[1];

    // Verify token
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Attach user info to request
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      isAdmin: decoded.admin === true || decoded.role === "admin",
      raw: decoded,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Exports
export const verifyAuth = authMiddleware;
export default authMiddleware;
