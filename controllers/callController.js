// controllers/callController.js

const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const Call = require("../models/Call");
const User = require("../models/User"); // Make sure to import the User model

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
      role: 'specialist',
      specialistCategory,
      isOnline: true,
      isApproved: true
    }).sort({ loginTime: 1 });
    
    if (!specialist) {
      return res.status(404).json({ message: 'No available specialists found' });
    }
    
    const channelName = `${userId}_${specialist._id}_${Date.now()}`;
    
    const call = new Call({
      userId,
      specialistId: specialist._id,
      channelName,
      specialistCategory,
      status: 'pending'
    });
    await call.save();
    
    // Emit socket event to notify specialist
    req.app.get('io').to(specialist._id.toString()).emit('incomingCall', {
      callId: call._id,
      channelName,
      userId
    });
    
    res.json({ 
      callId: call._id,
      channelName,
      specialistId: specialist._id
    });
  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({ message: 'Failed to initiate call' });
  }
};

// Accept call
exports.acceptCall = async (req, res) => {
  const { callId } = req.body;
  
  try {
    const call = await Call.findByIdAndUpdate(callId, { status: 'ongoing' }, { new: true });
    
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }
    
    // Notify the user that the call was accepted
    req.app.get('io').to(call.userId.toString()).emit('callAccepted', {
      callId: call._id,
      channelName: call.channelName
    });
    
    res.json({ message: 'Call accepted', call });
  } catch (error) {
    console.error('Error accepting call:', error);
    res.status(500).json({ message: 'Failed to accept call' });
  }
};

// Reject call
exports.rejectCall = async (req, res) => {
  const { callId } = req.body;
  
  try {
    const call = await Call.findByIdAndUpdate(callId, { status: 'rejected' }, { new: true });
    
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }
    
    // Notify the user that the call was rejected
    io.to(call.userId.toString()).emit('callRejected', { callId: call._id });
    
    res.json({ message: 'Call rejected', call });
  } catch (error) {
    console.error('Error rejecting call:', error);
    res.status(500).json({ message: 'Failed to reject call' });
  }
};

// Update call status
exports.updateCallStatus = async (req, res) => {
  const { callId } = req.params;
  const { status } = req.body;

  try {
    const call = await Call.findByIdAndUpdate(
      callId,
      { status, ...(status === 'completed' ? { endTime: Date.now() } : {}) },
      { new: true }
    );

    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    res.json(call);
  } catch (error) {
    console.error('Error updating call status:', error);
    res.status(500).json({ message: 'Failed to update call status' });
  }
};

// Helper functions
async function findAvailableSpecialist(category) {
  return await User.findOne({
    role: "specialist",
    specialistCategory: category,
    isOnline: true,
    isApproved: true,
  }).sort({ loginTime: 1 });
}

async function saveCallDetails(
  userId,
  specialistId,
  channelName,
  specialistCategory
) {
  try {
    const call = new Call({
      userId,
      specialistId,
      channelName,
      specialistCategory,
      status: "pending",
    });

    const savedCall = await call.save();
    return savedCall;
  } catch (error) {
    console.error("Error saving call details:", error);
    throw new Error("Failed to save call details");
  }
}