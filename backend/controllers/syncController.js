import admin from "../config/firebaseAdmin.js";
import {
  syncAllSellerMetrics,
  recalculateSellerMetrics,
  verifyDataConsistency,
  getSellerSalesTrend,
} from "../services/syncService.js";

const db = admin.firestore();

/**
 * Admin endpoint to manually sync all seller metrics
 * This rebuilds seller sales and revenue from product data
 */
export const syncAllSellerMetricsAdmin = async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const result = await syncAllSellerMetrics();
    res.json({
      message: "All seller metrics synced successfully",
      ...result,
    });
  } catch (err) {
    console.error("Error syncing seller metrics:", err);
    res.status(500).json({
      message: "Failed to sync seller metrics",
      error: err.message,
    });
  }
};

/**
 * Admin endpoint to recalculate metrics for a specific seller
 */
export const recalculateSellerMetricsAdmin = async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res.status(400).json({ message: "Seller ID is required" });
    }

    const result = await recalculateSellerMetrics(sellerId);
    res.json({
      message: `Metrics recalculated for seller ${sellerId}`,
      ...result,
    });
  } catch (err) {
    console.error("Error recalculating seller metrics:", err);
    res.status(500).json({
      message: "Failed to recalculate seller metrics",
      error: err.message,
    });
  }
};

/**
 * Admin endpoint to verify data consistency across collections
 */
export const verifyDataConsistencyAdmin = async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const report = await verifyDataConsistency();
    res.json({
      message: "Data consistency check completed",
      ...report,
      isConsistent: report.inconsistencies.length === 0,
    });
  } catch (err) {
    console.error("Error verifying data consistency:", err);
    res.status(500).json({
      message: "Failed to verify data consistency",
      error: err.message,
    });
  }
};

/**
 * Admin endpoint to get seller sales trends
 */
export const getSellerSalesTrendAdmin = async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const { sellerId } = req.params;
    const { daysBack } = req.query;

    if (!sellerId) {
      return res.status(400).json({ message: "Seller ID is required" });
    }

    const trend = await getSellerSalesTrend(sellerId, parseInt(daysBack) || 30);
    res.json({
      sellerId,
      daysBack: parseInt(daysBack) || 30,
      trend,
    });
  } catch (err) {
    console.error("Error getting seller sales trend:", err);
    res.status(500).json({
      message: "Failed to fetch seller sales trend",
      error: err.message,
    });
  }
};
