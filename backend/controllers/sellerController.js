import admin from "../config/firebaseAdmin.js";
import { uploadQr } from "../services/cloudinary_service.js";

const db = admin.firestore();

export const applySeller = async (req, res) => {
  try {
    const uid = req.user.uid;

    // Log the incoming data for debugging
    console.log("applySeller - uid:", uid, "body:", req.body);

    const {
      storeName,
      storeDescription,
      paymentMethod,
      gcashNumber,
      gcashName,
      bankName,
      accountNumber,
      accountName,
    } = req.body;

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

    // Build payment details from form data
    const paymentDetails = {
      method: paymentMethod || "gcash",
      gcash: {},
      bank: {},
    };

    if (paymentMethod === "gcash" || paymentMethod === "both") {
      paymentDetails.gcash.number = gcashNumber || null;
      paymentDetails.gcash.name = gcashName || null;
    }

    if (paymentMethod === "bank" || paymentMethod === "both") {
      paymentDetails.bank.bankName = bankName || null;
      paymentDetails.bank.accountNumber = accountNumber || null;
      paymentDetails.bank.accountName = accountName || null;
    }

    // Handle QR code file uploads if provided
    if (req.files) {
      // Upload GCash QR if provided
      const gcashQrFile = req.files.find((f) => f.fieldname === "gcashQr");
      if (gcashQrFile) {
        const gcashQrResult = await uploadQr(gcashQrFile);
        paymentDetails.gcash.qrCodeUrl = gcashQrResult.url;
        paymentDetails.gcash.qrCodePublicId = gcashQrResult.publicId;
      }

      // Upload Bank QR if provided
      const bankQrFile = req.files.find((f) => f.fieldname === "bankQr");
      if (bankQrFile) {
        const bankQrResult = await uploadQr(bankQrFile);
        paymentDetails.bank.qrCodeUrl = bankQrResult.url;
        paymentDetails.bank.qrCodePublicId = bankQrResult.publicId;
      }
    }

    await db
      .collection("users")
      .doc(uid)
      .update({
        sellerApplication: {
          status: "pending",
          storeName,
          storeDescription: storeDescription || null,
          paymentDetails: paymentDetails || null,
          appliedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      });

    res.json({ success: true, message: "Application submitted" });
  } catch (err) {
    console.error(
      "/seller/apply error:",
      err && err.message ? err.message : err,
    );
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV !== "production" ? err?.message : undefined,
    });
  }
};

export const updateSellerApplication = async (req, res) => {
  try {
    const uid = req.user.uid;
    const {
      storeName,
      storeDescription,
      paymentMethod,
      gcashNumber,
      gcashName,
      bankName,
      accountNumber,
      accountName,
    } = req.body;

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

    // Handle payment details update
    if (paymentMethod) {
      const paymentDetails = {
        method: paymentMethod,
        gcash: {},
        bank: {},
      };

      // Build GCash details
      if (paymentMethod === "gcash" || paymentMethod === "both") {
        paymentDetails.gcash.number = gcashNumber || null;
        paymentDetails.gcash.name = gcashName || null;
      }

      // Build Bank details
      if (paymentMethod === "bank" || paymentMethod === "both") {
        paymentDetails.bank.bankName = bankName || null;
        paymentDetails.bank.accountNumber = accountNumber || null;
        paymentDetails.bank.accountName = accountName || null;
      }

      // Handle QR code uploads
      if (req.files && req.files.length > 0) {
        // Upload GCash QR if provided
        const gcashQrFile = req.files.find((f) => f.fieldname === "gcashQr");
        if (gcashQrFile) {
          const gcashQrResult = await uploadQr(gcashQrFile);
          paymentDetails.gcash.qrCodeUrl = gcashQrResult.url;
          paymentDetails.gcash.qrCodePublicId = gcashQrResult.publicId;
        }

        // Upload Bank QR if provided
        const bankQrFile = req.files.find((f) => f.fieldname === "bankQr");
        if (bankQrFile) {
          const bankQrResult = await uploadQr(bankQrFile);
          paymentDetails.bank.qrCodeUrl = bankQrResult.url;
          paymentDetails.bank.qrCodePublicId = bankQrResult.publicId;
        }
      }

      // Preserve existing QR URLs if not re-uploading
      const existingPaymentDetails = userData.sellerApplication?.paymentDetails || {};
      if (existingPaymentDetails.gcash?.qrCodeUrl && !paymentDetails.gcash.qrCodeUrl) {
        paymentDetails.gcash.qrCodeUrl = existingPaymentDetails.gcash.qrCodeUrl;
        paymentDetails.gcash.qrCodePublicId = existingPaymentDetails.gcash.qrCodePublicId;
      }
      if (existingPaymentDetails.bank?.qrCodeUrl && !paymentDetails.bank.qrCodeUrl) {
        paymentDetails.bank.qrCodeUrl = existingPaymentDetails.bank.qrCodeUrl;
        paymentDetails.bank.qrCodePublicId = existingPaymentDetails.bank.qrCodePublicId;
      }

      updates["sellerApplication.paymentDetails"] = paymentDetails;
    }

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection("users").doc(uid).update(updates);

    res.json({
      success: true,
      message: "Seller application updated successfully",
    });
  } catch (error) {
    console.error("Update seller application error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update seller application",
      error: error.message,
    });
  }
};

export const getSellerApplications = async (req, res) => {
  try {
    // Dev mode: Allow all requests
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({ success: false, message: "Access denied" });
    // }

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

    // Get all QR code URLs from payment details
    const paymentDetails = application.paymentDetails || {};
    const qrCodeUrls = {
      gcash: paymentDetails.gcash?.qrCodeUrl || null,
      bank: paymentDetails.bank?.qrCodeUrl || null,
    };

    await db
      .collection("sellers")
      .doc(uid)
      .set({
        userId: uid,
        storeName: application.storeName,
        ownerName: application.storeName,
        avatarUrl: application.avatarUrl || null,
        qrCodeUrls: qrCodeUrls,
        paymentDetails: paymentDetails,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    res.json({
      success: true,
      message: "Seller application approved successfully",
    });
  } catch (error) {
    console.error("Approve seller error:", error);
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
