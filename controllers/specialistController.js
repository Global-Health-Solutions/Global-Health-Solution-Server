const asyncHandler = require('express-async-handler');
const Specialist = require('../models/Specialist');
const generateToken = require('../utils/generateToken');

// @desc    Register a new specialist
// @route   POST /api/specialists
// @access  Public
const registerSpecialist = asyncHandler(async (req, res) => {
  const { name, email, password, certifications } = req.body;

  const specialistExists = await Specialist.findOne({ email });

  if (specialistExists) {
    res.status(400);
    throw new Error('Specialist already exists');
  }

  const specialist = await Specialist.create({
    name,
    email,
    password,
    certifications,
  });

  if (specialist) {
    res.status(201).json({
      _id: specialist._id,
      name: specialist.name,
      email: specialist.email,
      token: generateToken(specialist._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid specialist data');
  }
});

// @desc    Approve a specialist
// @route   PUT /api/specialists/approve/:id
// @access  Private/Admin
const approveSpecialist = asyncHandler(async (req, res) => {
  const specialist = await Specialist.findById(req.params.id);

  if (specialist) {
    specialist.isApproved = true;
    await specialist.save();
    res.json({ message: 'Specialist approved' });
  } else {
    res.status(404);
    throw new Error('Specialist not found');
  }
});

module.exports = { registerSpecialist, approveSpecialist };
