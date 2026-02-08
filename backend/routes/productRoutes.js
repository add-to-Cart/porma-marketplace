import express from "express";
import multer from "multer";
import { verifyAuth } from "../middleware/auth.js";
import {
  getAllProducts,
  getTrendingProducts,
  getTrendingProductsBySeller,
  getDealsProducts,
  getProductById,
  searchProducts,
  getRelatedProducts,
  getProductsByTag,
  getProductsBySeller,
  incrementViewCount,
  addRating,
  addReview,
  getProductReviews,
  checkProductStock,
  checkMultipleStock,
  getProductStockStatus,
} from "../controllers/buyerProductController.js";
import {
  createProduct,
  updateProduct,
  replyToReview,
  getSellerInventoryStatus,
} from "../controllers/sellerProductController.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Main routes (must be before :id routes)
router.get("/", getAllProducts);
router.get("/search", searchProducts);
router.get("/trending", getTrendingProducts);
router.get("/seller/:sellerId/trending", getTrendingProductsBySeller);
router.get("/deals", getDealsProducts);
router.get("/tags", getProductsByTag);
router.get("/seller/:sellerId", getProductsBySeller);

// CRITICAL: Specific :id routes MUST come before generic /:id route
// Review routes - THESE MUST BE BEFORE /:id
router.get("/:id/reviews", getProductReviews);
router.post("/:id/review", addReview);
router.put("/reviews/:reviewId/reply", verifyAuth, replyToReview);

// Other specific :id routes
router.get("/:id/related", getRelatedProducts);
router.patch("/:id/view", incrementViewCount);
router.post("/:id/rating", addRating);

// Generic product CRUD (MUST BE LAST)
router.get("/:id", getProductById);
router.post("/", upload.single("image"), createProduct);
router.patch("/:id", upload.single("image"), updateProduct);

// Stock management routes
router.get("/:id/stock", checkProductStock);
router.post("/check-stock", checkMultipleStock);
router.get("/:id/stock-status", getProductStockStatus);
router.get("/seller/:sellerId/inventory", getSellerInventoryStatus);

export default router;
