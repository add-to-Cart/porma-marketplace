import dotenv from "dotenv";
dotenv.config();

import cloudinary from "../config/cloudinary.js";

/**
 * Upload user avatar using Cloudinary SDK upload_stream
 */
export const uploadAvatar = (file, publicId = null) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: "avatars",
      resource_type: "image",
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET_AVATAR,
    };

    if (publicId) uploadOptions.public_id = publicId;

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );

    stream.end(file.buffer);
  });
};

/**
 * Mature approach: Use the Cloudinary SDK upload_stream for product images.
 * It is more stable for Node.js than manual fetch calls.
 */
export const uploadProductImage = (file, publicId = null) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: "products",
      resource_type: "auto",
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET_PRODUCT,
    };

    if (publicId) uploadOptions.public_id = publicId;

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    stream.end(file.buffer);
  });
};

export const uploadQr = (file, publicId = null) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: "qr",
      resource_type: "image",
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET_QR,
    };

    if (publicId) uploadOptions.public_id = publicId;

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );

    stream.end(file.buffer);
  });
};

/**
 * (Optional) Generate transformed image URL
 */
export const getTransformedImageUrl = ({
  publicId,
  width = 300,
  height = 300,
  crop = "fill",
}) => {
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},h_${height},c_${crop}/${publicId}.jpg`;
};

/**
 * ⚠️ Image deletion must be handled server-side for security
 */
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw error;
  }
};
