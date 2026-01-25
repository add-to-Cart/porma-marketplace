import express from "express";
import admin from "../config/firebaseAdmin.js";
import { verifyAuth } from "../middleware/auth.js";
import multer from "multer";
import {
  uploadAvatar,
  uploadProductImage,
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
    console.error("Signup error:", error);

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
        seller: userData?.seller, // Include seller profile data
      },
      customToken,
    });
  } catch (error) {
    console.error("Signin error:", error);
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
    console.error("Admin Login Error:", error);
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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: "buyer",
        provider: "google",
      };
      await db.collection("users").doc(uid).set(userData);
    } else {
      userData = userDoc.data();
      if (picture && picture !== userData.photoURL) {
        await db.collection("users").doc(uid).update({
          photoURL: picture,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        userData.photoURL = picture;
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
    console.error("Google signin error:", error);
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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: "buyer",
        provider: decoded.firebase?.sign_in_provider || "unknown",
      };
      await userDocRef.set(userData);
    } else {
      userData = userDoc.data();
      if (picture && picture !== userData.photoURL) {
        await userDocRef.update({
          photoURL: picture,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        userData.photoURL = picture;
      }
    }

    res.json({
      success: true,
      user: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        username: userData.username,
        avatarUrl: userData.photoURL,
        role: userData.role,
        isAdmin: userData.isAdmin === true || userData.role === "admin",
        isSeller: userData.role === "seller",
        sellerApplication: userData.sellerApplication,
        seller: userData.seller, // Include full seller profile
      },
    });
  } catch (err) {
    console.error("Token verify error:", err);
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
        avatarUrl: userData.photoURL,
        sellerApplication: userData.sellerApplication,
        seller: userData.seller, // Seller profile data
        storeName: userData.seller?.storeName, // Quick access
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
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
    console.error("Profile update error:", error);
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

      const uploadResult = await uploadAvatar(req.file);

      const db = admin.firestore();
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
      console.error("Avatar upload error:", error);
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
    console.error("Signout error:", error);
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
      const qrUploadResult = await uploadProductImage(
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
      console.error("Apply seller error:", error);
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
        const qrUploadResult = await uploadProductImage(
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
      console.error("Update seller application error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update seller application",
        error: error.message,
      });
    }
  },
);

// ============================================
// SELLER PROFILE UPDATE (For approved sellers only)
// ============================================
router.put(
  "/seller/profile",
  verifyAuth,
  upload.single("qrCode"),
  async (req, res) => {
    try {
      const db = admin.firestore();
      const userDoc = await db.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();

      // Check if user is an approved seller
      if (userData.role !== "seller") {
        return res.status(403).json({
          success: false,
          message: "Only approved sellers can update their profile",
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

      const updates = {
        "seller.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
      };

      // Update store name
      if (storeName && storeName.trim()) {
        updates["seller.storeName"] = storeName.trim();
      }

      // Update store description
      if (storeDescription !== undefined) {
        updates["seller.storeDescription"] = storeDescription.trim();
      }

      // Update payment method if provided
      if (paymentMethod) {
        updates["seller.paymentDetails.method"] = paymentMethod;

        if (paymentMethod === "gcash") {
          if (gcashNumber)
            updates["seller.paymentDetails.gcash.number"] = gcashNumber.trim();
          if (gcashName)
            updates["seller.paymentDetails.gcash.name"] = gcashName.trim();
        } else if (paymentMethod === "bank") {
          if (bankName)
            updates["seller.paymentDetails.bank.bankName"] = bankName.trim();
          if (accountNumber)
            updates["seller.paymentDetails.bank.accountNumber"] =
              accountNumber.trim();
          if (accountName)
            updates["seller.paymentDetails.bank.accountName"] =
              accountName.trim();
        }
      }

      // Update QR code if new file uploaded
      if (req.file) {
        const qrUploadResult = await uploadProductImage(
          req.file,
          `qr_codes/${req.user.uid}-${Date.now()}`,
        );
        updates["seller.paymentDetails.qrCodeUrl"] = qrUploadResult.url;
        updates["seller.paymentDetails.qrCodePublicId"] =
          qrUploadResult.publicId;
      }

      // Apply updates
      await db.collection("users").doc(req.user.uid).update(updates);

      // Fetch updated data
      const updatedDoc = await db.collection("users").doc(req.user.uid).get();
      const updatedData = updatedDoc.data();

      res.json({
        success: true,
        message: "Seller profile updated successfully",
        seller: updatedData.seller,
      });
    } catch (error) {
      console.error("Update seller profile error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update seller profile",
        error: error.message,
      });
    }
  },
);

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
    console.error("Get seller applications error:", error);
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
    await db.collection("sellers").doc(uid).set({
      sellerId: uid,
      storeName: application.storeName,
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
    console.error("Reject seller error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject seller application",
    });
  }
});

export default router;
