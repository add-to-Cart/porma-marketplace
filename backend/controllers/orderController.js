import admin from "../config/firebaseAdmin.js";
const db = admin.firestore();

// Create an order from cart items
export const createOrder = async (req, res) => {
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
      // Timestamps
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      // Status fields
      status: paymentMethod === "cod" ? "pending" : "awaiting_payment",
      paymentStatus: paymentMethod === "cod" ? "cod" : "pending_proof",
      deliveryStatus: "processing",
      buyerNotified: false,
    };

    const docRef = await db.collection("orders").add(order);

    res.json({
      id: docRef.id,
      ...order,
    });
  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
};

// Upload payment proof with reference number
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

    // Only allow uploads for online payment methods
    if (order.paymentMethod === "cod") {
      return res.status(400).json({
        message: "Cannot upload payment proof for Cash on Delivery orders",
      });
    }

    // Update the order with payment proof
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

// Seller verifies payment (accepts or rejects)
export const verifyPayment = async (req, res) => {
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

    if (verified) {
      // Payment accepted
      await db.collection("orders").doc(orderId).update({
        paymentStatus: "verified",
        status: "pending", // Order now ready for processing
        paymentVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentVerifiedBy: sellerId,
        buyerNotified: false, // Will trigger notification
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Payment rejected
      await db
        .collection("orders")
        .doc(orderId)
        .update({
          paymentStatus: "rejected",
          status: "payment_rejected",
          paymentRejectionReason:
            rejectionReason || "Payment could not be verified",
          paymentRejectedAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentRejectedBy: sellerId,
          buyerNotified: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

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

// Get seller's orders (orders for products they sell)
export const getSellerOrders = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const snapshot = await db.collection("orders").get();

    let sellerOrders = [];
    snapshot.forEach((doc) => {
      const order = { id: doc.id, ...doc.data() };
      // Filter orders that contain items from this seller
      order.items = order.items.filter((item) => item.sellerId === sellerId);
      if (order.items.length > 0) {
        sellerOrders.push(order);
      }
    });

    // Sort by date
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

// Update order status (seller can update delivery status)
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

    const doc = await db.collection("orders").doc(orderId).get();
    res.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (err) {
    console.error("Update Order Status Error:", err);
    res.status(500).json({ message: "Failed to update order" });
  }
};

// Complete order and update product ratings/soldCount
export const completeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderDoc.data();

    // Update product soldCount and compute rating averages
    for (const item of order.items) {
      const productRef = db.collection("products").doc(item.productId);
      const productDoc = await productRef.get();

      if (productDoc.exists) {
        const product = productDoc.data();
        const newSoldCount = (product.soldCount || 0) + item.quantity;
        const ratings = product.ratings || [];
        const ratingAverage =
          ratings.length > 0
            ? ratings.reduce((a, b) => a + b) / ratings.length
            : 0;

        await productRef.update({
          soldCount: newSoldCount,
          ratingsCount: ratings.length,
          ratingAverage: Math.round(ratingAverage * 10) / 10,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    // Mark order as completed
    await db
      .collection("orders")
      .doc(orderId)
      .update({
        status: "completed",
        deliveryStatus: "delivered",
        paymentStatus:
          order.paymentMethod === "cod"
            ? "cod_completed"
            : "verified_completed",
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

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
