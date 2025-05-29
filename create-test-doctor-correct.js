require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');

async function createTestDoctorCorrectly() {
  try {
    await connectDB();
    console.log('Connected to database');
    
    // Delete the existing test doctor
    await User.deleteOne({ email: 'testdoctor@example.com' });
    console.log('🗑️ Deleted existing test doctor');
    
    // Create a fresh test doctor - let the pre-save hook handle password hashing
    const testDoctor = new User({
      firstName: 'Dr. Sarah',
      lastName: 'Smith',
      email: 'testdoctor@example.com',
      password: 'password123', // Plain text - will be hashed by pre-save hook
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
    console.log('✅ Created test doctor with proper password hashing');
    
    // Test password matching
    const savedDoctor = await User.findOne({ email: 'testdoctor@example.com' }).select('+password');
    const passwordMatch = await savedDoctor.matchPassword('password123');
    console.log('🔐 Password match test:', passwordMatch);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestDoctorCorrectly();
