// controllers/callController.js
const Call = require("../models/Call");
const User = require("../models/User");
const { default: mongoose } = require("mongoose");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const Appointment = require("../models/Appointment");
const { generateAgoraToken } = require("../utils/agora");

// Initiate a call
exports.initiateCall = async (req, res) => {
  const { appointmentId } = req.body;

  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate("patient", "id")
      .populate("specialist", "id isOnline");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (!appointment.specialist.isOnline) {
      return res.status(400).json({ message: "Specialist is not available" });
    }

    const channelName = `appointment_${appointment._id}`;
    const token = generateAgoraToken(channelName);

    const call = new Call({
      userId: appointment.patient._id,
      specialistId: appointment.specialist._id,
      channelName,
      specialistCategory: appointment.specialistCategory,
      status: "pending",
    });
    await call.save();

    res.json({
      callId: call._id,
      channelName,
      specialistId: appointment.specialist._id,
      token,
    });

    req.io.to(appointment.specialist._id.toString()).emit("incomingCall", {
      callId: call._id,
      channelName,
      callerId: appointment.patient._id,
      token,
    });
  } catch (error) {
    console.error("Error initiating call:", error);
    res.status(500).json({ message: "Failed to initiate call" });
  }
};

// Accept call
exports.acceptCall = async (req, res) => {
  const { callId } = req.body;

  try {
    const call = await Call.findByIdAndUpdate(
      callId,
      { status: "ongoing" },
      { new: true }
    );

    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }

    // Notify the user that the call was accepted
    req.io.to(call.userId.toString()).emit("callAccepted", {
      callId: call._id,
      channelName: call.channelName,
    });

    req.io.to(call.specialistId.toString()).emit("callAccepted", {
      callId: call._id,
      channelName: call.channelName,
    });

    res.json({ message: "Call accepted", call });
  } catch (error) {
    console.error("Error accepting call:", error);
    res.status(500).json({ message: "Failed to accept call" });
  }
};

// Reject call
exports.rejectCall = async (req, res) => {
  const { callId } = req.body;

  try {
    const call = await Call.findByIdAndUpdate(
      callId,
      { status: "rejected" },
      { new: true }
    );

    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }

    req.io
      .to(call.userId.toString())
      .emit("callRejected", { callId: call._id });

    res.json({ message: "Call rejected", call });
  } catch (error) {
    console.error("Error rejecting call:", error);
    res.status(500).json({ message: "Failed to reject call" });
  }
};

// Update call status
exports.updateCallStatus = async (req, res) => {
  const { callId } = req.params;
  const { status } = req.body;

  if (!callId || !mongoose.Types.ObjectId.isValid(callId)) {
    return res.status(400).json({ error: "Invalid call ID" });
  }

  try {
    const call = await Call.findByIdAndUpdate(
      callId,
      { status },
      { new: true }
    );
    if (!call) {
      return res.status(404).json({ error: "Call not found" });
    }
    res.json(call);
  } catch (error) {
    console.error("Error updating call status:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single call
exports.getCall = async (req, res) => {
  const { callId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(callId)) {
    return res.status(400).json({ error: "Invalid call ID" });
  }

  try {
    const call = await Call.findById(callId)
      .populate("userId", "name email")
      .populate("specialistId", "name email specialistCategory");

    if (!call) {
      return res.status(404).json({ error: "Call not found" });
    }

    res.json(call);
  } catch (error) {
    console.error("Error fetching call:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get multiple calls
exports.getCalls = async (req, res) => {
  const {
    userId,
    specialistId,
    status,
    specialistCategory,
    startDate,
    endDate,
  } = req.query;
  const query = {};

  if (userId) query.userId = userId;
  if (specialistId) query.specialistId = specialistId;
  if (status) query.status = status;
  if (specialistCategory) query.specialistCategory = specialistCategory;

  if (startDate && endDate) {
    query.startTime = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  try {
    const calls = await Call.find(query)
      .populate("userId", "name email")
      .populate("specialistId", "name email specialistCategory")
      .sort({ startTime: -1 });

    if (calls.length === 0) {
      return res.status(404).json({ message: "No calls found" });
    }

    res.json(calls);
  } catch (error) {
    console.error("Error fetching calls:", error);
    res.status(500).json({ error: "Server error" });
  }
};
