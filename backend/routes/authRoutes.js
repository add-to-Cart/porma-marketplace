import express from "express";
import admin from "../config/firebaseAdmin.js";
import { verifyAuth } from "../middleware/auth.js";
import multer from "multer";
import { uploadAvatar } from "../services/cloudinary_service.js";

const router = express.Router();
const upload = multer();

// Sign up with email and password
router.post("/signup", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // Validate input
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

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || email.split("@")[0],
    });

    // Create user document in Firestore
    const db = admin.firestore();
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      role: "buyer", // Default role
    });

    // Generate custom token for immediate login
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

    if (error.code === "auth/invalid-email") {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (error.code === "auth/weak-password") {
      return res.status(400).json({
        success: false,
        message: "Password is too weak",
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

    // Validate input
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier and password are required",
      });
    }

    let email = identifier;
    let snapshot = null;
    // If identifier doesn't contain @, treat as username
    if (!identifier.includes("@")) {
      const db = admin.firestore();
      const usersRef = db.collection("users");
      snapshot = await usersRef
        .where("displayName", "==", identifier)
        .limit(1)
        .get();

      // If not found, try to find admin user
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

      // For admin users, use default email if not set
      if (userData.isAdmin && !email) {
        email = "admin@admin.com";
      }
    }

    // Verify user credentials and get user record
    let userRecord;
    let foundUserDoc = null;
    if (!identifier.includes("@")) {
      // Already found userDoc above
      foundUserDoc = snapshot.docs[0];
    }

    // For admin email login
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
        // Create admin user in Firebase Auth if not exists
        userRecord = await admin.auth().createUser({
          uid: foundUserDoc.id,
          email,
          password,
        });
      } else {
        throw error;
      }
    }

    // Generate custom token for client-side authentication
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    // Get user data from Firestore
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
        sellerApplication: userData?.sellerApplication,
      },
      customToken,
    });
  } catch (error) {
    console.error("Signin error:", error);

    if (error.code === "auth/user-not-found") {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (error.code === "auth/wrong-password") {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    if (error.code === "auth/invalid-email") {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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

    // Verify the ID token with Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    // Check if user exists in Firestore, create if not
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(uid).get();

    let userData;
    if (!userDoc.exists) {
      // Create new user document
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
      // Update photo URL if it's different
      if (picture && picture !== userData.photoURL) {
        await db.collection("users").doc(uid).update({
          photoURL: picture,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        userData.photoURL = picture;
      }
    }

    // Generate custom token for client-side authentication
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

// Generic token verify / sign-in using Firebase ID token
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
      // update photo if changed
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
        avatarUrl: userData.photoURL,
        role: userData.role,
        sellerApplication: userData.sellerApplication,
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
        role: userData.role,
        createdAt: userData.createdAt,
        username: userData.username,
        birthday: userData.birthday,
        contact: userData.contact,
        addressLine: userData.addressLine,
        barangay: userData.barangay,
        city: userData.city,
        province: userData.province,
        zipCode: userData.zipCode,
        avatarUrl: userData.photoURL,
        sellerApplication: userData.sellerApplication,
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

      // Upload to Cloudinary via service
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

// Sign out (client-side token invalidation)
router.post("/signout", verifyAuth, async (req, res) => {
  try {
    // In Firebase, sign out is handled client-side
    // We can revoke refresh tokens if needed
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

// Apply to become seller
router.post("/apply-seller", verifyAuth, async (req, res) => {
  try {
    const { storeName, storeDescription } = req.body;
    const db = admin.firestore();

    // Prevent already-approved sellers from applying again
    if (req.user && req.user.role === "seller") {
      return res
        .status(400)
        .json({ success: false, message: "You are already a seller" });
    }

    // Prevent duplicate pending applications
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
      .doc(req.user.uid)
      .update({
        sellerApplication: {
          status: "pending",
          storeName: storeName || null,
          storeDescription: storeDescription || null,
          appliedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      });

    res.json({
      success: true,
      message: "Application submitted successfully",
    });
  } catch (error) {
    console.error("Apply seller error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get seller applications (admin only)
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
      applications.push({ uid: doc.id, ...doc.data() });
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

// Seller update requests (admin can fetch pending requests)
router.get("/seller-update-requests", verifyAuth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const db = admin.firestore();
    const usersRef = db.collection("users");
    const snapshot = await usersRef
      .where("sellerUpdateRequest.status", "==", "pending")
      .get();

    const requests = [];
    snapshot.forEach((doc) => {
      requests.push({ uid: doc.id, ...doc.data() });
    });

    res.json({ success: true, requests });
  } catch (error) {
    console.error("Get seller update requests error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Seller submits an update request
router.post("/request-seller-update", verifyAuth, async (req, res) => {
  try {
    const { requestedFields } = req.body || {};
    const db = admin.firestore();

    if (!requestedFields || Object.keys(requestedFields).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No fields provided" });
    }

    // Save request under user's document
    await db
      .collection("users")
      .doc(req.user.uid)
      .update({
        sellerUpdateRequest: {
          status: "pending",
          requestedFields,
          requestedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      });

    res.json({ success: true, message: "Update request submitted" });
  } catch (error) {
    console.error("Request seller update error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Admin approves a seller update request and applies changes
router.put("/approve-seller-update/:uid", verifyAuth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { uid } = req.params;
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const userData = userDoc.data();
    const request = userData.sellerUpdateRequest;
    if (!request || request.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "No pending request" });
    }

    const updates = request.requestedFields || {};

    // Apply updates to user document and mark request approved
    await db
      .collection("users")
      .doc(uid)
      .update({
        ...updates,
        "sellerUpdateRequest.status": "approved",
        "sellerUpdateRequest.approvedAt":
          admin.firestore.FieldValue.serverTimestamp(),
      });

    res.json({ success: true, message: "Update approved" });
  } catch (error) {
    console.error("Approve seller update error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Approve seller application
router.put("/approve-seller/:uid", verifyAuth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { uid } = req.params;
    const db = admin.firestore();

    await db.collection("users").doc(uid).update({
      role: "seller",
      "sellerApplication.status": "approved",
      "sellerApplication.approvedAt":
        admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      message: "Application approved",
    });
  } catch (error) {
    console.error("Approve seller error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Reject seller application
router.put("/reject-seller/:uid", verifyAuth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { uid } = req.params;
    const db = admin.firestore();

    await db.collection("users").doc(uid).update({
      "sellerApplication.status": "rejected",
      "sellerApplication.rejectedAt":
        admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      message: "Application rejected",
    });
  } catch (error) {
    console.error("Reject seller error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
