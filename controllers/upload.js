const {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
} = require("../utils/cloudinary");
const {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} = require("../errors/errors");

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
    const { url, filename: queryFilename } = req.query;

    if (!url || !url.startsWith("https://res.cloudinary.com/")) {
      throw new BadRequestError("Invalid file URL");
    }

    // Fetch the Cloudinary URL directly.
    let response = await fetch(url);

    // Some older raw URLs were stored with a .pdf suffix variant that can return
    // 401/404 depending on account settings. Retry without the suffix when applicable.
    if (
      !response.ok &&
      /\/raw\/upload\//.test(url) &&
      /\.pdf($|\?)/i.test(url)
    ) {
      const retryUrl = url.replace(/\.pdf(?=$|\?)/i, "");
      const retryResponse = await fetch(retryUrl);
      if (retryResponse.ok) {
        response = retryResponse;
      }
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new NotFoundError("File not found in Cloudinary");
      }

      if (response.status === 401 || response.status === 403) {
        throw new ForbiddenError(
          "File access is restricted in Cloudinary for this legacy URL",
        );
      }

      throw new BadRequestError(`Cloudinary fetch failed: ${response.status}`);
    }

    // Use the original filename passed from Admin.jsx (stored in the order as file.name)
    // so the admin receives the file with the customer's original filename.
    const urlFilename = decodeURIComponent(
      new URL(url).pathname.split("/").pop(),
    );
    const deliveryFilename = queryFilename || urlFilename;

    const ext = deliveryFilename.split(".").pop().toLowerCase();
    const mimeMap = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      svg: "image/svg+xml",
    };
    const contentType =
      mimeMap[ext] ||
      response.headers.get("content-type") ||
      "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${deliveryFilename}"`,
    );

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
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
