const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlots: [
      {
        startTime: {
          type: String,
          required: true,
        },
        endTime: {
          type: String,
          required: true,
        },
        isBooked: {
          type: Boolean,
          default: false,
        },
        appointmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Appointment",
        },
      },
    ],
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      type: String,
      enum: ["weekly", "biweekly", "monthly", null],
      default: null,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
availabilitySchema.index({ doctor: 1, date: 1 });

const Availability = mongoose.model("Availability", availabilitySchema);

module.exports = Availability; 