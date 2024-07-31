const express = require("express");
const {
  registerUser,
  verifyOTP,
  resendOTP,
  authUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  updateUserAvailability,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const fs = require("fs");

const projectRoot = path.resolve(__dirname, "..");
const uploadProfileDir = path.join(projectRoot, "uploads", "profile-images");
const uploadLicenseDir = path.join(projectRoot, "uploads", "licenses");

// Create the directories if they don't exist
[uploadProfileDir, uploadLicenseDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Set up multer for file uploads
const profileImageStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadProfileDir);
  },
  filename(req, file, cb) {
    cb(
      null,
      `user-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const licenseStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadLicenseDir);
  },
  filename(req, file, cb) {
    cb(
      null,
      `license-${req.user ? req.user._id : "new"}-${Date.now()}${path.extname(
        file.originalname
      )}`
    );
  },
});

function checkFileType(file, cb, allowedTypes) {
  const filetypes = new RegExp(allowedTypes.join("|"));
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(`Files must be in ${allowedTypes.join(", ")} format`);
  }
}

const uploadProfileImage = multer({
  storage: profileImageStorage,
  fileFilter: (req, file, cb) =>
    checkFileType(file, cb, ["jpeg", "jpg", "png"]),
});

const uploadLicense = multer({
  storage: licenseStorage,
  fileFilter: (req, file, cb) =>
    checkFileType(file, cb, ["jpeg", "jpg", "pdf", "doc", "docx"]),
});

// Register route with file uploads for specialists
router.post(
  "/register",
  uploadLicense.single("currentPracticingLicense"),
  registerUser
);

router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", authUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(
    // protect,
    uploadProfileImage.single("profileImage"),
    uploadLicense.single("currentPracticingLicense"),
    updateUserProfile
  );
router.put("/availability", protect, updateUserAvailability);

module.exports = router;
