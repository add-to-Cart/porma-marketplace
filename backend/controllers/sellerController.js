import admin from "../config/firebaseAdmin.js";

const db = admin.firestore();

export const applySeller = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { storeName, storeDescription } = req.body;

    if (!storeName) {
      return res
        .status(400)
        .json({ success: false, message: "Store name is required" });
    }

    if (req.user && req.user.role === "seller") {
      return res
        .status(400)
        .json({ success: false, message: "You are already a seller" });
    }

    if (
      req.user &&
      req.user.sellerApplication &&
      req.user.sellerApplication.status === "pending"
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Application already pending" });
    }

    await db
      .collection("users")
      .doc(uid)
      .update({
        sellerApplication: {
          status: "pending",
          storeName,
          storeDescription: storeDescription || null,
          appliedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      });

    res.json({ success: true, message: "Application submitted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateSellerApplication = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { storeName, storeDescription, paymentDetails } = req.body;

    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();

    if (
      userData.role !== "seller" &&
      !(userData.sellerApplication?.status === "pending")
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only approved sellers or applicants with pending applications can update their profile",
      });
    }

    const updates = {};

    if (storeName && storeName.trim()) {
      updates["sellerApplication.storeName"] = storeName.trim();
    }

    if (storeDescription !== undefined) {
      updates["sellerApplication.storeDescription"] = storeDescription.trim();
    }

    if (paymentDetails) {
      updates["sellerApplication.paymentDetails"] = paymentDetails;
    }

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection("users").doc(uid).update(updates);

    res.json({
      success: true,
      message: "Seller application updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update seller application",
      error: error.message,
    });
  }
};

export const getSellerApplications = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const snapshot = await db
      .collection("users")
      .where("sellerApplication.status", "==", "pending")
      .get();

    const applications = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      applications.push({
        uid: doc.id,
        email: data.email,
        displayName: data.displayName,
        username: data.username,
        sellerApplication: data.sellerApplication,
      });
    });

    res.json({
      success: true,
      applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const approveSeller = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { uid } = req.params;
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userData = userDoc.data();
    const application = userData.sellerApplication;

    if (!application || application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "No pending application found",
      });
    }

    const sellerProfile = {
      storeName: application.storeName,
      storeDescription: application.storeDescription || "",
      paymentDetails: application.paymentDetails,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("users").doc(uid).update({
      role: "seller",
      isSeller: true,
      seller: sellerProfile,
      "sellerApplication.status": "approved",
      "sellerApplication.approvedAt":
        admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db
      .collection("sellers")
      .doc(uid)
      .set({
        userId: uid,
        storeName: application.storeName,
        ownerName: application.storeName,
        avatarUrl: application.avatarUrl || null,
        qrCodeUrl: application.paymentDetails?.qrCodeUrl || null,
        paymentDetails: application.paymentDetails,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    res.json({
      success: true,
      message: "Seller application approved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to approve seller application",
    });
  }
};

export const rejectSeller = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { uid } = req.params;
    const { reason } = req.body;

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await db
      .collection("users")
      .doc(uid)
      .update({
        "sellerApplication.status": "rejected",
        "sellerApplication.rejectedAt":
          admin.firestore.FieldValue.serverTimestamp(),
        "sellerApplication.rejectionReason":
          reason || "Application does not meet requirements",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    res.json({
      success: true,
      message: "Seller application rejected",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reject seller application",
    });
  }
};

export default {
  applySeller,
  updateSellerApplication,
  getSellerApplications,
  approveSeller,
  rejectSeller,
};
