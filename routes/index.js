const express = require('express');

const userRoutes = require('./userRoutes');

const callRoutes = require('./callRoutes');

const chatbotRoutes = require('./chatbotRoutes')

const paymentRoutes = require('./paymentRoutes');



const router = express.Router();

router.use(`/users`, userRoutes);

router.use(`/calls`, callRoutes);

router.use(`/chatbot`, chatbotRoutes)

router.use(`/payment`, paymentRoutes)

module.exports = router;
