import express from "express";
import {
  createOrder,
  getBuyerOrders,
  getSellerOrders,
  getOrder,
  updateOrderStatus,
  completeOrder,
  uploadPaymentProof,
  verifyPayment,
} from "../controllers/orderController.js";

const router = express.Router();

// Create an order
router.post("/", createOrder);

// Get buyer's orders
router.get("/buyer/:buyerId", getBuyerOrders);

// Get seller's orders
router.get("/seller/:sellerId", getSellerOrders);

// Get order by ID
router.get("/:orderId", getOrder);

// Update order status
router.patch("/:orderId", updateOrderStatus);

// Complete order and update ratings
router.patch("/:orderId/complete", completeOrder);

// Upload payment proof (buyer submits screenshot + reference)
router.post("/:orderId/payment-proof", uploadPaymentProof);

// Verify payment (seller accepts/rejects)
router.post("/:orderId/verify-payment", verifyPayment);

export default router;
