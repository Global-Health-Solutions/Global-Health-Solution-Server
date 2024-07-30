// routes/adminRoutes.js
const express = require('express');
const {
  registerAdmin,
  authAdmin,
} = require('../controllers/userController');
const { adminProtect } = require('../middlewares/adminMiddleware');

const router = express.Router();

router.post('/register', registerAdmin);
router.post('/login', authAdmin);

// Protect all routes below with adminProtect
router.use(adminProtect);

module.exports = router;
