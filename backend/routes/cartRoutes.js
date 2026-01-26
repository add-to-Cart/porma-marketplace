import express from "express";
import admin from "../config/firebaseAdmin.js";
import { verifyAuth } from "../middleware/auth.js";

const router = express.Router();
const db = admin.firestore();

// Get user's cart
router.get("/:userId", verifyAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user can only access their own cart
    if (req.user.uid !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const cartDoc = await db.collection("carts").doc(userId).get();

    if (!cartDoc.exists) {
      return res.json({
        success: true,
        cart: {
          userId,
          items: [],
          updatedAt: new Date(),
        },
      });
    }

    res.json({
      success: true,
      cart: {
        userId,
        ...cartDoc.data(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get cart",
    });
  }
});

// Update user's cart
router.put("/:userId", verifyAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { items } = req.body;

    // Verify user can only update their own cart
    if (req.user.uid !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Items must be an array",
      });
    }

    const cartData = {
      userId,
      items,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("carts").doc(userId).set(cartData, { merge: true });

    res.json({
      success: true,
      message: "Cart updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update cart",
    });
  }
});

// Clear user's cart
router.delete("/:userId", verifyAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user can only clear their own cart
    if (req.user.uid !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await db.collection("carts").doc(userId).delete();

    res.json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
    });
  }
});

export default router;
