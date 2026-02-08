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
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserById);
router.put("/users/:userId/status", updateUserStatus);

router.get("/sellers", getAllSellers);
router.get("/sellers/:sellerId", getSellerDetails);
router.get("/sellers-with-products", getSellersWithProducts);

router.get("/analytics/top-sellers", getTopSellers);
router.get("/analytics/sales", getSalesAnalytics);

export default router;
