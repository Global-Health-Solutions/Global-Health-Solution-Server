require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function createFreshTestDoctor() {
  try {
    await connectDB();
    console.log('Connected to database');
    
    // Delete the existing test doctor
    await User.deleteOne({ email: 'testdoctor@example.com' });
    console.log('🗑️ Deleted existing test doctor');
    
    // Create a fresh test doctor with all required fields
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const testDoctor = new User({
      firstName: 'Dr. Sarah',
      lastName: 'Smith',
      email: 'testdoctor@example.com',
      password: hashedPassword,
      role: 'specialist',
      specialistCategory: 'Cardiology',
      isApproved: true,
      isEmailVerified: true,
      phone: '+1234567891',
      phoneNumber: '+1234567891',
      dateOfBirth: new Date('1980-01-01'),
      gender: 'female',
      agreeTerms: true,
      profileImage: '/default-avatar.png'
    });
    
    await testDoctor.save();
    console.log('✅ Created fresh test doctor');
    
    // Verify the creation
    const verifyDoctor = await User.findOne({ email: 'testdoctor@example.com' }).select('+password');
    console.log('📋 Verification:');
    console.log('Email:', verifyDoctor.email);
    console.log('Has password:', !!verifyDoctor.password);
    console.log('Is verified:', verifyDoctor.isEmailVerified);
    console.log('Is approved:', verifyDoctor.isApproved);
    console.log('Phone number:', verifyDoctor.phoneNumber);
    console.log('Role:', verifyDoctor.role);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createFreshTestDoctor();
