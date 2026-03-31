const multer = require("multer");
const path = require("path");
const { BadRequestError } = require("../errors/errors");

// Configure multer for memory storage (files will be uploaded to Cloudinary)
const storage = multer.memoryStorage();

// File filter to accept only specific file types
const fileFilter = (req, file, cb) => {
  // Allowed file extensions
  const allowedExtensions = [
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".ai",
    ".psd",
    ".eps",
  ];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        `Invalid file type. Allowed types: ${allowedExtensions.join(", ")}`,
      ),
      false,
    );
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Middleware for single file upload
const uploadSingle = upload.single("file");

// Middleware for multiple file uploads (up to 10 files)
const uploadMultiple = upload.array("files", 10);

// Error handler for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new BadRequestError("File size exceeds 50MB limit"));
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return next(new BadRequestError("Maximum 10 files allowed"));
    }
    return next(new BadRequestError(`Upload error: ${err.message}`));
  }
  next(err);
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleMulterError,
};
