const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const specialistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'specialist' },
  certifications: { type: String, required: true },
  isApproved: { type: Boolean, default: false },
  loginTime: { type: Date, default: Date.now },
}, { timestamps: true });

specialistSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

specialistSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const Specialist = mongoose.model('Specialist', specialistSchema);

module.exports = Specialist;
