const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    specialist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dateTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "no-show"],
      default: "scheduled",
    },
    specialistCategory: {
      type: String,
      required: true,
    },
    notes: String,
    reason: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
      default: 30,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    dayOfReminderSent: {
      type: Boolean,
      default: false,
    },
    cancellationReason: String,
    cancelledBy: {
      type: String,
      enum: ["patient", "doctor", "system", null],
      default: null,
    },
    availabilitySlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Availability",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
appointmentSchema.index({ patient: 1, dateTime: 1 });
appointmentSchema.index({ specialist: 1, dateTime: 1 });
appointmentSchema.index({ status: 1, dateTime: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
