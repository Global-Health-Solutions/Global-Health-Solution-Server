// controllers/callController.js
const { RtcTokenBuilder, RtcRole } = require("agora-token");
const Call = require("../models/Call");
const User = require("../models/User");
const { default: mongoose } = require("mongoose");

// Generate Agora token
exports.generateToken = (req, res) => {
  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const channelName = req.body.channelName;
  const uid = req.body.uid || 0;
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appID,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );

  res.json({ token });
};

// Initiate a call
exports.initiateCall = async (req, res) => {
  const { userId, specialistCategory } = req.body;

  try {
    const specialist = await User.findOne({
      role: "specialist",
      specialistCategory,
      isOnline: true,
      isApproved: true,
    }).sort({ loginTime: 1 });

    if (!specialist) {
      return res
        .status(404)
        .json({ message: "No available specialists found" });
    }

    const channelName = `${userId}_${specialist._id}_${Date.now()}`;

    const call = new Call({
      userId,
      specialistId: specialist._id,
      channelName,
      specialistCategory,
      status: "pending",
    });
    await call.save();

    // Generate Agora token
    const token = RtcTokenBuilder.buildTokenWithUid(
      process.env.AGORA_APP_ID,
      process.env.AGORA_APP_CERTIFICATE,
      channelName,
      0,
      RtcRole.PUBLISHER,
      Math.floor(Date.now() / 1000) + 3600
    );

    res.json({
      callId: call._id,
      channelName,
      specialistId: specialist._id,
      token,
    });

    req.io.to(specialist._id.toString()).emit("incomingCall", {
      callId: call._id,
      channelName,
      callerId: userId,
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
      token,
    });

    req.io.to(call.specialistId.toString()).emit("callAccepted", {
      callId: call._id,
      channelName: call.channelName,
      token,
    });

    res.json({ message: "Call accepted", call });
  } catch (error) {
    console.error("Error accepting call:", error);
    res.status(500).json({ message: "Failed to accept call" });
  }
};

// Reject call
// Server-side (controllers/callController.js)
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

// Helper functions
// async function findAvailableSpecialist(category) {
//   return await User.findOne({
//     role: "specialist",
//     specialistCategory: category,
//     isOnline: true,
//     isApproved: true,
//   }).sort({ loginTime: 1 });
// }

// async function saveCallDetails(
//   userId,
//   specialistId,
//   channelName,
//   specialistCategory
// ) {
//   try {
//     const call = new Call({
//       userId,
//       specialistId,
//       channelName,
//       specialistCategory,
//       status: "pending",
//     });

//     const savedCall = await call.save();
//     return savedCall;
//   } catch (error) {
//     console.error("Error saving call details:", error);
//     throw new Error("Failed to save call details");
//   }
// }
