require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');

async function setupTestUsers() {
  try {
    await connectDB();
    console.log('Connected to database');
    
    // Find a doctor and add email
    const doctor = await User.findOne({ role: 'specialist' });
    if (doctor && !doctor.email) {
      doctor.email = 'testdoctor@example.com';
      await doctor.save();
      console.log('✅ Added email to doctor:', doctor.firstName, doctor.lastName);
    } else if (doctor && doctor.email) {
      console.log('✅ Doctor already has email:', doctor.firstName, doctor.lastName, doctor.email);
    }
    
    // Find a patient and add email  
    let patient = await User.findOne({ role: 'user' });
    if (!patient) {
      // Create a test patient if none exists
      patient = new User({
        firstName: 'Test',
        lastName: 'Patient',
        email: 'testpatient@example.com',
        role: 'user',
        password: 'hashedpassword123',
        phoneNumber: '+1234567890',
        isEmailVerified: true
      });
      await patient.save();
      console.log('✅ Created test patient');
    } else if (!patient.email) {
      patient.email = 'testpatient@example.com';
      await patient.save();
      console.log('✅ Added email to patient:', patient.firstName, patient.lastName);
    } else {
      console.log('✅ Patient already has email:', patient.firstName, patient.lastName, patient.email);
    }
    
    console.log('✅ Test users setup complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up test users:', error);
    process.exit(1);
  }
}

setupTestUsers();
