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

module.exports = {
  uploadFile,
  uploadFiles,
};
