const mongoose = require('mongoose');
const Availability = require('./models/Availability');
const User = require('./models/User');

async function testAvailabilitySync() {
  try {
    await mongoose.connect('mongodb://localhost:27017/Global-Health-Solution');
    console.log('✅ Connected to MongoDB');
    
    // Find a test doctor
    const doctor = await User.findOne({ 
      role: 'specialist', 
      specialistCategory: 'Cardiology',
      isApproved: true 
    });
    
    if (!doctor) {
      console.log('❌ No cardiologist found');
      return;
    }
    
    console.log(`👨‍⚕️ Testing with Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialistCategory})`);
    
    // 1. Clear any existing availability for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    await Availability.deleteMany({ 
      doctor: doctor._id, 
      date: tomorrow 
    });
    
    console.log(`🧹 Cleaned up existing availability for ${tomorrow.toISOString().split('T')[0]}`);
    
    // 2. Create initial availability (simulating doctor creating 3 slots)
    const initialSlots = [
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '10:00', endTime: '11:00' },
      { startTime: '14:00', endTime: '15:00' }
    ];
    
    const newAvailability = await Availability.create({
      doctor: doctor._id,
      date: tomorrow,
      timeSlots: initialSlots.map(slot => ({ ...slot, isBooked: false })),
      isRecurring: false
    });
    
    console.log(`✅ Created initial availability with ${newAvailability.timeSlots.length} slots`);
    
    // 3. Test patient can see these slots
    const patientQuery = await Availability.find({
      doctor: doctor._id,
      date: {
        $gte: tomorrow,
        $lte: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
      },
      timeSlots: {
        $elemMatch: {
          isBooked: false,
        },
      },
    }).populate("doctor", "firstName lastName specialistCategory");
    
    console.log(`🔍 Patient query found ${patientQuery.length} availability records`);
    
    if (patientQuery.length > 0) {
      const availableSlots = patientQuery[0].timeSlots.filter(slot => !slot.isBooked);
      console.log(`🎯 Available slots for patients: ${availableSlots.length}`);
      availableSlots.forEach((slot, index) => {
        console.log(`  ${index + 1}. ${slot.startTime} - ${slot.endTime}`);
      });
    } else {
      console.log('❌ PROBLEM: Patient query found NO availability records');
    }
    
    await mongoose.disconnect();
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testAvailabilitySync();
