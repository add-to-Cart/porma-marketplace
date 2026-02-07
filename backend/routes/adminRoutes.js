import express from "express";
import { verifyAuth } from "../middleware/auth.js";
import {
  getAllUsers,
  getAllSellers,
  getTopSellers,
  getSellersWithProducts,
  getSalesAnalytics,
  updateUserStatus,
  getUserById,
  getSellerDetails,
} from "../controllers/adminController.js";

const router = express.Router();

// Protected admin endpoints
router.get("/users", verifyAuth, getAllUsers);
router.get("/users/:userId", verifyAuth, getUserById);
router.put("/users/:userId/status", verifyAuth, updateUserStatus);

router.get("/sellers", verifyAuth, getAllSellers);
router.get("/sellers/:sellerId", verifyAuth, getSellerDetails);
router.get("/sellers-with-products", verifyAuth, getSellersWithProducts);

router.get("/analytics/top-sellers", verifyAuth, getTopSellers);
router.get("/analytics/sales", verifyAuth, getSalesAnalytics);

export default router;
