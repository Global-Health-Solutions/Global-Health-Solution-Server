const Appointment = require("../models/Appointment");
const Availability = require("../models/Availability");
const User = require("../models/User");
const { createAppointmentNotification } = require("../utils/notificationService");
const {
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendAppointmentDayReminder,
  sendAppointmentCancellation,
} = require("../utils/emailService");

// Set doctor availability
const setAvailability = async (req, res) => {
  try {
    const { date, timeSlots, isRecurring, recurringPattern } = req.body;
    const doctorId = req.user._id;

    // Validate date is not in the past
    if (new Date(date) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Cannot set availability for past dates",
      });
    }

    // Create or update availability
    const availability = await Availability.findOneAndUpdate(
      { doctor: doctorId, date },
      {
        doctor: doctorId,
        date,
        timeSlots,
        isRecurring,
        recurringPattern,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error setting availability",
      error: error.message,
    });
  }
};

// Get available slots for a specialty
const getAvailableSlots = async (req, res) => {
  try {
    const { specialty, date } = req.query;

    // Find all doctors in the specialty
    const doctors = await User.find({
      role: "specialist",
      specialistCategory: specialty,
      isApproved: true,
    });

    const doctorIds = doctors.map((doctor) => doctor._id);

    // Get all availabilities for these doctors on the specified date
    const availabilities = await Availability.find({
      doctor: { $in: doctorIds },
      date,
      "timeSlots.isBooked": false,
    }).populate("doctor", "firstName lastName specialistCategory");

    res.status(200).json({
      success: true,
      data: availabilities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching available slots",
      error: error.message,
    });
  }
};

// Book an appointment
const bookAppointment = async (req, res) => {
  try {
    const { availabilityId, timeSlotIndex, reason } = req.body;
    const patientId = req.user._id;

    // Get availability
    const availability = await Availability.findById(availabilityId);
    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability slot not found",
      });
    }

    // Check if slot is still available
    if (availability.timeSlots[timeSlotIndex].isBooked) {
      return res.status(400).json({
        success: false,
        message: "This time slot is no longer available",
      });
    }

    // Create appointment
    const appointment = new Appointment({
      patient: patientId,
      specialist: availability.doctor,
      dateTime: new Date(availability.date),
      specialistCategory: availability.doctor.specialistCategory,
      reason,
      availabilitySlot: availabilityId,
    });

    // Update availability
    availability.timeSlots[timeSlotIndex].isBooked = true;
    availability.timeSlots[timeSlotIndex].appointmentId = appointment._id;
    await availability.save();

    // Save appointment
    await appointment.save();

    // Get patient and doctor details for notifications
    const [patient, doctor] = await Promise.all([
      User.findById(patientId),
      User.findById(availability.doctor),
    ]);

    // Send notifications
    await Promise.all([
      createAppointmentNotification(appointment, patient, "scheduled"),
      createAppointmentNotification(appointment, doctor, "scheduled"),
    ]);

    // Send confirmation emails
    await Promise.all([
      sendAppointmentConfirmation(appointment, patient),
      sendAppointmentConfirmation(appointment, doctor),
    ]);

    res.status(201).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error booking appointment",
      error: error.message,
    });
  }
};

// Cancel an appointment
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId, cancellationReason } = req.body;
    const userId = req.user._id;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if user is authorized to cancel
    if (
      appointment.patient.toString() !== userId.toString() &&
      appointment.specialist.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this appointment",
      });
    }

    // Update appointment
    appointment.status = "cancelled";
    appointment.cancellationReason = cancellationReason;
    appointment.cancelledBy =
      appointment.patient.toString() === userId.toString() ? "patient" : "doctor";
    await appointment.save();

    // Update availability
    const availability = await Availability.findById(appointment.availabilitySlot);
    const timeSlot = availability.timeSlots.find(
      (slot) => slot.appointmentId.toString() === appointmentId
    );
    if (timeSlot) {
      timeSlot.isBooked = false;
      timeSlot.appointmentId = null;
      await availability.save();
  }

    // Get patient and doctor details for notifications
    const [patient, doctor] = await Promise.all([
      User.findById(appointment.patient),
      User.findById(appointment.specialist),
    ]);

    // Send notifications
    await Promise.all([
      createAppointmentNotification(appointment, patient, "cancelled"),
      createAppointmentNotification(appointment, doctor, "cancelled"),
    ]);

    // Send cancellation emails
    await Promise.all([
      sendAppointmentCancellation(appointment, patient),
      sendAppointmentCancellation(appointment, doctor),
    ]);

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cancelling appointment",
      error: error.message,
    });
  }
};

// Get user's appointments
const getUserAppointments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, upcoming } = req.query;

    const query = {
      $or: [{ patient: userId }, { specialist: userId }],
    };

    if (status) {
      query.status = status;
    }

    if (upcoming === "true") {
      query.dateTime = { $gte: new Date() };
    }

    const appointments = await Appointment.find(query)
      .populate("patient", "firstName lastName email")
      .populate("specialist", "firstName lastName email specialistCategory")
      .sort({ dateTime: 1 });

    res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching appointments",
      error: error.message,
    });
  }
};

module.exports = {
  setAvailability,
  getAvailableSlots,
  bookAppointment,
  cancelAppointment,
  getUserAppointments,
};
