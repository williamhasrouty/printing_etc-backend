const router = require("express").Router();
const { uploadFile, uploadFiles } = require("../controllers/upload");
const {
  uploadSingle,
  uploadMultiple,
  handleMulterError,
} = require("../middlewares/upload");

// Upload single file
router.post("/single", uploadSingle, handleMulterError, uploadFile);

// Upload multiple files
router.post("/multiple", uploadMultiple, handleMulterError, uploadFiles);

module.exports = router;
