import express from "express";
import bcrypt from "bcryptjs";
import admin from "../config/firebaseAdmin.js";
import { verifyAuth } from "../middleware/auth.js";
import multer from "multer";
import {
  uploadAvatar,
  uploadProductImage,
  uploadQr,
  deleteImage,
} from "../services/cloudinary_service.js";
import nodemailer from "nodemailer";
import { resolveEmail } from "../controllers/userController.js";

// Initialize router and middleware before defining routes
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const db = admin.firestore();

// ============================================
// USER ROUTES
// ============================================

// Resolve email from username (for login)
router.get("/users/resolve-email", resolveEmail);

// Check if username is available
router.get("/users/check-username", async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    const snapshot = await db
      .collection("users")
      .where("username", "==", username.trim())
      .get();

    if (snapshot.empty) {
      return res.json({
        success: true,
        available: true,
        message: "Username is available",
      });
    } else {
      return res.json({
        success: true,
        available: false,
        message: "Username is already taken",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to check username availability",
      error: error.message,
    });
  }
});

// Password reset
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }
    try {
      const resetLink = await admin.auth().generatePasswordResetLink(email);
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: "Password Reset Request",
        html: `<p>You requested a password reset for your account.</p><p><a href="${resetLink}">Click here to reset your password</a></p>`,
      });
      return res.json({ success: true, message: "Password reset email sent." });
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to send reset email" });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to send reset email" });
  }
});

