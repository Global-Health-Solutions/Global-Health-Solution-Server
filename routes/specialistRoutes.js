const express = require('express');
const { registerSpecialist, approveSpecialist } = require('../controllers/specialistController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/', registerSpecialist);
router.put('/approve/:id', protect, approveSpecialist);

module.exports = router;
