const Call = require("../models/Call");
const User = require("../models/User");
const { generateAgoraToken } = require("../utils/agora");

const initiateCall = async (req, res) => {
  const { userId, specialistId, specialistCategory } = req.body;

  try {
    const specialist = await User.findById(specialistId);

    if (!specialist || !specialist.isOnline) {
      return res.status(400).json({ message: "Specialist is not available" });
    }

    const channelName = `call_${Date.now()}`;
    const token = generateAgoraToken(channelName);

    const call = new Call({
      userId,
      specialistId,
      channelName,
      specialistCategory,
      status: "pending",
    });
    await call.save();

    res.json({
      callId: call._id,
      channelName,
      specialistId,
      token,
    });

    req.io.to(specialistId.toString()).emit("incomingCall", {
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

const acceptCall = async (req, res) => {
  const { callId } = req.params;

  try {
    const call = await Call.findByIdAndUpdate(
      callId,
      { status: "accepted" },
      { new: true }
    ).populate("userId specialistId");

    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }

    const token = generateAgoraToken(call.channelName);

    req.io.to(call.userId.toString()).emit("callAccepted", {
      callId: call._id,
      channelName: call.channelName,
      token,
      status: "accepted",
    });

    req.io.to(call.specialistId.toString()).emit("callAccepted", {
      callId: call._id,
      channelName: call.channelName,
      token,
      status: "accepted",
    });

    res.json({ message: "Call accepted", call, token });
  } catch (error) {
    console.error("Error accepting call:", error);
    res.status(500).json({ message: "Failed to accept call" });
  }
};

const rejectCall = async (req, res) => {
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

const updateCallStatus = async (req, res) => {
  const { callId } = req.params;
  const { status } = req.body;

  if (!callId || !Call.findById(callId)) {
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

const getCall = async (req, res) => {
  const { callId } = req.params;

  if (!Call.findById(callId)) {
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

const getCalls = async (req, res) => {
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

const endCall = async (req, res) => {
  const { callId } = req.params;

  if (!callId || !Call.findById(callId)) {
    return res.status(400).json({ error: "Invalid call ID" });
  }

  try {
    const call = await Call.findByIdAndUpdate(
      callId,
      { status: "completed", endTime: Date.now() },
      { new: true }
    );

    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }

    // Notify both users that the call has ended
    req.io.to(call.userId.toString()).emit("callEnded", {
      callId: call._id,
      channelName: call.channelName,
    });

    req.io.to(call.specialistId.toString()).emit("callEnded", {
      callId: call._id,
      channelName: call.channelName,
    });

    res.json({ message: "Call ended", call });
  } catch (error) {
    console.error("Error ending call:", error);
    res.status(500).json({ message: "Failed to end call" });
  }
};

module.exports = {
  initiateCall,
  acceptCall,
  rejectCall,
  updateCallStatus,
  generateAgoraToken,
  getCall,
  getCalls,
  endCall, // Add this to the exports
};
