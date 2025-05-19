const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const {
  setAvailability,
  getAvailableSlots,
  bookAppointment,
  cancelAppointment,
  getUserAppointments,
} = require('../controllers/appointmentController');

const router = express.Router();

// Doctor routes
router.post('/availability', protect, authorize('specialist'), setAvailability);

// Patient routes
router.get('/available-slots', protect, getAvailableSlots);
router.post('/book', protect, bookAppointment);
router.post('/cancel', protect, cancelAppointment);

// Common routes
router.get('/my-appointments', protect, getUserAppointments);

module.exports = router;
