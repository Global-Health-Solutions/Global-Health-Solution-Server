const express = require('express');
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
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
const uploadDir = path.join(projectRoot, 'uploads', 'profile-images');

// Create the directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const profileImageStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(null, `user-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

function checkProfileImageType(file, cb) {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Profile image must be in JPEG, JPG, or PNG format');
  }
}

const uploadProfileImage = multer({
  storage: profileImageStorage,
  fileFilter: function (req, file, cb) {
    checkProfileImageType(file, cb);
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|pdf|doc/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Files must be in JPEG, PDF, or DOC format');
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Register route with file uploads for specialists
router.post(
  '/register',
  upload.fields([
    { name: 'currentPracticingLicense', maxCount: 1 },
    { name: 'fullRegistrationCertificate', maxCount: 1 },
  ]),
  registerUser
);

router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', authUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, uploadProfileImage.single('profileImage'), updateUserProfile);
router.put('/availability', protect, updateUserAvailability);

module.exports = router;


