const express = require("express");
const {
  registerSpecialist,
  verifyOTP,
  resendOTP,
  authSpecialist,
  forgotPassword,
  resetPassword,
  getSpecialistProfile,
  updateSpecialistProfile,
} = require("../controllers/specialistController");
const { protect } = require("../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");
const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|pdf|doc/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Files must be in JPEG, PDF, or DOC format");
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Route to register a specialist with file uploads
router.post(
  "/",
  upload.fields([
    { name: "currentPracticingLicense", maxCount: 1 },
    { name: "fullRegistrationCertificate", maxCount: 1 },
  ]),
  registerSpecialist
);

// Route to verify OTP
router.post("/verify-otp", verifyOTP);

// Route to resend OTP
router.post("/resend-otp", resendOTP);

// Route to authenticate specialist and get token
router.post("/login", authSpecialist);

// Route to request password reset
router.post("/forgot-password", forgotPassword);

// Route to reset password
router.post("/reset-password/:token", resetPassword);

// Route to get specialist profile
router.get("/profile", protect, getSpecialistProfile);

// Route to update specialist profile
router.put("/profile", protect, updateSpecialistProfile);

module.exports = router;
