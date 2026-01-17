import express from "express";
import multer from "multer";
import {
  getAllProducts,
  getTrendingProducts,
  updateProduct,
  getProductById,
  createProduct,
  searchProducts,
  getRelatedProducts,
  getProductsByTag, // Import the new controller function
} from "../controllers/productController.js";

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get("/", getAllProducts);
router.get("/search", searchProducts);
router.get("/trending", getTrendingProducts);

// FIX: Ensure the ID is passed as a parameter for related products
router.get("/:id/related", getRelatedProducts);
router.get("/tags", getProductsByTag); // Alternative route for related products

router.get("/:id", getProductById);

// Remove the duplicate first line and keep ONLY the one with Multer
router.post("/", upload.single("image"), createProduct);

// Fix the extra slash here
router.patch("/:id", updateProduct);

export default router;
