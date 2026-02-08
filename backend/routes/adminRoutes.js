import express from "express";
import { verifyAdmin } from "../middleware/adminAuth.js";
import {
  getAllUsers,
  getAllSellers,
  getTopSellers,
  getSellersWithProducts,
  getSalesAnalytics,
  updateUserStatus,
  getUserById,
  getSellerDetails,
  getSellerApplications,
  approveSellerApplication,
  rejectSellerApplication,
} from "../controllers/adminController.js";

const router = express.Router();

// Protected admin endpoints
router.get("/users", verifyAdmin, getAllUsers);
router.get("/users/:userId", verifyAdmin, getUserById);
router.put("/users/:userId/status", verifyAdmin, updateUserStatus);

router.get("/sellers", verifyAdmin, getAllSellers);
router.get("/sellers/:sellerId", verifyAdmin, getSellerDetails);
router.get("/sellers-with-products", verifyAdmin, getSellersWithProducts);

router.get("/analytics/top-sellers", verifyAdmin, getTopSellers);
router.get("/analytics/sales", verifyAdmin, getSalesAnalytics);

// Seller applications
router.get("/applications", verifyAdmin, getSellerApplications);
router.post(
  "/applications/:userId/approve",
  verifyAdmin,
  approveSellerApplication,
);
router.post(
  "/applications/:userId/reject",
  verifyAdmin,
  rejectSellerApplication,
);

export default router;
