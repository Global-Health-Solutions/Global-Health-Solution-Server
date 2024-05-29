const express = require('express');
const userRoutes = require('./userRoutes');
const specialistRoutes = require('./specialistRoutes');
const callRoutes = require('./callRoutes');

const router = express.Router();

router.use('/api/users', userRoutes);
router.use('/api/specialists', specialistRoutes);
router.use('/api/calls', callRoutes);

module.exports = router;
