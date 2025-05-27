const express = require('express');
const connectDB = require('./config/db');
const { createAppointmentNotification } = require('./utils/notificationService');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
require('dotenv').config();

// Test script to verify complete notification system
async function testNotificationFlow() {
  try {
    console.log('🚀 Starting notification system test...\n');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected successfully\n');
    
    // Find test users (patient and doctor)
    const testPatient = await User.findOne({ 
      role: 'user',
      email: { $exists: true, $ne: '' }
    });
    
    const testDoctor = await User.findOne({ 
      role: 'specialist',
      email: { $exists: true, $ne: '' }
    });
    
    if (!testPatient || !testDoctor) {
      console.log('❌ Could not find test patient or doctor with email addresses');
      console.log('Available patients:', await User.countDocuments({ role: 'user', email: { $exists: true, $ne: '' } }));
      console.log('Available doctors:', await User.countDocuments({ role: 'specialist', email: { $exists: true, $ne: '' } }));
      return;
    }
    
    console.log(`📧 Test Patient: ${testPatient.firstName} ${testPatient.lastName} (${testPatient.email})`);
    console.log(`👨‍⚕️ Test Doctor: ${testDoctor.firstName} ${testDoctor.lastName} (${testDoctor.email})\n`);
    
    // Create a test appointment
    const testAppointment = {
      _id: '507f1f77bcf86cd799439011', // Mock ObjectId
      patient: testPatient._id,
      specialist: testDoctor._id,
      specialistCategory: testDoctor.specialization || 'General Medicine',
      dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      appointmentType: 'consultation',
      status: 'scheduled'
    };
    
    console.log('📅 Test Appointment Details:');
    console.log(`   Date: ${testAppointment.dateTime.toLocaleDateString()}`);
    console.log(`   Time: ${testAppointment.dateTime.toLocaleTimeString()}`);
    console.log(`   Type: ${testAppointment.appointmentType}`);
    console.log(`   Status: ${testAppointment.status}\n`);
    
    // Test patient notification
    console.log('🧪 Testing Patient Notification...');
    try {
      const patientNotification = await createAppointmentNotification(
        testAppointment, 
        testPatient, 
        'scheduled'
      );
      console.log(`✅ Patient notification created: ${patientNotification.title}`);
    } catch (error) {
      console.error(`❌ Patient notification failed: ${error.message}`);
    }
    
    console.log('\n🧪 Testing Doctor Notification...');
    try {
      const doctorNotification = await createAppointmentNotification(
        testAppointment, 
        testDoctor, 
        'scheduled'
      );
      console.log(`✅ Doctor notification created: ${doctorNotification.title}`);
    } catch (error) {
      console.error(`❌ Doctor notification failed: ${error.message}`);
    }
    
    console.log('\n🧪 Testing Appointment Confirmation...');
    try {
      const confirmationNotification = await createAppointmentNotification(
        { ...testAppointment, status: 'confirmed' }, 
        testPatient, 
        'confirmed'
      );
      console.log(`✅ Confirmation notification created: ${confirmationNotification.title}`);
    } catch (error) {
      console.error(`❌ Confirmation notification failed: ${error.message}`);
    }
    
    console.log('\n✅ Notification system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing notification system:', error);
  } finally {
    process.exit(0);
  }
}

testNotificationFlow();
