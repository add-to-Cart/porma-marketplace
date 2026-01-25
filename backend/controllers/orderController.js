// ============================================
// FIXED: orderController.js with Stock Management
// ============================================

import admin from "../config/firebaseAdmin.js";
import { createNotification } from "./notificationController.js";

const db = admin.firestore();

// Create an order from cart items
export const createOrder = async (req, res) => {
  const batch = admin.firestore().batch(); // ✅ FIXED: Use admin.firestore().batch()

  try {
    const {
      buyerId,
      items,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      deliveryDetails,
    } = req.body;

    if (!buyerId || !items || items.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ CRITICAL: Reserve stock immediately when order is created
    // This prevents overselling before payment
    for (const item of items) {
      const productRef = db.collection("products").doc(item.id);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        return res.status(404).json({
          message: `Product ${item.name} not found`,
        });
      }

      const product = productDoc.data();
      const currentStock = product.stock || 0;

      // Check if sufficient stock
      if (currentStock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${item.quantity}`,
        });
      }

      // Reserve stock (subtract from available)
      batch.update(productRef, {
        stock: currentStock - item.quantity,
        reservedStock: (product.reservedStock || 0) + item.quantity,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const order = {
      buyerId,
      items: items.map((item) => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price || item.price,
        imageUrl: item.imageUrl,
        sellerId: item.sellerId,
        storeName: item.storeName,
      })),
      subtotal,
      deliveryFee,
      total,
      paymentMethod: paymentMethod || "cod",
      // Payment proof fields
      paymentProofUrl: null,
      paymentReferenceNumber: null,
      paymentProofUploadedAt: null,
      paymentVerifiedAt: null,
      paymentVerifiedBy: null,
      // Delivery details
      deliveryDetails: deliveryDetails || {},
      // Stock tracking
      stockReserved: true,
      stockReleased: false,
      // Timestamps
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      // Status fields
      status: paymentMethod === "cod" ? "pending" : "awaiting_payment",
      paymentStatus: paymentMethod === "cod" ? "cod" : "pending_proof",
      deliveryStatus: "processing",
      buyerNotified: false,
    };

    const docRef = db.collection("orders").doc();
    batch.set(docRef, order);

    // Commit all stock updates and order creation together
    await batch.commit();

    // ✅ Notify sellers about new order
    const sellers = [...new Set(items.map((i) => i.sellerId))];
    for (const sellerId of sellers) {
      const sellerItems = items.filter((i) => i.sellerId === sellerId);
      const sellerTotal = sellerItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0,
      );

      await createNotification(
        sellerId,
        "order_confirmed",
        "New Order Received",
        `You have a new order #${docRef.id.slice(-8).toUpperCase()} for ₱${sellerTotal.toLocaleString()}`,
        {
          orderId: docRef.id,
          buyerId,
          itemCount: sellerItems.length,
        },
      );
    }

    res.json({
      id: docRef.id,
      ...order,
    });
  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
};

// Verify payment and confirm stock reservation
export const verifyPayment = async (req, res) => {
  const batch = admin.firestore().batch(); // ✅ FIXED

  try {
    const { orderId } = req.params;
    const { verified, sellerId, rejectionReason } = req.body;

    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderDoc.data();

    // Check if seller owns this order
    const sellerOwnsOrder = order.items.some(
      (item) => item.sellerId === sellerId,
    );
    if (!sellerOwnsOrder) {
      return res
        .status(403)
        .json({ message: "Unauthorized to verify this order" });
    }

    const orderRef = db.collection("orders").doc(orderId);

    if (verified) {
      // ✅ Payment accepted - keep stock reserved (don't change it)
      batch.update(orderRef, {
        paymentStatus: "verified",
        status: "pending",
        paymentVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentVerifiedBy: sellerId,
        buyerNotified: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Notify buyer
      await createNotification(
        order.buyerId,
        "payment_verified",
        "Payment Confirmed",
        `Your payment of ₱${order.total.toLocaleString()} has been confirmed. Your order is being prepared.`,
        { orderId },
      );
    } else {
      // ✅ Payment rejected - RELEASE reserved stock back
      for (const item of order.items) {
        const productRef = db.collection("products").doc(item.productId);
        const productDoc = await productRef.get();

        if (productDoc.exists) {
          const product = productDoc.data();
          const currentStock = product.stock || 0;
          const reservedStock = product.reservedStock || 0;

          // Return stock to available
          batch.update(productRef, {
            stock: currentStock + item.quantity,
            reservedStock: Math.max(0, reservedStock - item.quantity),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      batch.update(orderRef, {
        paymentStatus: "rejected",
        status: "payment_rejected",
        paymentRejectionReason:
          rejectionReason || "Payment could not be verified",
        paymentRejectedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentRejectedBy: sellerId,
        stockReleased: true,
        buyerNotified: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Notify buyer
      await createNotification(
        order.buyerId,
        "payment_rejected",
        "Payment Rejected",
        `Your payment could not be verified. Reason: ${rejectionReason || "Payment not found"}. Stock has been released.`,
        { orderId },
      );
    }

    await batch.commit();

    const updatedDoc = await db.collection("orders").doc(orderId).get();
    res.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
    });
  } catch (err) {
    console.error("Verify Payment Error:", err);
    res.status(500).json({ message: "Failed to verify payment" });
  }
};

// Complete order and finalize stock
export const completeOrder = async (req, res) => {
  const batch = admin.firestore().batch(); // ✅ FIXED

  try {
    const { orderId } = req.params;

    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderDoc.data();
    const orderRef = db.collection("orders").doc(orderId);

    // ✅ Finalize stock: decrement from reserved, add to soldCount
    for (const item of order.items) {
      const productRef = db.collection("products").doc(item.productId);
      const productDoc = await productRef.get();

      if (productDoc.exists) {
        const product = productDoc.data();
        const reservedStock = product.reservedStock || 0;
        const currentSoldCount = product.soldCount || 0;
        const ratings = product.ratings || [];

        const ratingAverage =
          ratings.length > 0
            ? ratings.reduce((a, b) => a + b) / ratings.length
            : 0;

        // Update product metrics
        batch.update(productRef, {
          reservedStock: Math.max(0, reservedStock - item.quantity),
          soldCount: currentSoldCount + item.quantity,
          ratingsCount: ratings.length,
          ratingAverage: Math.round(ratingAverage * 10) / 10,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    // Mark order as completed
    batch.update(orderRef, {
      status: "completed",
      deliveryStatus: "delivered",
      paymentStatus:
        order.paymentMethod === "cod" ? "cod_completed" : "verified_completed",
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      stockReleased: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    // Notify buyer
    await createNotification(
      order.buyerId,
      "order_delivered",
      "Order Delivered",
      `Your order #${orderId.slice(-8).toUpperCase()} has been delivered successfully!`,
      { orderId },
    );

    const updatedDoc = await db.collection("orders").doc(orderId).get();
    res.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
    });
  } catch (err) {
    console.error("Complete Order Error:", err);
    res.status(500).json({ message: "Failed to complete order" });
  }
};

// Get buyer's orders
export const getBuyerOrders = async (req, res) => {
  try {
    const { buyerId } = req.params;

    const snapshot = await db
      .collection("orders")
      .where("buyerId", "==", buyerId)
      .orderBy("createdAt", "desc")
      .get();

    const orders = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        paymentProofUploadedAt:
          data.paymentProofUploadedAt?.toDate?.() ||
          data.paymentProofUploadedAt,
        paymentVerifiedAt:
          data.paymentVerifiedAt?.toDate?.() || data.paymentVerifiedAt,
      };
    });

    res.json(orders);
  } catch (err) {
    console.error("Get Buyer Orders Error:", err);
    res.status(500).json({ message: "Failed to fetch buyer orders" });
  }
};

// Get seller's orders
export const getSellerOrders = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const snapshot = await db.collection("orders").get();

    let sellerOrders = [];
    snapshot.forEach((doc) => {
      const order = { id: doc.id, ...doc.data() };
      order.items = order.items.filter((item) => item.sellerId === sellerId);
      if (order.items.length > 0) {
        sellerOrders.push(order);
      }
    });

    sellerOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(sellerOrders);
  } catch (err) {
    console.error("Get Seller Orders Error:", err);
    res.status(500).json({ message: "Failed to fetch seller orders" });
  }
};

// Get order by ID
export const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const doc = await db.collection("orders").doc(orderId).get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (err) {
    console.error("Get Order Error:", err);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, deliveryStatus, buyerNotified } = req.body;

    const updates = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (status) updates.status = status;
    if (deliveryStatus) updates.deliveryStatus = deliveryStatus;
    if (buyerNotified !== undefined) updates.buyerNotified = buyerNotified;

    await db.collection("orders").doc(orderId).update(updates);

    // Get order details to notify buyer about status change
    const doc = await db.collection("orders").doc(orderId).get();
    const order = doc.data();

    if (deliveryStatus === "shipped") {
      await createNotification(
        order.buyerId,
        "order_shipped",
        "Order Shipped",
        `Your order #${orderId.slice(-8).toUpperCase()} has been shipped!`,
        { orderId, deliveryStatus },
      );
    }

    res.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (err) {
    console.error("Update Order Status Error:", err);
    res.status(500).json({ message: "Failed to update order" });
  }
};

// Upload payment proof
export const uploadPaymentProof = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentProofUrl, referenceNumber } = req.body;

    if (!paymentProofUrl) {
      return res
        .status(400)
        .json({ message: "Payment proof image is required" });
    }

    if (!referenceNumber || !referenceNumber.trim()) {
      return res
        .status(400)
        .json({ message: "Transaction reference number is required" });
    }

    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderDoc.data();

    if (order.paymentMethod === "cod") {
      return res.status(400).json({
        message: "Cannot upload payment proof for Cash on Delivery orders",
      });
    }

    await db.collection("orders").doc(orderId).update({
      paymentProofUrl,
      paymentReferenceNumber: referenceNumber.trim(),
      paymentProofUploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentStatus: "pending_verification",
      status: "payment_submitted",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updatedDoc = await db.collection("orders").doc(orderId).get();
    res.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
    });
  } catch (err) {
    console.error("Upload Payment Proof Error:", err);
    res.status(500).json({ message: "Failed to upload payment proof" });
  }
};
