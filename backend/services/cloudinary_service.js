import dotenv from "dotenv";
dotenv.config();

const uploadToCloudinary = async (file, preset, publicId = null) => {
  const formData = new FormData();
  const blob = new Blob([file.buffer], { type: file.mimetype });
  formData.append("file", blob, file.originalname);
  formData.append("upload_preset", preset);

  if (publicId) {
    formData.append("public_id", publicId);
  }

  const response = await fetch(process.env.CLOUDINARY_BASE_URL, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Upload failed");

  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
};

/**
 * Upload user avatar
 */
export const uploadAvatar = async (file) => {
  return await uploadToCloudinary(
    file,
    process.env.CLOUDINARY_UPLOAD_PRESET_AVATAR,
  );
};

import cloudinary from "../config/cloudinary.js";

/**
 * Mature approach: Use the Cloudinary SDK upload_stream.
 * It is more stable for Node.js than manual fetch calls.
 */
export const uploadProductImage = (file, publicId = null) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: "porma_products",
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
export const deleteImage = async () => {
  throw new Error(
    "Image deletion requires a secure backend (not safe on client)",
  );
};
