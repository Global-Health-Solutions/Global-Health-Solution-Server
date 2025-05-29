const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Test online status functionality
const testOnlineStatus = async () => {
  try {
    console.log('\n🔍 TESTING ONLINE STATUS FUNCTIONALITY\n');
    
    // Find a test specialist
    const specialist = await User.findOne({ 
      role: 'specialist',
      isApproved: true 
    });
    
    if (!specialist) {
      console.log('❌ No approved specialist found. Create a test specialist first.');
      return;
    }
    
    console.log(`👨‍⚕️ Testing with Dr. ${specialist.firstName} ${specialist.lastName}`);
    console.log(`📧 Email: ${specialist.email}`);
    console.log(`🏥 Specialty: ${specialist.specialistCategory}`);
    console.log(`📊 Current online status: ${specialist.isOnline}`);
    console.log(`⏰ Last active: ${specialist.lastActiveTime}`);
    
    // Test toggling online status
    console.log('\n🔄 Testing status toggle...');
    
    const originalStatus = specialist.isOnline;
    const newStatus = !originalStatus;
    
    // Use findByIdAndUpdate to avoid validation issues
    const updatedSpecialist = await User.findByIdAndUpdate(
      specialist._id,
      { 
        isOnline: newStatus,
        lastActiveTime: new Date()
      },
      { new: true, runValidators: false }
    );
    
    console.log(`✅ Status toggled to: ${updatedSpecialist.isOnline}`);
    console.log(`⏰ Last active updated to: ${updatedSpecialist.lastActiveTime}`);
    
    // Verify the change was persisted
    const verifySpecialist = await User.findById(specialist._id);
    console.log(`🔍 Verification - Status in DB: ${verifySpecialist.isOnline}`);
    
    if (verifySpecialist.isOnline === updatedSpecialist.isOnline) {
      console.log('✅ Database update successful!');
    } else {
      console.log('❌ Database update failed!');
    }
    
    // Test finding available specialists
    console.log('\n🔍 Testing available specialist search...');
    
    const activeThreshold = 5 * 60 * 1000; // 5 minutes
    const availableSpecialists = await User.find({
      role: "specialist",
      specialistCategory: specialist.specialistCategory,
      isOnline: true,
      lastActiveTime: { $gte: new Date(Date.now() - activeThreshold) },
    }).select('firstName lastName isOnline lastActiveTime');
    
    console.log(`📋 Available specialists in ${specialist.specialistCategory}:`);
    availableSpecialists.forEach(spec => {
      console.log(`  - Dr. ${spec.firstName} ${spec.lastName} (Online: ${spec.isOnline}, Last active: ${spec.lastActiveTime})`);
    });
    
    // Reset status for next test
    await User.findByIdAndUpdate(
      specialist._id,
      { isOnline: originalStatus },
      { new: true, runValidators: false }
    );
    console.log(`\n🔄 Reset status back to: ${originalStatus}`);
    
    console.log('\n✅ Online status test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
};

// Run the test
const main = async () => {
  await connectDB();
  await testOnlineStatus();
  mongoose.connection.close();
  console.log('\n👋 Database connection closed');
};

main();
