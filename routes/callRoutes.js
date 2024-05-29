const express = require('express');
const { bookCall, markCallSuccess } = require('../controllers/callController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/', protect, bookCall);
router.put('/success/:id', protect, markCallSuccess);

module.exports = router;
