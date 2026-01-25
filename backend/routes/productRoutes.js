import express from "express";
import multer from "multer";
import {
  getAllProducts,
  getTrendingProducts,
  getDealsProducts,
  updateProduct,
  getProductById,
  createProduct,
  searchProducts,
  getRelatedProducts,
  getProductsByTag,
  getProductsBySeller,
  incrementViewCount,
  addRating,
  addReview,
  getProductReviews,
} from "../controllers/productController.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Main routes (must be before :id routes)
router.get("/", getAllProducts);
router.get("/search", searchProducts);
router.get("/trending", getTrendingProducts);
router.get("/deals", getDealsProducts);
router.get("/tags", getProductsByTag);
router.get("/seller/:sellerId", getProductsBySeller);

// Specific :id routes (must be before generic /:id route)
router.get("/:id/related", getRelatedProducts);
router.get("/:id/reviews", getProductReviews);
router.patch("/:id/view", incrementViewCount);
router.post("/:id/rating", addRating);
router.post("/:id/review", addReview);

// Generic product CRUD (must be last)
router.get("/:id", getProductById);
router.post("/", upload.single("image"), createProduct);
router.patch("/:id", upload.single("image"), updateProduct);

export default router;
