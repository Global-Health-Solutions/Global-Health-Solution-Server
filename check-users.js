const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    
    console.log('Connected to MongoDB');
    
    const users = await User.find({}, 'email role isVerified');
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- Email: ${user.email} | Role: ${user.role} | Verified: ${user.isVerified}`);
    });
    
    // Try to find our test users specifically
    const testPatient = await User.findOne({ email: 'testpatient@example.com' });
    const testDoctor = await User.findOne({ email: 'testdoctor@example.com' });
    
    console.log('\nTest users:');
    console.log('Patient exists:', !!testPatient);
    console.log('Doctor exists:', !!testDoctor);
    
    if (testPatient) {
      console.log('Patient verified:', testPatient.isVerified);
    }
    if (testDoctor) {
      console.log('Doctor verified:', testDoctor.isVerified);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
