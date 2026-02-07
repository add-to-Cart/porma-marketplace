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

// ============================================
// ADMIN: BLOCK/UNBLOCK SELLER
// ============================================
router.put("/admin/block-seller/:sellerId", verifyAuth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { sellerId } = req.params;
    const { blocked } = req.body;
    const db = admin.firestore();

    const sellerDoc = await db.collection("sellers").doc(sellerId).get();
    if (!sellerDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // Update seller status
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

    // Also update user document
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

// ============================================
// ADMIN: RECOVER ACCOUNT
// ============================================
router.put("/admin/recover-account/:userId", verifyAuth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { userId } = req.params;
    const { reason } = req.body;
    const db = admin.firestore();

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Re-enable the user in Firebase Auth
    await admin.auth().updateUser(userId, { disabled: false });

    // Update user document
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
