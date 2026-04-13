const {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
} = require("../utils/cloudinary");
const { BadRequestError } = require("../errors/errors");

// Upload single file
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError("No file provided");
    }

    console.log("Upload request received:", {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    const result = await uploadToCloudinary(
      req.file.buffer,
      "printing-etc/uploads",
      req.file.mimetype,
      req.file.originalname,
    );

    console.log("Upload successful:", result.publicId);

    res.status(200).send({
      url: result.url,
      publicId: result.publicId,
      format: result.format,
      size: result.size,
      name: req.file.originalname,
    });
  } catch (err) {
    console.error("Upload controller error:", err.message);
    console.error("Full error stack:", err.stack);
    next(err);
  }
};

// Upload multiple files
const uploadFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new BadRequestError("No files provided");
    }

    const results = await uploadMultipleToCloudinary(
      req.files,
      "printing-etc/uploads",
    );

    const formattedResults = results.map((result, index) => ({
      url: result.url,
      publicId: result.publicId,
      format: result.format,
      size: result.size,
      name: req.files[index].originalname,
    }));

    res.status(200).send(formattedResults);
  } catch (err) {
    next(err);
  }
};

// Proxy download a file from Cloudinary (avoids cross-origin restrictions in browser)
const downloadFile = async (req, res, next) => {
  try {
    const { url } = req.query;

    if (!url || !url.startsWith("https://res.cloudinary.com/")) {
      throw new BadRequestError("Invalid file URL");
    }

    // Extract public_id and resource_type from the Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud}/{resource_type}/upload/v{ver}/{public_id}.{ext}
    // Fully decode the pathname to handle single or double URL-encoding (%20 or %2520 spaces)
    const urlObj = new URL(url);
    const decodedPathname = decodeURIComponent(urlObj.pathname);
    const pathParts = decodedPathname.split("/").filter(Boolean);
    // pathParts: [cloud_name, resource_type, 'upload', 'v123', ...public_id_parts]
    const resourceType = pathParts[1] || "image";
    const uploadIndex = pathParts.indexOf("upload");
    let startIndex = uploadIndex + 1;
    // Skip version segment (e.g. v1234567)
    if (pathParts[startIndex] && /^v\d+$/.test(pathParts[startIndex])) {
      startIndex++;
    }
    const filenamePart = pathParts[pathParts.length - 1];
    const ext = filenamePart.includes(".") ? filenamePart.split(".").pop() : "";
    const publicId = pathParts
      .slice(startIndex)
      .join("/")
      .replace(/\.[^.]+$/, "");

    const { cloudinary } = require("../utils/cloudinary");

    // Generate a signed private download URL — bypasses "untrusted account" restriction
    const signedUrl = cloudinary.utils.private_download_url(publicId, ext, {
      resource_type: resourceType,
      type: "upload",
      attachment: true,
    });

    const response = await fetch(signedUrl);
    if (!response.ok) {
      throw new Error(`Cloudinary fetch failed: ${response.status}`);
    }

    const contentType =
      response.headers.get("content-type") || "application/octet-stream";

    const filename = decodeURIComponent(filenamePart);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Download proxy error:", err.message);
    next(err);
  }
};

module.exports = {
  uploadFile,
  uploadFiles,
  downloadFile,
};
