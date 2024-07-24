const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const verifyRecaptcha = require("../utils/recaptcha");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const path = require("path");

// Register User or Specialist
const registerUser = asyncHandler(async (req, res) => {
  const {
    role,
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
    specialistCategory,
    isOnline,
    profileImage,
  } = req.body;

  // Validate reCAPTCHA
  const recaptchaValid = await verifyRecaptcha(recaptcha);
  if (!recaptchaValid) {
    res.status(400);
    throw new Error("reCAPTCHA validation failed. Please try again.");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    role,
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
    specialistCategory: role === "specialist" ? specialistCategory : undefined,
    isOnline: role === "specialist" ? isOnline : undefined,
    profileImage,
  });

  const otp = user.generateOTP();
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Your One-Time Password for Global Health Solutions",
    otpCode: otp,
  });

  res.status(201).json({
    message: "Registration successful. Please check your email for the OTP to verify your account.",
  });
});

// Verify OTP
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  user.otp = undefined;
  user.otpExpires = undefined;
  user.isEmailVerified = true;
  await user.save();

  res.status(200).json({
    message: "OTP verified successfully",
    token: generateToken(user._id),
  });
});

// Resend OTP
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User not found");
  }

  const otp = user.generateOTP();
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Your New One-Time Password for Global Health Solutions",
    otpCode: otp,
  });

  res.status(200).json({
    message: "OTP resent successfully. Please check your email for the new OTP.",
  });
});

// Authenticate user & get token
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      address: user.address,
      country: user.country,
      email: user.email,
      phone: user.phone,
      agreeTerms: user.agreeTerms,
      certifications: user.certifications,
      isApproved: user.isApproved,
      loginTime: user.loginTime,
      otp: user.otp,
      otpExpires: user.otpExpires,
      resetPasswordToken: user.resetPasswordToken,
      resetPasswordExpires: user.resetPasswordExpires,
      isOnline: user.isOnline,
      specialistCategory: user.specialistCategory,
      profileImage: user.profileImage,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// Request password reset
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User not found");
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save();

  const resetUrl = `${req.protocol}://${req.get("host")}/reset-password/${resetToken}`;

  const text = `Click this link to reset your password: ${resetUrl}`;
  const html = `<p>Click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`;
  await sendEmail({
    to: user.email,
    subject: "Password Reset Request",
    text,
    html,
  });

  res.status(200).json({
    message: "Password reset email sent",
  });
});

// Reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired password reset token");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({
    message: "Password reset successful",
  });
});

// Get user profile
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  console.log('olay')

  if (user) {
    res.json({
      _id: user._id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      address: user.address,
      country: user.country,
      email: user.email,
      phone: user.phone,
      agreeTerms: user.agreeTerms,
      certifications: user.certifications,
      isApproved: user.isApproved,
      loginTime: user.loginTime,
      otp: user.otp,
      otpExpires: user.otpExpires,
      resetPasswordToken: user.resetPasswordToken,
      resetPasswordExpires: user.resetPasswordExpires,
      isOnline: user.isOnline,
      specialistCategory: user.specialistCategory,
      profileImage: user.profileImage,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});


// Update user profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.role = req.body.role || user.role;
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth;
    user.gender = req.body.gender || user.gender;
    user.address = req.body.address || user.address;
    user.country = req.body.country || user.country;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.agreeTerms = req.body.agreeTerms !== undefined ? req.body.agreeTerms : user.agreeTerms;
    user.certifications = req.body.certifications || user.certifications;
    user.isApproved = req.body.isApproved !== undefined ? req.body.isApproved : user.isApproved;
    user.isOnline = req.body.isOnline !== undefined ? req.body.isOnline : user.isOnline;
    user.specialistCategory = req.body.specialistCategory || user.specialistCategory;
    user.profileImage = req.file ? req.file.path : user.profileImage;

    if (req.file) {
      user.profileImage = '/uploads/profile-images/' + path.basename(req.file.path);
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      role: updatedUser.role,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      dateOfBirth: updatedUser.dateOfBirth,
      gender: updatedUser.gender,
      address: updatedUser.address,
      country: updatedUser.country,
      email: updatedUser.email,
      phone: updatedUser.phone,
      agreeTerms: updatedUser.agreeTerms,
      certifications: updatedUser.certifications,
      isApproved: updatedUser.isApproved,
      loginTime: updatedUser.loginTime,
      otp: updatedUser.otp,
      otpExpires: updatedUser.otpExpires,
      resetPasswordToken: updatedUser.resetPasswordToken,
      resetPasswordExpires: updatedUser.resetPasswordExpires,
      isOnline: updatedUser.isOnline,
      specialistCategory: updatedUser.specialistCategory,
      profileImage: updatedUser.profileImage,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});


// Update user availability
const updateUserAvailability = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user && user.role === "specialist") {
    user.isOnline = !user.isOnline;
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      role: updatedUser.role,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      dateOfBirth: updatedUser.dateOfBirth,
      gender: updatedUser.gender,
      address: updatedUser.address,
      country: updatedUser.country,
      email: updatedUser.email,
      phone: updatedUser.phone,
      agreeTerms: updatedUser.agreeTerms,
      certifications: updatedUser.certifications,
      isApproved: updatedUser.isApproved,
      loginTime: updatedUser.loginTime,
      otp: updatedUser.otp,
      otpExpires: updatedUser.otpExpires,
      resetPasswordToken: updatedUser.resetPasswordToken,
      resetPasswordExpires: updatedUser.resetPasswordExpires,
      isOnline: updatedUser.isOnline,
      specialistCategory: updatedUser.specialistCategory,
      profileImage: updatedUser.profileImage,
    });
  } else {
    res.status(404);
    throw new Error("User not found or not a specialist");
  }
});

module.exports = {
  registerUser,
  verifyOTP,
  resendOTP,
  authUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  updateUserAvailability,
};
