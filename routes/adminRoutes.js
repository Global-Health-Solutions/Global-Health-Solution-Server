// routes/adminRoutes.js
const express = require('express');
const {
  registerAdmin,
  authAdmin,
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', registerAdmin);
router.post('/login', authAdmin);

// Protect all routes below with adminProtect
router.use(protect);

module.exports = router;
