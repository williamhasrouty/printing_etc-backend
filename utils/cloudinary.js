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
    // Determine resource type - PDFs must use "raw", images can use "auto"
    const isPDF = mimetype === "application/pdf";
    const resourceType = isPDF ? "raw" : "auto";

    // For raw files, extract extension from filename to preserve file type
    let publicIdOptions = {};
    if (resourceType === "raw" && filename) {
      // Use filename without extension as public_id (Cloudinary will add format)
      const nameWithoutExt = filename.replace(/\.[^.]+$/, "");
      const ext = filename.match(/\.([^.]+)$/)?.[1] || "";
      publicIdOptions = {
        public_id: `${folder}/${nameWithoutExt}_${Date.now()}`,
        format: ext, // Explicitly set format to preserve extension
      };
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        ...publicIdOptions,
        // Don't set allowed_formats for raw uploads
        ...(resourceType !== "raw" && {
          allowed_formats: ["jpg", "jpeg", "png", "ai", "psd", "eps"],
        }),
        // For PDFs and raw files, prevent any conversion or processing
        ...(resourceType === "raw" && {
          flags: "attachment", // Serve as download, not preview
          quality_analysis: false, // Disable quality analysis
        }),
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
