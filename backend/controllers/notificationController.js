// notificationController.js
import admin from "../config/firebaseAdmin.js";
const db = admin.firestore();

// Get user's notifications
export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.uid !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const snapshot = await db
      .collection("notifications")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    }));

    res.json(notifications);
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notifDoc = await db
      .collection("notifications")
      .doc(notificationId)
      .get();
    if (!notifDoc.exists) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notifDoc.data().userId !== req.user.uid) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await db.collection("notifications").doc(notificationId).update({
      read: true,
      readAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Mark as read error:", err);
    res.status(500).json({ message: "Failed to mark as read" });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notifDoc = await db
      .collection("notifications")
      .doc(notificationId)
      .get();
    if (!notifDoc.exists) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notifDoc.data().userId !== req.user.uid) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await db.collection("notifications").doc(notificationId).delete();

    res.json({ success: true });
  } catch (err) {
    console.error("Delete notification error:", err);
    res.status(500).json({ message: "Failed to delete notification" });
  }
};

// Clear all notifications
export const clearAllNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.uid !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const snapshot = await db
      .collection("notifications")
      .where("userId", "==", userId)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    res.json({ success: true });
  } catch (err) {
    console.error("Clear all notifications error:", err);
    res.status(500).json({ message: "Failed to clear notifications" });
  }
};

// Create notification (called internally when order status changes)
export const createNotification = async (
  userId,
  type,
  title,
  message,
  data = {},
) => {
  try {
    await db.collection("notifications").add({
      userId,
      type, // order_confirmed, payment_verified, order_shipped, order_delivered, product_review
      title,
      message,
      data,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error("Create notification error:", err);
  }
};

export default {
  getNotifications,
  markAsRead,
  deleteNotification,
  clearAllNotifications,
};
