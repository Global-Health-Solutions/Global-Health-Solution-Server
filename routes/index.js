const express = require('express');
const userRoutes = require('./userRoutes');
// const specialistRoutes = require('./specialistRoutes');
const callRoutes = require('./callRoutes');

const chatbotRoutes = require('./chatbotRoutes')

const paymentRoutes = require('./paymentRoutes')


const baseRoute = process.env.MODE === "production" ? '' : '/api';

const router = express.Router();

router.use(`${baseRoute}/users`, userRoutes);
// router.use('/api/specialists', specialistRoutes);
router.use(`${baseRoute}/calls`, callRoutes);

router.use(`${baseRoute}/chatbot`, chatbotRoutes)

router.use(`${baseRoute}/payment`, paymentRoutes)

module.exports = router;
