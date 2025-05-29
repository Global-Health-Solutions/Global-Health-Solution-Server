const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "specialist", "admin"],
      default: "user",
    },
    firstName: {
      type: String,
      required: [true, "Please add a first name"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Please add a last name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
      select: false,
    },
    adminPassword: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    country: { type: String },
    phone: { type: String },
    agreeTerms: { type: Boolean, default: false },
    practicingLicense: { type: String },
    doctorRegistrationNumber: { type: String },
    isApproved: {
      type: Boolean,
      default: function () {
        return this.role !== "specialist";
      },
    },
    isEmailVerified: { type: Boolean, default: false },
    loginTime: { type: Date, default: Date.now },
    otp: { type: String },
    otpExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    isOnline: { type: Boolean, default: false },
    profileImage: { type: String },
    specialistCategory: {
      type: String,
      required: function () {
        return this.role === "specialist";
      },
    },
    availability: [
      {
        day: {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
        },
        startTime: String,
        endTime: String,
      },
    ],
    lastActiveTime: { type: Date, default: Date.now },
    phoneNumber: {
      type: String,
      required: function() {
        // Only require phone number for new specialist registrations
        return this.isNew && this.role === "specialist";
      },
      validate: {
        validator: function(v) {
          // If role is specialist and phoneNumber is provided, it should not be empty
          if (this.role === "specialist" && v !== undefined) {
            return v && v.trim().length > 0;
          }
          return true;
        },
        message: "Please add a valid phone number"
      }
    },
  },
  { timestamps: true }
);

// Encrypt password using bcrypt
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") && !this.isModified("adminPassword")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  if (this.adminPassword) {
    this.adminPassword = await bcrypt.hash(this.adminPassword, salt);
  }
  next();
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.matchAdminPassword = async function (enteredAdminPassword) {
  return await bcrypt.compare(enteredAdminPassword, this.adminPassword);
};

// Generate OTP
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
