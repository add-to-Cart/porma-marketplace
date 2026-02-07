import admin from "../config/firebaseAdmin.js";
const db = admin.firestore();
import { uploadProductImage } from "../services/cloudinary_service.js";
import { generateSearchTags } from "./productController.js";
import { getSellerStockStatus } from "../utils/stockManagement.js";

export const createProduct = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Product creation failed: An image is required.",
      });
    }

    const {
      name,
      categories,
      description,
      price,
      stock,
      compareAtPrice,
      isSeasonal,
      isBundle,
      seasonalCategory,
      vehicleCompatibility,
      isUniversalFit,
      sellerId,
      storeName,
    } = req.body;
    const parsedCategories = JSON.parse(categories || "[]");

    const productData = {
      name: name.trim(),
      categories: parsedCategories,
      description: description.trim(),
      price: Number(price) || 0,
      stock: Number(stock) || 1,
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      isSeasonal: isSeasonal === "true",
      seasonalCategory: seasonalCategory ? seasonalCategory.trim() : null,
      isBundle: isBundle === "true",
      vehicleCompatibility: vehicleCompatibility
        ? JSON.parse(vehicleCompatibility)
        : {},
      isUniversalFit: isUniversalFit === "true",
      sellerId: sellerId || null,
      storeName: storeName || null,
    };

    if (typeof productData.vehicleCompatibility === "string") {
      productData.vehicleCompatibility = JSON.parse(
        productData.vehicleCompatibility,
      );
    }

    productData.price = Number(productData.price);

    if (productData.compareAtPrice) {
      productData.compareAtPrice = Number(productData.compareAtPrice);
    }

    if (
      productData.bundleContents &&
      typeof productData.bundleContents === "string"
    ) {
      try {
        productData.bundleContents = JSON.parse(productData.bundleContents);
      } catch (e) {
        productData.bundleContents = productData.bundleContents
          .split(",")
          .map((item) => item.trim());
      }
    }

    productData.ratingAverage = 0;
    productData.ratingsCount = 0;
    productData.viewCount = 0;
    productData.soldCount = 0;
    productData.isAvailable = true;

    productData.searchTags = generateSearchTags(productData);

    const userId = productData.sellerId || "anonymous";
    const sanitizedName = productData.name
      .replace(/[&]/g, "and")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();

    const publicId = `products/${userId}-${sanitizedName}`;

    const uploadResult = await uploadProductImage(req.file, publicId);
    productData.imageUrl = uploadResult.url;
    productData.cloudinaryId = uploadResult.publicId;

    const docRef = await db.collection("products").add({
      ...productData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ id: docRef.id, ...productData });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.categories && typeof updateData.categories === "string") {
      updateData.categories = JSON.parse(updateData.categories);
    }

    if (typeof updateData.vehicleCompatibility === "string") {
      updateData.vehicleCompatibility = JSON.parse(
        updateData.vehicleCompatibility,
      );
    }

    if (updateData.isBundle !== undefined) {
      updateData.isBundle = updateData.isBundle === "true";
    }
    if (updateData.isSeasonal !== undefined) {
      updateData.isSeasonal = updateData.isSeasonal === "true";
    }
    if (updateData.compareAtPrice) {
      updateData.compareAtPrice = Number(updateData.compareAtPrice);
    }
    if (
      updateData.bundleContents &&
      typeof updateData.bundleContents === "string"
    ) {
      try {
        updateData.bundleContents = JSON.parse(updateData.bundleContents);
      } catch (e) {
        updateData.bundleContents = updateData.bundleContents
          .split(",")
          .map((item) => item.trim());
      }
    }

    const docRef = db.collection("products").doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const currentData = snapshot.data();

    const fullData = {
      ...currentData,
      ...updateData,
      vehicleCompatibility: {
        ...(currentData.vehicleCompatibility || {}),
        ...(updateData.vehicleCompatibility || {}),
      },
    };

    const updatedSearchTags = generateSearchTags(fullData);

    if (req.file) {
      const userId = updateData.sellerId || currentData.sellerId || "anonymous";
      const sanitizedName = (updateData.name || currentData.name)
        .replace(/[&]/g, "and")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase();
      const publicId = `products/${userId}-${sanitizedName}`;
      const uploadResult = await uploadProductImage(req.file, publicId);
      updateData.imageUrl = uploadResult.url;
      updateData.cloudinaryId = uploadResult.publicId;
    }

    const finalUpdate = {
      ...updateData,
      searchTags: updatedSearchTags,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await docRef.update(finalUpdate);

    res.json({ id, ...finalUpdate });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update product", error: err.message });
  }
};

export const getSellerInventoryStatus = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res.status(400).json({ message: "Seller ID is required" });
    }

    const inventory = await getSellerStockStatus(sellerId);

    res.json({
      sellerId,
      totalProducts: inventory.length,
      outOfStockCount: inventory.filter((p) => p.isOutOfStock).length,
      lowStockCount: inventory.filter((p) => p.isLowStock).length,
      products: inventory,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to get inventory status", error: err.message });
  }
};

export const replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { replyText } = req.body;
    const sellerId = req.user.uid; // Get from authenticated user

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: "Review ID is required",
      });
    }

    if (!replyText || replyText.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Reply text is required",
      });
    }

    const reviewDoc = await db.collection("reviews").doc(reviewId).get();

    if (!reviewDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const review = reviewDoc.data();

    const productDoc = await db
      .collection("products")
      .doc(review.productId)
      .get();

    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = productDoc.data();

    if (product.sellerId !== sellerId) {
      return res.status(403).json({
        success: false,
        message: "You can only reply to reviews on your own products",
      });
    }

    const updateData = {
      sellerReply: {
        text: replyText.trim(),
        repliedAt: admin.firestore.FieldValue.serverTimestamp(),
        sellerId: sellerId,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("reviews").doc(reviewId).update(updateData);

    res.json({
      success: true,
      message: "Reply added successfully",
      sellerReply: {
        text: replyText.trim(),
        repliedAt: new Date(),
        sellerId: sellerId,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to add reply",
      error: err.message,
    });
  }
};

export default {
  createProduct,
  updateProduct,
  getSellerInventoryStatus,
  replyToReview,
};
