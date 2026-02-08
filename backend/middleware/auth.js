import admin from "../config/firebaseAdmin.js";

// Development mode: Auth middleware that decodes Bearer token
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let uid = req.headers["x-user-id"];
    let email = req.headers["x-user-email"];
    let role = req.headers["x-user-role"] || "buyer";

    // If Bearer token provided, decode it
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        uid = decoded.uid;
        email = decoded.email;
        // Get user role from Firestore if available
        const userDoc = await admin
          .firestore()
          .collection("users")
          .doc(uid)
          .get();
        if (userDoc.exists) {
          role = userDoc.data().role || "buyer";
        }
      } catch (tokenErr) {
        console.warn(
          "Token decode error (continuing with headers):",
          tokenErr.message,
        );
        // Continue with fallback to headers
      }
    }

    // Use headers as fallback if token didn't decode
    if (!uid) uid = req.headers["x-user-id"] || "dev-user";
    if (!email) email = req.headers["x-user-email"] || "dev@example.com";

    req.user = {
      uid: uid,
      email: email,
      role: role,
      isAdmin: role === "admin",
    };

    next();
  } catch (err) {
    console.error(
      "Auth middleware error:",
      err && err.message ? err.message : err,
    );
    // Allow request to proceed even on error in dev mode
    req.user = {
      uid: "dev-user",
      email: "dev@example.com",
      role: "buyer",
      isAdmin: false,
    };
    next();
  }
}

// Exports
export const verifyAuth = authMiddleware;
export default authMiddleware;
