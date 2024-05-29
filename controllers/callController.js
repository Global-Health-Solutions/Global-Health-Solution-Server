const asyncHandler = require('express-async-handler');
const Call = require('../models/Call');
const Specialist = require('../models/Specialist');

// @desc    Book a call
// @route   POST /api/calls
// @access  Private
const bookCall = asyncHandler(async (req, res) => {
  const { specialistId, duration } = req.body;

  const specialist = await Specialist.findById(specialistId);

  if (specialist && specialist.isApproved) {
    const call = await Call.create({
      user: req.user._id,
      specialist: specialist._id,
      duration,
    });

    if (call) {
      res.status(201).json(call);
    } else {
      res.status(400);
      throw new Error('Invalid call data');
    }
  } else {
    res.status(404);
    throw new Error('Specialist not found or not approved');
  }
});

// @desc    Mark call as successful
// @route   PUT /api/calls/success/:id
// @access  Private
const markCallSuccess = asyncHandler(async (req, res) => {
  const call = await Call.findById(req.params.id);

  if (call) {
    call.isSuccessful = true;
    await call.save();
    res.json({ message: 'Call marked as successful' });
  } else {
    res.status(404);
    throw new Error('Call not found');
  }
});

module.exports = { bookCall, markCallSuccess };
