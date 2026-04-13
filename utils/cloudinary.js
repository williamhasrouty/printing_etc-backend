const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = require("../config/config");

// Configure Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// Upload file buffer to Cloudinary
const uploadToCloudinary = (
  fileBuffer,
  folder = "printing-etc",
  mimetype = "",
  filename = "",
) => {
  return new Promise((resolve, reject) => {
    // Use "auto" for all files including PDFs.
    // "raw" resource type requires authentication on free Cloudinary accounts.
    // Cloudinary supports PDFs under the "image" type (auto-detected) and serves them publicly.
    const resourceType = "auto";

    // Preserve original filename as public_id
    let publicIdOptions = {};
    if (filename) {
      const nameWithoutExt = filename.replace(/\.[^.]+$/, "");
      publicIdOptions = {
        public_id: `${nameWithoutExt}_${Date.now()}`,
      };
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        ...publicIdOptions,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            size: result.bytes,
          });
        }
      },
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// Delete file from Cloudinary
const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

// Upload multiple files
const uploadMultipleToCloudinary = async (files, folder = "printing-etc") => {
  const uploadPromises = files.map((file) =>
    uploadToCloudinary(file.buffer, folder, file.mimetype, file.originalname),
  );
  return Promise.all(uploadPromises);
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadMultipleToCloudinary,
};
