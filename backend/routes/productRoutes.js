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
} from "../controllers/productController.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Main routes
router.get("/", getAllProducts);
router.get("/search", searchProducts);
router.get("/trending", getTrendingProducts);
router.get("/deals", getDealsProducts); // New deals endpoint
router.get("/tags", getProductsByTag);

// Seller products
router.get("/seller/:sellerId", getProductsBySeller);

// Related products
router.get("/:id/related", getRelatedProducts);

// Product CRUD
router.get("/:id", getProductById);
router.post("/", upload.single("image"), createProduct);
router.patch("/:id", upload.single("image"), updateProduct);

export default router;
