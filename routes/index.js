const express = require('express');
const userRoutes = require('./userRoutes');
// const specialistRoutes = require('./specialistRoutes');
const callRoutes = require('./callRoutes');

const chatbotRoutes = require('./chatbotRoutes')


const router = express.Router();

router.use('/api/users', userRoutes);
// router.use('/api/specialists', specialistRoutes);
router.use('/api/calls', callRoutes);

router.use('/api/chatbot', chatbotRoutes)

module.exports = router;
