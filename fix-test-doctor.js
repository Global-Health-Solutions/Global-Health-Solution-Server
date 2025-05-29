require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function fixTestUser() {
  try {
    await connectDB();
    console.log('Connected to database');
    
    const doctor = await User.findOne({ email: 'testdoctor@example.com' });
    if (doctor) {
      console.log('📋 Fixing test doctor...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      // Update the doctor with missing fields
      await User.updateOne(
        { email: 'testdoctor@example.com' },
        { 
          $set: {
            password: hashedPassword,
            isEmailVerified: true,
            isApproved: true
          }
        }
      );
      
      console.log('✅ Test doctor fixed');
      
      // Verify the update
      const updatedDoctor = await User.findOne({ email: 'testdoctor@example.com' });
      console.log('📋 Updated doctor details:');
      console.log('Has password:', !!updatedDoctor.password);
      console.log('Is email verified:', updatedDoctor.isEmailVerified);
      console.log('Is approved:', updatedDoctor.isApproved);
      
    } else {
      console.log('❌ Doctor not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixTestUser();
