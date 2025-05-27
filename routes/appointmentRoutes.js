const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const {
  setAvailability,
  getDoctorAvailability,
  getDoctorAvailabilityRange,
  getAvailableSlots,
  getAvailableDates,
  bookAppointment,
  cancelAppointment,
  getUserAppointments,
  updateAppointmentStatus,
} = require('../controllers/appointmentController');

const router = express.Router();

// Doctor routes
router.post('/availability', protect, authorize('specialist'), setAvailability);
router.get('/availability', protect, authorize('specialist'), getDoctorAvailability);
router.get('/availability/range', protect, authorize('specialist'), getDoctorAvailabilityRange);
router.put('/update-status', protect, authorize('specialist'), updateAppointmentStatus);

// Patient routes
router.get('/available-slots', protect, getAvailableSlots);
router.get('/available-dates', protect, getAvailableDates);
router.post('/book', protect, bookAppointment);
router.post('/cancel', protect, cancelAppointment);

// Common routes
router.get('/my-appointments', protect, getUserAppointments);

module.exports = router;
