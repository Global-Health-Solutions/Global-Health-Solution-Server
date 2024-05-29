const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const verifyRecaptcha = require('../utils/recaptcha');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, password, agreeTerms, recaptcha } = req.body;

  // Validate reCAPTCHA
  const recaptchaValid = await verifyRecaptcha(recaptcha);
  if (!recaptchaValid) {
    res.status(400);
    throw new Error('reCAPTCHA validation failed. Please try again.');
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password,
    agreeTerms,
  });

  const otp = user.generateOTP();
  await user.save();

  const text = `Your OTP is: ${otp}`;
  const html = `<p>Your OTP is: <strong>${otp}</strong></p>`;
  await sendEmail({ to: user.email, subject: 'Verify your email', text, html });

  res.status(201).json({
    message: 'Registration successful. Please check your email for the OTP to verify your account.',
  });
});

// @desc    Verify OTP
// @route   POST /api/users/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  res.status(200).json({
    message: 'OTP verified successfully',
    token: generateToken(user._id),
  });
});

// @desc    Resend OTP
// @route   POST /api/users/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error('User not found');
  }

  const otp = user.generateOTP();
  await user.save();

  const text = `Your OTP is: ${otp}`;
  const html = `<p>Your OTP is: <strong>${otp}</strong></p>`;
  await sendEmail({ to: user.email, subject: 'Verify your email', text, html });

  res.status(200).json({
    message: 'OTP has been resent. Please check your email.',
  });
});

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Request password reset
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error('User not found');
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save();

  const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

  const text = `Click this link to reset your password: ${resetUrl}`;
  const html = `<p>Click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`;
  await sendEmail({ to: user.email, subject: 'Password Reset Request', text, html });

  res.status(200).json({
    message: 'Password reset email sent',
  });
});

// @desc    Reset password
// @route   POST /api/users/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired password reset token');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({
    message: 'Password reset successful',
  });
});

module.exports = { registerUser, verifyOTP, resendOTP, authUser, forgotPassword, resetPassword };
