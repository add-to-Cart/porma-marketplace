import express from "express";
import {
  getAllProducts,
  updateProduct,
  getProductById,
  createProduct,
  searchProducts,
} from "../controllers/productController.js";

const router = express.Router();

// 1. Static/Specific routes first
router.get("/", getAllProducts);
router.get("/search", searchProducts); // MOVED THIS UP

// 2. Dynamic ID routes last
router.get("/:id", getProductById);

router.post("/", createProduct);
router.patch("/:id", updateProduct);

export default router;
