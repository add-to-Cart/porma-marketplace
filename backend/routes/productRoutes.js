import express from "express";
import {
  getAllProducts,
  getTrendingProducts,
  updateProduct,
  getProductById,
  createProduct,
  searchProducts,
  getRelatedProducts, // Import the new controller function
} from "../controllers/productController.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/search", searchProducts);
router.get("/trending", getTrendingProducts);

// FIX: Ensure the ID is passed as a parameter for related products
router.get("/:id/related", getRelatedProducts);

router.get("/:id", getProductById);
router.post("/", createProduct);
router.patch("//:id", updateProduct);

export default router;