// Admin Login
router.post("/admin-login", async (req, res) => {
  const { username, password } = req.body;
  const snapshot = await db
    .collection("admins")
    .where("username", "==", username)
    .get();
  if (snapshot.empty)
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });

  const adminDoc = snapshot.docs[0].data();
  const isMatch = await bcrypt.compare(password, adminDoc.passwordHash);
  if (!isMatch)
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });

  // Generate a simple session token (optional, or just return admin info)
  // For now, just return admin info
  return res.json({
    success: true,
    admin: {
      username: adminDoc.username,
      role: adminDoc.role,
      email: adminDoc.email,
    },
    // Optionally, you can add a simple token here if you want
  });
});

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
    let userDoc = null;
    let userData = null;
    let email = identifier;
    const usersRef = db.collection("users");
    if (identifier.includes("@")) {
      const snapshot = await usersRef
        .where("email", "==", identifier)
        .limit(1)
        .get();
      if (!snapshot.empty) {
        userDoc = snapshot.docs[0];
        userData = userDoc.data();
      }
    } else {
      const snapshot = await usersRef
        .where("displayName", "==", identifier)
        .limit(1)
        .get();
      if (!snapshot.empty) {
        userDoc = snapshot.docs[0];
        userData = userDoc.data();
        email = userData.email;
      }
    }
    if (!userDoc || userData?.isAdmin || userData?.role === "admin") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    // Block sign-in for deactivated or restricted accounts
    const isDeactivated =
      userData?.status === "deactivated" || userData?.isActive === false;
    const isRestricted =
      userData?.status === "restricted" || userData?.isRestricted === true;
    if (isDeactivated || isRestricted) {
      return res
        .status(403)
        .json({ success: false, message: "Account is inactive or restricted" });
    }
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    let sellerData = null;
    if (userData?.role === "seller") {
      const sellerDoc = await db
        .collection("sellers")
        .doc(userRecord.uid)
        .get();
      if (sellerDoc.exists) sellerData = sellerDoc.data();
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
        seller: sellerData,
        sellerAvatarUrl: sellerData?.avatarUrl,
      },
      customToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
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

    const userDocRef = db.collection("users").doc(uid);
    const userDoc = await userDocRef.get();

    let userData;
    if (!userDoc.exists) {
      userData = {
        uid,
        email,
        displayName: name || email.split("@")[0],
        photoURL: picture || null,
        googlePhotoURL: picture || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: "buyer",
        provider: "google",
      };
      await userDocRef.set(userData);
    } else {
      userData = userDoc.data();
      if (picture !== userData.googlePhotoURL) {
        await userDocRef.update({
          googlePhotoURL: picture || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        userData.googlePhotoURL = picture;
      }

      let finalPhotoURL = userData.photoURL;
      if (userData.photoPublicId) {
        finalPhotoURL = userData.photoURL;
      } else if (picture) {
        finalPhotoURL = picture;
      } else if (userData.googlePhotoURL) {
        finalPhotoURL = userData.googlePhotoURL;
      }

      if (finalPhotoURL !== userData.photoURL) {
        await userDocRef.update({
          photoURL: finalPhotoURL,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        userData.photoURL = finalPhotoURL;
      }
    }

    // Prevent Google sign-in for deactivated/restricted accounts
    const isDeactivatedG =
      userData?.status === "deactivated" || userData?.isActive === false;
    const isRestrictedG =
      userData?.status === "restricted" || userData?.isRestricted === true;
    if (isDeactivatedG || isRestrictedG) {
      return res
        .status(403)
        .json({ success: false, message: "Account is inactive or restricted" });
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

    const userDocRef = db.collection("users").doc(uid);
    const userDoc = await userDocRef.get();

    let userData;
    if (!userDoc.exists) {
      userData = {
        uid,
        email,
        displayName: name || email.split("@")[0],
        photoURL: picture || null,
        googlePhotoURL: picture || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: "buyer",
        provider: decoded.firebase?.sign_in_provider || "unknown",
      };
      await userDocRef.set(userData);
    } else {
      userData = userDoc.data();
      if (picture !== userData.googlePhotoURL) {
        await userDocRef.update({
          googlePhotoURL: picture || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        userData.googlePhotoURL = picture;
      }

      let finalPhotoURL = userData.photoURL;
      if (userData.photoPublicId) {
        finalPhotoURL = userData.photoURL;
      } else if (picture) {
        finalPhotoURL = picture;
      } else if (userData.googlePhotoURL) {
        finalPhotoURL = userData.googlePhotoURL;
      }

      if (finalPhotoURL !== userData.photoURL) {
        await userDocRef.update({
          photoURL: finalPhotoURL,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        userData.photoURL = finalPhotoURL;
      }
    }

    // Block token verification for deactivated/restricted accounts
    const isDeactivatedT =
      userData?.status === "deactivated" || userData?.isActive === false;
    const isRestrictedT =
      userData?.status === "restricted" || userData?.isRestricted === true;
    if (isDeactivatedT || isRestrictedT) {
      return res
        .status(403)
        .json({ success: false, message: "Account is inactive or restricted" });
    }

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
        seller: sellerData,
        sellerAvatarUrl: sellerData?.avatarUrl,
      },
    });
  } catch (err) {
    const errMsg = err && err.message ? err.message : "Invalid token";
    console.error("/token-verify error:", errMsg, err);
    if (process.env.NODE_ENV !== "production") {
      return res.status(401).json({ success: false, message: errMsg });
    }
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
});

// Get current user profile
router.get("/profile", verifyAuth, async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get();

    if (!userDoc.exists) {
      console.warn(`User document not found for uid: ${req.user.uid}`);
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    const userData = userDoc.data();
    let sellerData = null;

    if (userData.role === "seller") {
      const sellerDoc = await db.collection("sellers").doc(req.user.uid).get();
      if (sellerDoc.exists) {
        sellerData = sellerDoc.data();
      }
    }

    // Ensure all required fields are present with consistent naming
    const user = {
      uid: userDoc.id,
      email: userData.email || req.user.email,
      displayName: userData.displayName,
      username: userData.username || null,
      role: userData.role || "buyer",
      isSeller: userData.role === "seller",
      isAdmin: userData.isAdmin === true,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      // Profile fields
      birthday: userData.birthday || null,
      contact: userData.contact || null,
      addressLine: userData.addressLine || null,
      barangay: userData.barangay || null,
      city: userData.city || null,
      province: userData.province || null,
      zipCode: userData.zipCode || null,
      // Avatar fields - return photoURL as avatarUrl for frontend
      photoURL: userData.photoURL || null,
      photoPublicId: userData.photoPublicId || null,
      avatarUrl: userData.photoURL || userData.googlePhotoURL || null,
      googlePhotoURL: userData.googlePhotoURL || null,
      // Seller fields
      sellerApplication: userData.sellerApplication || null,
      seller: sellerData,
      storeName: sellerData?.storeName,
      sellerAvatarUrl: sellerData?.avatarUrl,
    };

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
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
      avatarUrl,
      photoURL,
    } = req.body;

    // Validate username if provided
    if (username && username.trim()) {
      // Check if username is already taken by another user
      const existingUser = await db
        .collection("users")
        .where("username", "==", username.trim())
        .get();

      if (!existingUser.empty) {
        // Check if it's the current user's username
        const existingUserDoc = existingUser.docs[0];
        if (existingUserDoc.id !== req.user.uid) {
          return res.status(400).json({
            success: false,
            message: "Username is already taken",
          });
        }
      }
    }

    const userRef = db.collection("users").doc(req.user.uid);
    const userDoc = await userRef.get();

    // Prepare update data
    const updates = {
      username: username ? username.trim() : undefined,
      birthday: birthday || undefined,
      contact: contact || undefined,
      addressLine: addressLine || undefined,
      barangay: barangay || undefined,
      city: city || undefined,
      province: province || undefined,
      zipCode: zipCode || undefined,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Handle avatar URL - normalize both avatarUrl and photoURL to photoURL in DB
    const photo = avatarUrl || photoURL;
    if (photo) {
      updates.photoURL = photo;
    }

    // Remove undefined fields
    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key],
    );

    // If user document doesn't exist, create it with these fields
    if (!userDoc.exists) {
      updates.uid = req.user.uid;
      updates.email = req.user.email;
      updates.role = "buyer";
      updates.createdAt = admin.firestore.FieldValue.serverTimestamp();
      await userRef.set(updates);
    } else {
      // Otherwise just update the fields
      await userRef.update(updates);
    }

    // Fetch and return updated user data with all fields
    const updatedDoc = await userRef.get();
    const userData = updatedDoc.data();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        uid: updatedDoc.id,
        email: userData.email,
        displayName: userData.displayName,
        username: userData.username,
        role: userData.role,
        birthday: userData.birthday || null,
        contact: userData.contact || null,
        addressLine: userData.addressLine || null,
        barangay: userData.barangay || null,
        city: userData.city || null,
        province: userData.province || null,
        zipCode: userData.zipCode || null,
        avatarUrl: userData.photoURL || userData.googlePhotoURL || null,
        photoURL: userData.photoURL || null,
        sellerApplication: userData.sellerApplication || null,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
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

      const userDoc = await db.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();

      // Delete old avatar if it exists
      if (userData && userData.photoPublicId) {
        try {
          await deleteImage(userData.photoPublicId);
        } catch (error) {
          console.warn("Could not delete old avatar:", error.message);
        }
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
      console.error("Avatar upload error:", error);
      res.status(500).json({
        success: false,
        message: "Avatar upload failed",
        error: error.message,
      });
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
// SELLER ROUTES
// ============================================

router.get("/seller/:sellerId/payment-details", async (req, res) => {
  try {
    const { sellerId } = req.params;
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

// ============================================
// ADMIN ROUTES
// ============================================

router.put("/admin/block-seller/:sellerId", verifyAuth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { sellerId } = req.params;
    const { blocked } = req.body;

    const sellerDoc = await db.collection("sellers").doc(sellerId).get();
    if (!sellerDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    await db
      .collection("sellers")
      .doc(sellerId)
      .update({
        blocked: !!blocked,
        blockedAt: blocked
          ? admin.firestore.FieldValue.serverTimestamp()
          : null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    await db.collection("users").doc(sellerId).update({
      blocked: !!blocked,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      message: blocked
        ? "Seller blocked successfully"
        : "Seller unblocked successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update seller status",
    });
  }
});

router.put("/admin/recover-account/:userId", verifyAuth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { userId } = req.params;
    const { reason } = req.body;

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await admin.auth().updateUser(userId, { disabled: false });

    await db
      .collection("users")
      .doc(userId)
      .update({
        disabled: false,
        recoveredAt: admin.firestore.FieldValue.serverTimestamp(),
        recoveryReason: reason || "Admin recovery",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    res.json({
      success: true,
      message: "Account recovered successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to recover account",
    });
  }
});

export default router;
