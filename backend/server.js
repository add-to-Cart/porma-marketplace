import express from "express";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import syncRoutes from "./routes/syncRoutes.js";

import cors from "cors";

const app = express();
const PORT = 3002;

console.log("[STARTUP] Initializing Express app...");

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
  }),
);

// Set Cross-Origin-Opener-Policy to allow popups for Firebase Auth
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

console.log("[STARTUP] Middleware initialized");

// Routes
try {
  console.log("[STARTUP] Loading routes...");
  app.use("/products", productRoutes);
  app.use("/auth", authRoutes);
  app.use("/", authRoutes);
  app.use("/orders", orderRoutes);
  app.use("/cart", cartRoutes);
  app.use("/notifications", notificationRoutes);
  app.use("/test", testRoutes);
  app.use("/admin", adminRoutes);
  app.use("/analytics", analyticsRoutes);
  app.use("/seller", sellerRoutes);
  app.use("/sync", syncRoutes);
  console.log("[STARTUP] All routes loaded successfully");
} catch (routeErr) {
  console.error("[FATAL] Error loading routes:", routeErr);
  process.exit(1);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(
    "[ERROR] Express middleware error:",
    err && err.message ? err.message : err,
  );
  res.status(500).json({ error: "Internal server error" });
});

// Unhandled promise rejection handler
process.on("unhandledRejection", (reason, promise) => {
  console.error("[FATAL] Unhandled Rejection:", reason);
});

// Uncaught exception handler
process.on("uncaughtException", (error) => {
  console.error("[FATAL] Uncaught Exception:", error);
});

console.log("[STARTUP] Starting HTTP listener on port " + PORT);

const server = app.listen(PORT, () => {
  console.log(`[SUCCESS] Server running on port ${PORT}`);
  console.log("[SUCCESS] Server is ready to accept connections");
});

// Handle server errors
server.on("error", (err) => {
  console.error("[FATAL] Server error:", err);
  process.exit(1);
});

console.log("[STARTUP] Initialization complete - server should be listening");

export default app;
