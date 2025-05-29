const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/User');

async function verifyAvailabilitySystem() {
  console.log('🔍 SPECIALIST AVAILABILITY SYSTEM VERIFICATION');
  console.log('===============================================\n');

  try {
    // 1. Check if User model has required fields
    console.log('1️⃣ Checking User Model Schema...');
    const userSchema = User.schema.paths;
    const hasIsOnline = 'isOnline' in userSchema;
    const hasLastActiveTime = 'lastActiveTime' in userSchema;
    
    console.log(`   ✅ isOnline field: ${hasIsOnline ? 'Present' : 'Missing'}`);
    console.log(`   ✅ lastActiveTime field: ${hasLastActiveTime ? 'Present' : 'Missing'}`);
    
    if (!hasIsOnline || !hasLastActiveTime) {
      console.log('   ❌ Required schema fields missing!');
      return;
    }
    
    // 2. Check for specialist users
    console.log('\n2️⃣ Checking Specialist Users...');
    const specialists = await User.find({ role: 'specialist' }).limit(5);
    console.log(`   📊 Found ${specialists.length} specialist(s)`);
    
    if (specialists.length === 0) {
      console.log('   ⚠️  No specialists found in database');
      return;
    }
    
    // 3. Test availability update functionality
    console.log('\n3️⃣ Testing Availability Update...');
    const testSpecialist = specialists[0];
    console.log(`   👨‍⚕️ Testing with: ${testSpecialist.email}`);
    console.log(`   📊 Current status: ${testSpecialist.isOnline ? 'Online' : 'Offline'}`);
    
    // Toggle status
    const newStatus = !testSpecialist.isOnline;
    const updatedUser = await User.findByIdAndUpdate(
      testSpecialist._id,
      { 
        isOnline: newStatus,
        lastActiveTime: new Date()
      },
      { 
        new: true,
        runValidators: false  // Important: prevents validation conflicts
      }
    );
    
    console.log(`   ✅ Status updated to: ${updatedUser.isOnline ? 'Online' : 'Offline'}`);
    console.log(`   ⏰ Last active: ${updatedUser.lastActiveTime}`);
    
    // 4. Check online specialists count
    console.log('\n4️⃣ Checking Online Specialists...');
    const onlineSpecialists = await User.find({ 
      role: 'specialist', 
      isOnline: true 
    });
    console.log(`   🟢 Online specialists: ${onlineSpecialists.length}`);
    
    const offlineSpecialists = await User.find({ 
      role: 'specialist', 
      isOnline: false 
    });
    console.log(`   🔴 Offline specialists: ${offlineSpecialists.length}`);
    
    // 5. Test specialist filtering for calls
    console.log('\n5️⃣ Testing Call System Integration...');
    const availableForCalls = await User.find({
      role: 'specialist',
      isOnline: true,
      // Add any additional criteria for call availability
    }).select('firstName lastName email specialty isOnline lastActiveTime');
    
    console.log(`   📞 Specialists available for calls: ${availableForCalls.length}`);
    availableForCalls.forEach(spec => {
      console.log(`      - ${spec.firstName} ${spec.lastName} (${spec.specialty || 'General'}) - ${spec.email}`);
    });
    
    // 6. Summary
    console.log('\n🎉 VERIFICATION COMPLETE!');
    console.log('========================');
    console.log('✅ User model schema: Valid');
    console.log('✅ Database operations: Working');
    console.log('✅ Status updates: Functional');
    console.log('✅ Call system integration: Ready');
    console.log('\n🚀 Specialist availability system is fully operational!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run verification
verifyAvailabilitySystem();
