const mongoose = require('mongoose');
require('./config/db')();

const User = require('./models/User');
const Appointment = require('./models/Appointment');
const Availability = require('./models/Availability');

async function createTestAppointment() {
  try {
    console.log('Creating test appointment...');
    
    // Wait for DB connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Find test users
    const patient = await User.findOne({ email: 'john.patient@example.com' });
    const doctor = await User.findOne({ email: 'dr.sarah.specialist@example.com' });
    
    if (!patient || !doctor) {
      console.log('Test users not found');
      console.log('Patient found:', !!patient);
      console.log('Doctor found:', !!doctor);
      return;
    }
    
    console.log('Found users:', patient.firstName, doctor.firstName);
    
    // Create availability for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const availability = await Availability.findOneAndUpdate(
      { doctor: doctor._id, date: today },
      {
        doctor: doctor._id,
        date: today,
        timeSlots: [
          { startTime: '09:00', endTime: '09:30', isBooked: false },
          { startTime: '09:30', endTime: '10:00', isBooked: false },
          { startTime: '10:00', endTime: '10:30', isBooked: true }, // This one will be booked
        ]
      },
      { upsert: true, new: true }
    );
    
    console.log('Created availability with', availability.timeSlots.length, 'slots');
    
    // Create a test appointment
    const appointmentDateTime = new Date(today);
    appointmentDateTime.setHours(10, 0, 0, 0); // 10:00 AM today
    
    const appointment = await Appointment.findOneAndUpdate(
      { 
        patient: patient._id,
        specialist: doctor._id,
        dateTime: appointmentDateTime
      },
      {
        patient: patient._id,
        specialist: doctor._id,
        dateTime: appointmentDateTime,
        reason: 'Test appointment for profileImage fix',
        status: 'scheduled',
        appointmentType: 'consultation'
      },
      { upsert: true, new: true }
    );
    
    console.log('Created appointment:', appointment._id);
    
    // Now test the getUserAppointments query
    const appointments = await Appointment.find({
      $or: [{ patient: patient._id }, { specialist: patient._id }],
    })
      .populate("patient", "firstName lastName email profileImage")
      .populate("specialist", "firstName lastName email specialistCategory profileImage");
    
    console.log('Retrieved appointments:', appointments.length);
    
    appointments.forEach(apt => {
      console.log('Appointment:', {
        id: apt._id,
        patient: apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'No patient',
        specialist: apt.specialist ? `${apt.specialist.firstName} ${apt.specialist.lastName}` : 'No specialist',
        hasSpecialistProfileImage: !!apt.specialist?.profileImage,
        specialistProfileImage: apt.specialist?.profileImage,
        status: apt.status,
        dateTime: apt.dateTime
      });
    });
    
    console.log('Test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error creating test appointment:', error);
    process.exit(1);
  }
}

createTestAppointment();
