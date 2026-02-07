import express from "express";
import { verifyAuth } from "../middleware/auth.js";
import {
  syncAllSellerMetricsAdmin,
  recalculateSellerMetricsAdmin,
  verifyDataConsistencyAdmin,
  getSellerSalesTrendAdmin,
} from "../controllers/syncController.js";

const router = express.Router();

// Admin-only data synchronization endpoints
router.post("/sync-all-sellers", verifyAuth, syncAllSellerMetricsAdmin);
router.post(
  "/sync-seller/:sellerId",
  verifyAuth,
  recalculateSellerMetricsAdmin,
);
router.get("/verify-consistency", verifyAuth, verifyDataConsistencyAdmin);
router.get("/seller-trend/:sellerId", verifyAuth, getSellerSalesTrendAdmin);

export default router;
