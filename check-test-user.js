require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');

async function checkTestUser() {
  try {
    await connectDB();
    console.log('Connected to database');
    
    const doctor = await User.findOne({ email: 'testdoctor@example.com' });
    if (doctor) {
      console.log('📋 Doctor details:');
      console.log('Email:', doctor.email);
      console.log('Role:', doctor.role);
      console.log('Is approved:', doctor.isApproved);
      console.log('Is email verified:', doctor.isEmailVerified);
      console.log('Phone number:', doctor.phoneNumber);
      console.log('Phone:', doctor.phone);
      console.log('Has password:', !!doctor.password);
      console.log('Password (first 20 chars):', doctor.password ? doctor.password.substring(0, 20) + '...' : 'No password');
    } else {
      console.log('❌ Doctor not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTestUser();
