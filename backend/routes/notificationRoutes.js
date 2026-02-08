// routes/notificationRoutes.js
import express from "express";
import {
  getNotifications,
  markAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/notificationController.js";
import { verifyAuth } from "../middleware/auth.js";

const router = express.Router();

// Get user's notifications
router.get("/:userId", verifyAuth, getNotifications);

// Mark notification as read
router.patch("/:notificationId/read", verifyAuth, markAsRead);

// Delete notification
router.delete("/:notificationId", verifyAuth, deleteNotification);

// Clear all notifications
router.delete("/:userId/clear", verifyAuth, clearAllNotifications);

export default router;
