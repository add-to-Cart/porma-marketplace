import express from "express";
import admin from "../config/firebaseAdmin.js";
import { verifyAuth } from "../middleware/auth.js";
import multer from "multer";
import {
  uploadAvatar,
  uploadProductImage,
  uploadQr,
  deleteImage,
} from "../services/cloudinary_service.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Sign up with email and password
router.post("/signup", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || email.split("@")[0],
    });

    const db = admin.firestore();
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      role: "buyer",
    });

    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      },
      customToken,
    });
  } catch (error) {
    if (error.code === "auth/email-already-exists") {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Sign in with email/username and password
router.post("/signin", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier and password are required",
      });
    }

    let email = identifier;
    let snapshot = null;

    if (!identifier.includes("@")) {
      const db = admin.firestore();
      const usersRef = db.collection("users");
      snapshot = await usersRef
        .where("displayName", "==", identifier)
        .limit(1)
        .get();

      if (snapshot.empty) {
        snapshot = await usersRef.where("isAdmin", "==", true).limit(1).get();
      }

      if (snapshot.empty) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      email = userData.email;

      if (userData.isAdmin && !email) {
        email = "admin@admin.com";
      }
    }

    let userRecord;
    let foundUserDoc = null;
    if (!identifier.includes("@")) {
      foundUserDoc = snapshot.docs[0];
    }

    if (email === "admin@admin.com" && !foundUserDoc) {
      const db = admin.firestore();
      const usersRef = db.collection("users");
      const adminSnapshot = await usersRef
        .where("isAdmin", "==", true)
        .limit(1)
        .get();
      if (!adminSnapshot.empty) {
        foundUserDoc = adminSnapshot.docs[0];
      }
    }

    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code === "auth/user-not-found" && foundUserDoc) {
        userRecord = await admin.auth().createUser({
          uid: foundUserDoc.id,
          email,
          password,
        });
      } else {
        throw error;
      }
    }

    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(userRecord.uid).get();
    const userData = userDoc.data();

    // Fetch seller data if user is a seller
    let sellerData = null;
    if (userData?.role === "seller") {
      const sellerDoc = await db
        .collection("sellers")
        .doc(userRecord.uid)
        .get();
      if (sellerDoc.exists) {
        sellerData = sellerDoc.data();
      }
    }

    res.json({
      success: true,
      message: "Sign in successful",
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userData?.displayName || userRecord.displayName,
        avatarUrl: userData?.photoURL || null,
        role: userData?.role || "buyer",
        isSeller: userData?.role === "seller",
        sellerApplication: userData?.sellerApplication,
        seller: sellerData, // Include seller profile data from sellers collection
        sellerAvatarUrl: sellerData?.avatarUrl, // Quick access for frontend
      },
      customToken,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Admin sign in
router.post("/signin-admin", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Username and password required" });
    }

    const db = admin.firestore();

    const adminSnapshot = await db
      .collection("users")
      .where("isAdmin", "==", true)
      .where("username", "==", identifier)
      .limit(1)
      .get();

    if (adminSnapshot.empty) {
      return res
        .status(401)
        .json({ success: false, message: "Admin account not found" });
    }

    const adminDoc = adminSnapshot.docs[0];
    const adminData = adminDoc.data();

    if (adminData.password !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const customToken = await admin.auth().createCustomToken(adminDoc.id);

    res.json({
      success: true,
      user: {
        uid: adminDoc.id,
        displayName: adminData.username,
        role: "admin",
        isAdmin: true,
      },
      customToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Google Sign In
router.post("/google-signin", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "ID token is required",
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(uid).get();

    let userData;
    if (!userDoc.exists) {
      userData = {
        uid,
        email,
        displayName: name || email.split("@")[0],
        photoURL: picture || null,
        googlePhotoURL: picture || null, // Store Google photo separately
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: "buyer",
        provider: "google",
      };
      await db.collection("users").doc(uid).set(userData);
    } else {
      userData = userDoc.data();
      // Always update the Google photo URL
      if (picture !== userData.googlePhotoURL) {
        await db.collection("users").doc(uid).update({
          googlePhotoURL: picture,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        userData.googlePhotoURL = picture;
      }

      // Set photoURL: custom avatar takes precedence, then Google photo as fallback
      let finalPhotoURL = userData.photoURL;

      if (userData.photoPublicId) {
        // User has custom avatar - keep it
        finalPhotoURL = userData.photoURL;
      } else if (picture) {
        // No custom avatar - use Google photo
        finalPhotoURL = picture;
      } else if (userData.googlePhotoURL) {
        // Fallback to stored Google photo
        finalPhotoURL = userData.googlePhotoURL;
      }

      // Update photoURL if it changed
      if (finalPhotoURL !== userData.photoURL) {
        await db.collection("users").doc(uid).update({
          photoURL: finalPhotoURL,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        userData.photoURL = finalPhotoURL;
      }
    }

    const customToken = await admin.auth().createCustomToken(uid);

    res.json({
      success: true,
      message: "Google sign in successful",
      user: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        role: userData.role,
        provider: userData.provider,
      },
      customToken,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Google sign in failed",
    });
  }
});

// Token verify
router.post("/token-verify", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res
        .status(400)
        .json({ success: false, message: "ID token required" });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decoded;

    const db = admin.firestore();
    const userDocRef = db.collection("users").doc(uid);
    const userDoc = await userDocRef.get();

    let userData;
    if (!userDoc.exists) {
      userData = {
        uid,
        email,
        displayName: name || email.split("@")[0],
        photoURL: picture || null,
        googlePhotoURL: picture || null, // Store Google photo separately
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: "buyer",
        provider: decoded.firebase?.sign_in_provider || "unknown",
      };
      await userDocRef.set(userData);
    } else {
      userData = userDoc.data();
      // Always update the Google photo URL
      if (picture !== userData.googlePhotoURL) {
        await userDocRef.update({
          googlePhotoURL: picture,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        userData.googlePhotoURL = picture;
      }

      // Set photoURL: custom avatar takes precedence, then Google photo as fallback
      let finalPhotoURL = userData.photoURL;

      if (userData.photoPublicId) {
        // User has custom avatar - keep it
        finalPhotoURL = userData.photoURL;
      } else if (picture) {
        // No custom avatar - use current Google photo
        finalPhotoURL = picture;
      } else if (userData.googlePhotoURL) {
        // Fallback to stored Google photo
        finalPhotoURL = userData.googlePhotoURL;
      }

      // Update photoURL if it changed
      if (finalPhotoURL !== userData.photoURL) {
        await userDocRef.update({
          photoURL: finalPhotoURL,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        userData.photoURL = finalPhotoURL;
      }
    }

    // Fetch seller data if user is a seller
    let sellerData = null;
    if (userData.role === "seller") {
      const sellerDoc = await db.collection("sellers").doc(userData.uid).get();
      if (sellerDoc.exists) {
        sellerData = sellerDoc.data();
      }
    }

    res.json({
      success: true,
      user: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        username: userData.username,
        avatarUrl: userData.photoURL || userData.googlePhotoURL || null,
        role: userData.role,
        isAdmin: userData.isAdmin === true || userData.role === "admin",
        isSeller: userData.role === "seller",
        sellerApplication: userData.sellerApplication,
        seller: sellerData, // Include seller profile from sellers collection
        sellerAvatarUrl: sellerData?.avatarUrl, // Quick access for frontend
      },
    });
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

// Get current user profile
router.get("/profile", verifyAuth, async (req, res) => {
  try {
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(req.user.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    const userData = userDoc.data();

    // Fetch seller data if user is a seller
    let sellerData = null;
    if (userData.role === "seller") {
      const sellerDoc = await db.collection("sellers").doc(req.user.uid).get();
      if (sellerDoc.exists) {
        sellerData = sellerDoc.data();
      }
    }

    res.json({
      success: true,
      user: {
        uid: req.user.uid,
        email: req.user.email,
        displayName: userData.displayName,
        username: userData.username,
        role: userData.role,
        isSeller: userData.role === "seller",
        isAdmin: userData.isAdmin === true,
        createdAt: userData.createdAt,
        birthday: userData.birthday,
        contact: userData.contact,
        addressLine: userData.addressLine,
        barangay: userData.barangay,
        city: userData.city,
        province: userData.province,
        zipCode: userData.zipCode,
        avatarUrl: userData.photoURL || userData.googlePhotoURL || null,
        sellerApplication: userData.sellerApplication,
        seller: sellerData, // Seller profile data from sellers collection
        storeName: sellerData?.storeName, // Quick access
        sellerAvatarUrl: sellerData?.avatarUrl, // Quick access for frontend
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update user profile
router.put("/profile", verifyAuth, async (req, res) => {
  try {
    const {
      username,
      birthday,
      contact,
      addressLine,
      barangay,
      city,
      province,
      zipCode,
    } = req.body;
    const db = admin.firestore();

    await db.collection("users").doc(req.user.uid).update({
      username,
      birthday,
      contact,
      addressLine,
      barangay,
      city,
      province,
      zipCode,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Upload avatar
router.post(
  "/profile/avatar",
  verifyAuth,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      const db = admin.firestore();
      const userDoc = await db.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();

      // Delete old avatar if exists
      if (userData.photoPublicId) {
        try {
          await deleteImage(userData.photoPublicId);
        } catch (error) {}
      }

      const uploadResult = await uploadAvatar(req.file);

      await db.collection("users").doc(req.user.uid).update({
        photoURL: uploadResult.url,
        photoPublicId: uploadResult.publicId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({
        success: true,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Avatar upload failed" });
    }
  },
);

// Sign out
router.post("/signout", verifyAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Sign out successful",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// ============================================
// SELLER APPLICATION WITH QR CODE UPLOAD
// ============================================
router.post(
  "/apply-seller",
  verifyAuth,
  upload.single("qrCode"),
  async (req, res) => {
    try {
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

      if (!storeName || !storeName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Store name is required",
        });
      }

      if (
        !paymentMethod ||
        (paymentMethod !== "gcash" && paymentMethod !== "bank")
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid payment method is required",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Payment QR code is required",
        });
      }

      const db = admin.firestore();
      const userDoc = await db.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();

      // Check if already a seller
      if (userData.role === "seller") {
        return res.status(400).json({
          success: false,
          message: "You are already a seller",
        });
      }

      // Check if already has pending application
      if (userData.sellerApplication?.status === "pending") {
        return res.status(400).json({
          success: false,
          message: "You already have a pending application",
        });
      }

      // Upload QR code to Cloudinary
      const qrUploadResult = await uploadQr(
        req.file,
        `qr_codes/${req.user.uid}-${Date.now()}`,
      );

      // Prepare seller application data
      const applicationData = {
        status: "pending",
        storeName: storeName.trim(),
        storeDescription: storeDescription?.trim() || "",
        paymentDetails: {
          method: paymentMethod,
          qrCodeUrl: qrUploadResult.url,
          qrCodePublicId: qrUploadResult.publicId,
        },
        appliedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Add payment-specific details
      if (paymentMethod === "gcash") {
        applicationData.paymentDetails.gcash = {
          number: gcashNumber?.trim() || "",
          name: gcashName?.trim() || "",
        };
      } else if (paymentMethod === "bank") {
        applicationData.paymentDetails.bank = {
          bankName: bankName?.trim() || "",
          accountNumber: accountNumber?.trim() || "",
          accountName: accountName?.trim() || "",
        };
      }

      // Save application to user document
      await db.collection("users").doc(req.user.uid).update({
        sellerApplication: applicationData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({
        success: true,
        message:
          "Seller application submitted successfully. Please wait for admin approval.",
        application: applicationData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to submit seller application",
        error: error.message,
      });
    }
  },
);

// ============================================
// UPDATE SELLER APPLICATION (For pending applications)
// ============================================
router.put(
  "/update-seller-application",
  verifyAuth,
  upload.single("qrCode"),
  async (req, res) => {
    try {
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

      const db = admin.firestore();
      const userDoc = await db.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();

      // Check if user has a pending application
      if (
        !userData.sellerApplication ||
        userData.sellerApplication.status !== "pending"
      ) {
        return res.status(400).json({
          success: false,
          message: "No pending application found to update",
        });
      }

      const updates = {
        "sellerApplication.updatedAt":
          admin.firestore.FieldValue.serverTimestamp(),
      };

      // Update store name
      if (storeName && storeName.trim()) {
        updates["sellerApplication.storeName"] = storeName.trim();
      }

      // Update store description
      if (storeDescription !== undefined) {
        updates["sellerApplication.storeDescription"] = storeDescription.trim();
      }

      // Update payment method if provided
      if (paymentMethod) {
        updates["sellerApplication.paymentDetails.method"] = paymentMethod;

        if (paymentMethod === "gcash") {
          if (gcashNumber)
            updates["sellerApplication.paymentDetails.gcash.number"] =
              gcashNumber.trim();
          if (gcashName)
            updates["sellerApplication.paymentDetails.gcash.name"] =
              gcashName.trim();
        } else if (paymentMethod === "bank") {
          if (bankName)
            updates["sellerApplication.paymentDetails.bank.bankName"] =
              bankName.trim();
          if (accountNumber)
            updates["sellerApplication.paymentDetails.bank.accountNumber"] =
              accountNumber.trim();
          if (accountName)
            updates["sellerApplication.paymentDetails.bank.accountName"] =
              accountName.trim();
        }
      }

      // Update QR code if new file uploaded
      if (req.file) {
        // Delete old QR code if exists
        if (userData.sellerApplication?.paymentDetails?.qrCodePublicId) {
          try {
            await deleteImage(
              userData.sellerApplication.paymentDetails.qrCodePublicId,
            );
          } catch (error) {}
        }

        const qrUploadResult = await uploadQr(
          req.file,
          `qr_codes/${req.user.uid}-${Date.now()}`,
        );
        updates["sellerApplication.paymentDetails.qrCodeUrl"] =
          qrUploadResult.url;
        updates["sellerApplication.paymentDetails.qrCodePublicId"] =
          qrUploadResult.publicId;
      }

      // Apply updates
      await db.collection("users").doc(req.user.uid).update(updates);

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
  },
);

// ============================================
// SELLER PROFILE UPDATE (For approved sellers and pending applications)
// ============================================
router.put("/seller/profile", verifyAuth, upload.any(), async (req, res) => {
  try {
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    const userData = userDoc.data();

    // Check if user is an approved seller or has pending application
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
      avatarUrl,
    } = req.body;

    const updates = {};
    const sellerUpdates = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Update store name
    if (storeName && storeName.trim()) {
      if (userData.role === "seller") {
        sellerUpdates.storeName = storeName.trim();
      } else {
        updates["sellerApplication.storeName"] = storeName.trim();
      }
    }

    // Update store description
    if (storeDescription !== undefined) {
      if (userData.role === "seller") {
        sellerUpdates.storeDescription = storeDescription.trim();
      } else {
        updates["sellerApplication.storeDescription"] = storeDescription.trim();
      }
    }

    // Update payment method if provided
    if (paymentMethod) {
      if (userData.role === "seller") {
        sellerUpdates.paymentDetails = sellerUpdates.paymentDetails || {};
        sellerUpdates.paymentDetails.method = paymentMethod;
      } else {
        updates["sellerApplication.paymentDetails.method"] = paymentMethod;
      }

      if (paymentMethod === "gcash") {
        if (gcashNumber) {
          if (userData.role === "seller") {
            sellerUpdates.paymentDetails.gcash =
              sellerUpdates.paymentDetails.gcash || {};
            sellerUpdates.paymentDetails.gcash.number = gcashNumber.trim();
          } else {
            updates["sellerApplication.paymentDetails.gcash.number"] =
              gcashNumber.trim();
          }
        }
        if (gcashName) {
          if (userData.role === "seller") {
            sellerUpdates.paymentDetails.gcash =
              sellerUpdates.paymentDetails.gcash || {};
            sellerUpdates.paymentDetails.gcash.name = gcashName.trim();
          } else {
            updates["sellerApplication.paymentDetails.gcash.name"] =
              gcashName.trim();
          }
        }
      } else if (paymentMethod === "bank") {
        if (bankName) {
          if (userData.role === "seller") {
            sellerUpdates.paymentDetails.bank =
              sellerUpdates.paymentDetails.bank || {};
            sellerUpdates.paymentDetails.bank.bankName = bankName.trim();
          } else {
            updates["sellerApplication.paymentDetails.bank.bankName"] =
              bankName.trim();
          }
        }
        if (accountNumber) {
          if (userData.role === "seller") {
            sellerUpdates.paymentDetails.bank =
              sellerUpdates.paymentDetails.bank || {};
            sellerUpdates.paymentDetails.bank.accountNumber =
              accountNumber.trim();
          } else {
            updates["sellerApplication.paymentDetails.bank.accountNumber"] =
              accountNumber.trim();
          }
        }
        if (accountName) {
          if (userData.role === "seller") {
            sellerUpdates.paymentDetails.bank =
              sellerUpdates.paymentDetails.bank || {};
            sellerUpdates.paymentDetails.bank.accountName = accountName.trim();
          } else {
            updates["sellerApplication.paymentDetails.bank.accountName"] =
              accountName.trim();
          }
        }
      }
    }

    // Update avatar URL if provided
    if (avatarUrl) {
      if (userData.role === "seller") {
        sellerUpdates.avatarUrl = avatarUrl;
      } else if (userData.sellerApplication?.status === "pending") {
        updates["sellerApplication.avatarUrl"] = avatarUrl;
      }
    }

    // Update QR codes if new files uploaded
    const gcashQrFile = req.files?.find((f) => f.fieldname === "gcashQr");
    if (gcashQrFile) {
      // Delete old QR code if exists
      if (
        userData.role === "seller" &&
        userData.seller?.paymentDetails?.gcash?.qrCodePublicId
      ) {
        try {
          await deleteImage(
            userData.seller.paymentDetails.gcash.qrCodePublicId,
          );
        } catch (error) {}
      } else if (
        userData.sellerApplication?.status === "pending" &&
        userData.sellerApplication?.paymentDetails?.gcash?.qrCodePublicId
      ) {
        try {
          await deleteImage(
            userData.sellerApplication.paymentDetails.gcash.qrCodePublicId,
          );
        } catch (error) {}
      }

      const qrUploadResult = await uploadQr(
        gcashQrFile,
        `qr_codes/${req.user.uid}-gcash-${Date.now()}`,
      );
      if (userData.role === "seller") {
        sellerUpdates.paymentDetails = sellerUpdates.paymentDetails || {};
        sellerUpdates.paymentDetails.gcash =
          sellerUpdates.paymentDetails.gcash || {};
        sellerUpdates.paymentDetails.gcash.qrCodeUrl = qrUploadResult.url;
        sellerUpdates.paymentDetails.gcash.qrCodePublicId =
          qrUploadResult.publicId;
      } else if (userData.sellerApplication?.status === "pending") {
        updates["sellerApplication.paymentDetails.gcash.qrCodeUrl"] =
          qrUploadResult.url;
        updates["sellerApplication.paymentDetails.gcash.qrCodePublicId"] =
          qrUploadResult.publicId;
      }
    }

    const bankQrFile = req.files?.find((f) => f.fieldname === "bankQr");
    if (bankQrFile) {
      // Delete old QR code if exists
      if (
        userData.role === "seller" &&
        userData.seller?.paymentDetails?.bank?.qrCodePublicId
      ) {
        try {
          await deleteImage(userData.seller.paymentDetails.bank.qrCodePublicId);
        } catch (error) {}
      } else if (
        userData.sellerApplication?.status === "pending" &&
        userData.sellerApplication?.paymentDetails?.bank?.qrCodePublicId
      ) {
        try {
          await deleteImage(
            userData.sellerApplication.paymentDetails.bank.qrCodePublicId,
          );
        } catch (error) {}
      }

      const qrUploadResult = await uploadQr(
        bankQrFile,
        `qr_codes/${req.user.uid}-bank-${Date.now()}`,
      );
      if (userData.role === "seller") {
        sellerUpdates.paymentDetails = sellerUpdates.paymentDetails || {};
        sellerUpdates.paymentDetails.bank =
          sellerUpdates.paymentDetails.bank || {};
        sellerUpdates.paymentDetails.bank.qrCodeUrl = qrUploadResult.url;
        sellerUpdates.paymentDetails.bank.qrCodePublicId =
          qrUploadResult.publicId;
      } else if (userData.sellerApplication?.status === "pending") {
        updates["sellerApplication.paymentDetails.bank.qrCodeUrl"] =
          qrUploadResult.url;
        updates["sellerApplication.paymentDetails.bank.qrCodePublicId"] =
          qrUploadResult.publicId;
      }
    }

    // Apply updates to users collection for applications
    if (Object.keys(updates).length > 0) {
      await db.collection("users").doc(req.user.uid).update(updates);
    }

    // Apply updates to sellers collection for approved sellers
    if (userData.role === "seller" && Object.keys(sellerUpdates).length > 1) {
      // More than just updatedAt
      await db.collection("sellers").doc(req.user.uid).update(sellerUpdates);
    }

    // Fetch updated data
    let sellerData = null;
    if (userData.role === "seller") {
      const sellerDoc = await db.collection("sellers").doc(req.user.uid).get();
      sellerData = sellerDoc.data();
    } else {
      const updatedDoc = await db.collection("users").doc(req.user.uid).get();
      const updatedData = updatedDoc.data();
      sellerData = updatedData.sellerApplication;
    }

    res.json({
      success: true,
      message: "Seller profile updated successfully",
      seller: sellerData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update seller profile",
      error: error.message,
    });
  }
});

// ============================================
// ADMIN: GET SELLER APPLICATIONS
// ============================================
router.get("/seller-applications", verifyAuth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const db = admin.firestore();
    const usersRef = db.collection("users");
    const snapshot = await usersRef
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

// ============================================
// ADMIN: APPROVE SELLER APPLICATION
// ============================================
router.put("/approve-seller/:uid", verifyAuth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { uid } = req.params;
    const db = admin.firestore();

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

    // Create seller profile from application data
    const sellerProfile = {
      storeName: application.storeName,
      storeDescription: application.storeDescription || "",
      paymentDetails: application.paymentDetails,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Update user document: change role and move application to seller profile
    await db.collection("users").doc(uid).update({
      role: "seller",
      isSeller: true,
      seller: sellerProfile,
      "sellerApplication.status": "approved",
      "sellerApplication.approvedAt":
        admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create document in sellers collection
    await db
      .collection("sellers")
      .doc(uid)
      .set({
        userId: uid,
        storeName: application.storeName,
        ownerName: application.storeName, // Default to store name, can be updated later
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
});

// ============================================
// ADMIN: REJECT SELLER APPLICATION
// ============================================
router.put("/reject-seller/:uid", verifyAuth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { uid } = req.params;
    const { reason } = req.body;
    const db = admin.firestore();

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

// Upload seller avatar
router.post(
  "/seller/avatar",
  verifyAuth,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const db = admin.firestore();
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
        updateData["seller.avatarUrl"] = uploadResult.url;
        updateData["seller.avatarPublicId"] = uploadResult.publicId;
      } else if (userData.sellerApplication?.status === "pending") {
        updateData["sellerApplication.avatarUrl"] = uploadResult.url;
        updateData["sellerApplication.avatarPublicId"] = uploadResult.publicId;
      }
      await db.collection("users").doc(req.user.uid).update(updateData);
      res.json({
        success: true,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Avatar upload failed" });
    }
  },
);

// ============================================
// GET SELLER PAYMENT DETAILS (For checkout)
// ============================================
router.get("/seller/:sellerId/payment-details", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const db = admin.firestore();

    const sellerDoc = await db.collection("sellers").doc(sellerId).get();
    if (!sellerDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    const sellerData = sellerDoc.data();

    res.json({
      success: true,
      seller: {
        sellerId: sellerData.userId,
        storeName: sellerData.storeName,
        paymentDetails: sellerData.paymentDetails,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
