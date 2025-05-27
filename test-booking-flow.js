require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
const Availability = require('./models/Availability');
const { createAppointmentNotification } = require('./utils/notificationService');

async function testBookingFlow() {
  try {
    console.log('🧪 Testing complete appointment booking flow...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');
    
    // Find test users
    const patient = await User.findOne({ email: 'john.patient@example.com' });
    const doctor = await User.findOne({ email: 'dr.sarah.specialist@example.com' });
    
    if (!patient || !doctor) {
      console.log('❌ Test users not found');
      console.log('Patient found:', !!patient);
      console.log('Doctor found:', !!doctor);
      return;
    }
    
    console.log('✅ Found test users');
    
    // Create a test appointment
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 1); // Tomorrow
    appointmentDate.setHours(14, 30, 0, 0); // 2:30 PM
    
    const testAppointment = {
      _id: new mongoose.Types.ObjectId(),
      patient: patient._id,
      specialist: doctor._id,
      dateTime: appointmentDate,
      specialistCategory: doctor.specialistCategory || 'General Medicine',
      reason: 'Test notification system',
      status: 'scheduled',
      appointmentType: 'consultation'
    };
    
    console.log('📅 Test appointment details:');
    console.log('  Date:', appointmentDate.toLocaleDateString());
    console.log('  Time:', appointmentDate.toLocaleTimeString());
    console.log('  Patient:', patient.firstName, patient.lastName);
    console.log('  Doctor:', doctor.firstName, doctor.lastName);
    
    // Test notifications for patient
    console.log('\n📧 Testing patient notifications...');
    await createAppointmentNotification(testAppointment, patient, 'scheduled');
    console.log('✅ Patient notification created');
    
    // Test notifications for doctor
    console.log('\n📧 Testing doctor notifications...');
    await createAppointmentNotification(testAppointment, doctor, 'scheduled');
    console.log('✅ Doctor notification created');
    
    console.log('\n🎉 Booking flow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Booking flow test failed:', error);
  } finally {
    process.exit(0);
  }
}

testBookingFlow();
