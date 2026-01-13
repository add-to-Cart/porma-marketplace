import express from "express";
import {
  getAllProducts,
  getTrendingProducts,
  updateProduct,
  getProductById,
  createProduct,
  searchProducts,
} from "../controllers/productController.js";

const router = express.Router();

// 1. Static/Specific routes first
router.get("/", getAllProducts);
router.get("/search", searchProducts);
router.get("/trending", getTrendingProducts); // ADD THIS LINE HERE

// 2. Dynamic ID (Generic) routes last
router.get("/:id", getProductById);

router.post("/", createProduct);
router.patch("/:id", updateProduct);

export default router;
