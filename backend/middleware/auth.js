import admin from "../config/firebaseAdmin.js";

// Development mode: Simple auth middleware - no token verification
async function authMiddleware(req, res, next) {
  try {
    // Skip token verification entirely
    // Just attach a basic user object to allow requests through

    const uid = req.headers["x-user-id"] || "dev-user";
    const email = req.headers["x-user-email"] || "dev@example.com";
    const role = req.headers["x-user-role"] || "buyer";

    req.user = {
      uid: uid,
      email: email,
      role: role,
      isAdmin: role === "admin",
    };

    next();
  } catch (err) {
    // Allow request to proceed even on error in dev mode
    console.error(
      "Auth middleware error (ignored in dev):",
      err && err.message ? err.message : err,
    );
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
