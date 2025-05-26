const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

dotenv.config();

const createTestUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    console.log('MongoDB connected');

    console.log('Connected to database');

    // Create a test patient/user
    const existingPatient = await User.findOne({ email: 'testpatient@example.com' });
    if (!existingPatient) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const patient = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'testpatient@example.com',
        password: hashedPassword,
        role: 'user',
        isApproved: true,
        isVerified: true,
        phone: '+1234567890',
        phoneNumber: '+1234567890',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        profileImage: '/default-avatar.png'
      });
      console.log('Created test patient:', patient.email);
    } else {
      // Ensure the existing user is verified and approved
      existingPatient.isVerified = true;
      existingPatient.isApproved = true;
      existingPatient.profileImage = existingPatient.profileImage || '/default-avatar.png';
      await existingPatient.save();
      console.log('Test patient already exists and verified');
    }

    // Create a test specialist
    const existingSpecialist = await User.findOne({ email: 'testdoctor@example.com' });
    if (!existingSpecialist) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const specialist = await User.create({
        firstName: 'Dr. Sarah',
        lastName: 'Smith',
        email: 'testdoctor@example.com',
        password: hashedPassword,
        role: 'specialist',
        specialistCategory: 'Cardiology',
        isApproved: true,
        isVerified: true,
        phone: '+1234567891',
        phoneNumber: '+1234567891',
        dateOfBirth: new Date('1980-01-01'),
        gender: 'female',
        licenseNumber: 'MD123456',
        yearsOfExperience: 10,
        profileImage: '/default-avatar.png'
      });
      console.log('Created test specialist:', specialist.email);
    } else {
      // Ensure the existing specialist is verified and approved
      existingSpecialist.isVerified = true;
      existingSpecialist.isApproved = true;
      existingSpecialist.profileImage = existingSpecialist.profileImage || '/default-avatar.png';
      await existingSpecialist.save();
      console.log('Test specialist already exists and verified');
    }

    console.log('Test users setup complete!');
    console.log('You can now log in with:');
    console.log('Patient: testpatient@example.com / password123');
    console.log('Doctor: testdoctor@example.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  }
};

createTestUsers();
