const router = require("express").Router();
const {
  uploadFile,
  uploadFiles,
  downloadFile,
} = require("../controllers/upload");
const {
  uploadSingle,
  uploadMultiple,
  handleMulterError,
} = require("../middlewares/upload");
const auth = require("../middlewares/auth");
const adminMiddleware = require("../middlewares/admin");

// Upload single file
router.post("/single", uploadSingle, handleMulterError, uploadFile);

// Upload multiple files
router.post("/multiple", uploadMultiple, handleMulterError, uploadFiles);

// Proxy download a Cloudinary file (admin only)
router.get("/download", auth, adminMiddleware, downloadFile);

module.exports = router;
