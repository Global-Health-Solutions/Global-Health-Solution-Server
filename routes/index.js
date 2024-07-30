const express = require('express');

const userRoutes = require('./userRoutes');

const callRoutes = require('./callRoutes');

const chatbotRoutes = require('./chatbotRoutes')

const paymentRoutes = require('./paymentRoutes');

const adminRoutes = require('./adminRoutes');


const router = express.Router();

router.use(`/users`, userRoutes);

// router.user('/users', (req, res) => {
//   console.log('it is working ')
//   res.json({ message: 'This is the get-calls route' });
// });

router.use(`/calls`, callRoutes);

router.use(`/chatbot`, chatbotRoutes)

router.use(`/payment`, paymentRoutes)

router.use('/admin', adminRoutes);

module.exports = router;
