const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/predict_disease', async (req, res) => {
  try {
    const { symptoms } = req.body;
    const response = await axios.post('https://aiconsultdemo.onrender.com/predict_disease', { symptoms });
    res.json(response.data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'An error occurred while processing your request.' });
  }
});

module.exports = router;
