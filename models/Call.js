const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialist: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialist', required: true },
  duration: { type: Number, required: true },
  isSuccessful: { type: Boolean, default: false },
  callData: { type: String }, // Store compressed call data
}, { timestamps: true });

const Call = mongoose.model('Call', callSchema);

module.exports = Call;
