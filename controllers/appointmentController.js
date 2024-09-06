const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { generateAgoraToken } = require('../utils/agora');

exports.createAppointment = async (req, res) => {
  try {
    const { specialistId, dateTime, specialistCategory, notes } = req.body;
    const patientId = req.user._id;

    const appointment = new Appointment({
      patient: patientId,
      specialist: specialistId,
      dateTime,
      specialistCategory,
      notes
    });

    await appointment.save();

    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let query;
    if (userRole === 'specialist') {
      query = { specialist: userId };
    } else {
      query = { patient: userId };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName')
      .populate('specialist', 'firstName lastName specialistCategory')
      .sort({ dateTime: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status, notes },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.startAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const channelName = `appointment_${appointment._id}`;
    const token = generateAgoraToken(channelName);

    res.json({ channelName, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
