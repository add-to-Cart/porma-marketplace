import express from "express";
import admin from "../config/firebaseAdmin.js";
import { verifyAuth } from "../middleware/auth.js";
import {
  applySeller,
  updateSellerApplication,
  getSellerApplications,
  approveSeller,
  rejectSeller,
} from "../controllers/sellerController.js";
import multer from "multer";
import { uploadAvatar, uploadQr } from "../services/cloudinary_service.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
const db = admin.firestore();

// Submit seller application
router.post("/apply", verifyAuth, upload.any(), applySeller);

// Update seller profile
router.put("/profile", verifyAuth, upload.any(), async (req, res) => {
  try {
    const uid = req.user.uid;
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

    const updates = {};

    if (storeName && storeName.trim()) {
      if (userData.role === "seller") {
        await db.collection("sellers").doc(uid).update({
          storeName: storeName.trim(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        updates["sellerApplication.storeName"] = storeName.trim();
      }
    }

    if (storeDescription !== undefined && storeDescription.trim()) {
      if (userData.role === "seller") {
        await db.collection("sellers").doc(uid).update({
          storeDescription: storeDescription.trim(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        updates["sellerApplication.storeDescription"] = storeDescription.trim();
      }
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

      // Get existing payment details if updating
      let existingPaymentDetails = {};
      if (userData.role === "seller" && userData.seller?.paymentDetails) {
        existingPaymentDetails = userData.seller.paymentDetails;
      } else if (userData.sellerApplication?.paymentDetails) {
        existingPaymentDetails = userData.sellerApplication.paymentDetails;
      }

      // Merge with existing data to preserve URLs if not re-uploading
      if (
        existingPaymentDetails.gcash?.qrCodeUrl &&
        !paymentDetails.gcash.qrCodeUrl
      ) {
        paymentDetails.gcash.qrCodeUrl = existingPaymentDetails.gcash.qrCodeUrl;
        paymentDetails.gcash.qrCodePublicId =
          existingPaymentDetails.gcash.qrCodePublicId;
      }
      if (
        existingPaymentDetails.bank?.qrCodeUrl &&
        !paymentDetails.bank.qrCodeUrl
      ) {
        paymentDetails.bank.qrCodeUrl = existingPaymentDetails.bank.qrCodeUrl;
        paymentDetails.bank.qrCodePublicId =
          existingPaymentDetails.bank.qrCodePublicId;
      }

      if (userData.role === "seller") {
        await db.collection("sellers").doc(uid).update({
          paymentDetails,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        updates["sellerApplication.paymentDetails"] = paymentDetails;
      }
    }

    if (Object.keys(updates).length > 0) {
      await db.collection("users").doc(uid).update(updates);
    }

    res.json({
      success: true,
      message: "Seller profile updated successfully",
    });
  } catch (error) {
    console.error("Seller profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update seller profile",
      error: error.message,
    });
  }
});

// Upload seller avatar
router.post(
  "/avatar",
  verifyAuth,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const userDoc = await db.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();

      if (
        userData.role !== "seller" &&
        !(userData.sellerApplication?.status === "pending")
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only approved sellers or pending applicants can upload avatar",
        });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      const uploadResult = await uploadAvatar(req.file);
      const updateData = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (userData.role === "seller") {
        updateData.avatarUrl = uploadResult.url;
        updateData.avatarPublicId = uploadResult.publicId;
        await db.collection("sellers").doc(req.user.uid).update(updateData);
      } else if (userData.sellerApplication?.status === "pending") {
        updateData["sellerApplication.avatarUrl"] = uploadResult.url;
        updateData["sellerApplication.avatarPublicId"] = uploadResult.publicId;
        await db.collection("users").doc(req.user.uid).update({
          "sellerApplication.avatarUrl": uploadResult.url,
          "sellerApplication.avatarPublicId": uploadResult.publicId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      res.json({
        success: true,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
      });
    } catch (error) {
      console.error("Seller avatar upload error:", error);
      res.status(500).json({
        success: false,
        message: "Avatar upload failed",
        error: error.message,
      });
    }
  },
);

// ADMIN: Get seller applications
router.get("/applications", verifyAuth, async (req, res) => {
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
});

// ADMIN: Approve seller application
router.put("/approve/:uid", verifyAuth, async (req, res) => {
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
      avatarUrl: application.avatarUrl || null,
      avatarPublicId: application.avatarPublicId || null,
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
        ownerName: userData.displayName || application.storeName,
        avatarUrl: application.avatarUrl || null,
        avatarPublicId: application.avatarPublicId || null,
        qrCodeUrl: application.paymentDetails?.qrCodeUrl || null,
        paymentDetails: application.paymentDetails,
        status: "active",
        isActive: true,
        isRestricted: false,
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
});

// ADMIN: Reject seller application
router.put("/reject/:uid", verifyAuth, async (req, res) => {
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
});

// Update seller application (for pending applicants)
router.put("/update-application", verifyAuth, updateSellerApplication);

// ADMIN: Get seller applications
router.get("/applications", verifyAuth, getSellerApplications);

// ADMIN: Approve seller application
router.put("/approve/:uid", verifyAuth, approveSeller);

// ADMIN: Reject seller application
router.put("/reject/:uid", verifyAuth, rejectSeller);

export default router;
