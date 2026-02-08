import express from "express";
import { getTopSellers } from "../controllers/adminController.js";
import {
  getLeadingStores,
  getTrendingProducts,
  getSellerSummary,
} from "../controllers/analyticsController.js";
import { verifyAuth } from "../middleware/auth.js";

const router = express.Router();

// Public analytics endpoints (read-only)
router.get("/top-sellers", getTopSellers);

// Authenticated analytics endpoints
router.get("/leading-stores", verifyAuth, getLeadingStores);
router.get("/trending-products", verifyAuth, getTrendingProducts);
router.get("/seller-summary/:sellerId", verifyAuth, getSellerSummary);

// Smoke endpoint: run core analytics handlers and return a small summary
router.get("/smoke", verifyAuth, async (req, res) => {
  try {
    const invoke = (handler) =>
      new Promise(async (resolve) => {
        const fakeRes = {
          status: () => fakeRes,
          json: (payload) => resolve(payload),
        };
        await handler(req, fakeRes);
      });

    const top = await invoke(getTopSellers);
    const leading = await invoke(getLeadingStores);
    const trending = await invoke(getTrendingProducts);

    res.json({
      success: true,
      topCount: Array.isArray(top) ? top.length : top?.length || 0,
      leadingCount: leading?.total || 0,
      trendingCount: trending?.total || 0,
    });
  } catch (err) {
    console.error("/analytics/smoke error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
