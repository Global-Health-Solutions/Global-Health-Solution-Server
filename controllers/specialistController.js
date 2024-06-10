const asyncHandler = require("express-async-handler");
const Specialist = require("../models/Specialist");
const generateToken = require("../utils/generateToken");
const verifyRecaptcha = require("../utils/recaptcha");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

// @desc    Register a new specialist
// @route   POST /api/specialists
// @access  Public
const registerSpecialist = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    address,
    country,
    email,
    phone,
    password,
    agreeTerms,
    recaptcha,
  } = req.body;

  // Validate reCAPTCHA
  const recaptchaValid = await verifyRecaptcha(recaptcha);
  if (!recaptchaValid) {
    res.status(400);
    throw new Error("reCAPTCHA validation failed. Please try again.");
  }

  const specialistExists = await Specialist.findOne({ email });

  if (specialistExists) {
    res.status(400);
    throw new Error("Specialist already exists");
  }

  const specialist = await Specialist.create({
    firstName,
    lastName,
    dateOfBirth,
    gender,
    address,
    country,
    email,
    phone,
    password,
    agreeTerms,
  });

  const otp = specialist.generateOTP();
  await specialist.save();

  const text = `Your OTP is: ${otp}`;
  const html = `<p>Your OTP is: <strong>${otp}</strong></p>`;
  await sendEmail({ to: specialist.email, subject: "Verify your email", text, html });

  res.status(201).json({
    message:
      "Registration successful. Please check your email for the OTP to verify your account.",
  });
});

// @desc    Verify OTP
// @route   POST /api/specialists/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const specialist = await Specialist.findOne({ email });

  if (!specialist || specialist.otp !== otp || specialist.otpExpires < Date.now()) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  specialist.otp = undefined;
  specialist.otpExpires = undefined;
  await specialist.save();

  res.status(200).json({
    message: "OTP verified successfully",
    token: generateToken(specialist._id),
  });
});

// @desc    Resend OTP
// @route   POST /api/specialists/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const specialist = await Specialist.findOne({ email });

  if (!specialist) {
    res.status(400);
    throw new Error("Specialist not found");
  }

  const otp = specialist.generateOTP();
  await specialist.save();

  const text = `Your new OTP is: ${otp}`;
  const html = `<p>Your new OTP is: <strong>${otp}</strong></p>`;
  await sendEmail({ to: specialist.email, subject: "Resend OTP", text, html });

  res.status(200).json({
    message:
      "OTP resent successfully. Please check your email for the new OTP.",
  });
});

// @desc    Authenticate specialist & get token
// @route   POST /api/specialists/login
// @access  Public
const authSpecialist = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const specialist = await Specialist.findOne({ email });

  if (specialist && (await specialist.matchPassword(password))) {
    res.json({
      _id: specialist._id,
      firstName: specialist.firstName,
      lastName: specialist.lastName,
      email: specialist.email,
      phone: specialist.phone,
      token: generateToken(specialist._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    Request password reset
// @route   POST /api/specialists/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const specialist = await Specialist.findOne({ email });

  if (!specialist) {
    res.status(400);
    throw new Error("Specialist not found");
  }

  const resetToken = specialist.generatePasswordResetToken();
  await specialist.save();

  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/reset-password/${resetToken}`;

  const text = `Click this link to reset your password: ${resetUrl}`;
  const html = `<p>Click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`;
  await sendEmail({
    to: specialist.email,
    subject: "Password Reset Request",
    text,
    html,
  });

  res.status(200).json({
    message: "Password reset email sent",
  });
});

// @desc    Reset password
// @route   POST /api/specialists/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const specialist = await Specialist.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!specialist) {
    res.status(400);
    throw new Error("Invalid or expired password reset token");
  }

  specialist.password = password;
  specialist.resetPasswordToken = undefined;
  specialist.resetPasswordExpires = undefined;
  await specialist.save();

  res.status(200).json({
    message: "Password reset successful",
  });
});

// @desc    Get specialist profile
// @route   GET /api/specialists/profile
// @access  Private
const getSpecialistProfile = asyncHandler(async (req, res) => {
  const specialist = await Specialist.findById(req.specialist._id);

  if (specialist) {
    res.json({
      _id: specialist._id,
      firstName: specialist.firstName,
      lastName: specialist.lastName,
      dateOfBirth: specialist.dateOfBirth,
      gender: specialist.gender,
      address: specialist.address,
      country: specialist.country,
      email: specialist.email,
      phone: specialist.phone,
    });
  } else {
    res.status(404);
    throw new Error("Specialist not found");
  }
});

// @desc    Update specialist profile
// @route   PUT /api/specialists/profile
// @access  Private
const updateSpecialistProfile = asyncHandler(async (req, res) => {
  const specialist = await Specialist.findById(req.specialist._id);

  if (specialist) {
    specialist.firstName = req.body.firstName || specialist.firstName;
    specialist.lastName = req.body.lastName || specialist.lastName;
    specialist.dateOfBirth = req.body.dateOfBirth || specialist.dateOfBirth;
    specialist.gender = req.body.gender || specialist.gender;
    specialist.address = req.body.address || specialist.address;
    specialist.country = req.body.country || specialist.country;
    specialist.email = req.body.email || specialist.email;
    specialist.phone = req.body.phone || specialist.phone;

    if (req.body.password) {
      specialist.password = req.body.password;
    }

    const updatedSpecialist = await specialist.save();

    res.json({
      _id: updatedSpecialist._id,
      firstName: updatedSpecialist.firstName,
      lastName: updatedSpecialist.lastName,
      dateOfBirth: updatedSpecialist.dateOfBirth,
      gender: updatedSpecialist.gender,
      address: updatedSpecialist.address,
      country: updatedSpecialist.country,
      email: updatedSpecialist.email,
      phone: updatedSpecialist.phone,
      token: generateToken(updatedSpecialist._id),
    });
  } else {
    res.status(404);
    throw new Error("Specialist not found");
  }
});

module.exports = {
  registerSpecialist,
  verifyOTP,
  resendOTP,
  authSpecialist,
  forgotPassword,
  resetPassword,
  getSpecialistProfile,
  updateSpecialistProfile,
};
