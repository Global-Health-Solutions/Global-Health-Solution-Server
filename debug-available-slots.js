// Test script to debug the available slots issue
const mongoose = require('mongoose');
const User = require('./models/User');
const Availability = require('./models/Availability');
require('dotenv').config();

// MongoDB connection using the same URI as the main app
mongoose.connect(process.env.MONGO_URI);

async function debugAvailableSlots() {
  try {
    console.log('🔍 Debugging Available Slots Issue...\n');
    
    // Step 1: Check what specialists exist
    console.log('1. Checking specialists in database...');
    const specialists = await User.find({
      role: 'specialist',
      isApproved: true
    }).select('firstName lastName specialistCategory email');
    
    console.log(`Found ${specialists.length} approved specialists:`);
    specialists.forEach(spec => {
      console.log(`   - ${spec.firstName} ${spec.lastName} (${spec.specialistCategory}) - ${spec.email}`);
    });
    
    // Step 2: Check availability data
    console.log('\n2. Checking availability data...');
    const availabilities = await Availability.find({})
      .populate('doctor', 'firstName lastName specialistCategory')
      .sort({ date: 1 });
    
    console.log(`Found ${availabilities.length} availability records:`);
    
    const today = new Date();
    const futureAvailabilities = availabilities.filter(av => new Date(av.date) >= today);
    
    console.log(`Future availabilities: ${futureAvailabilities.length}`);
    
    futureAvailabilities.forEach(av => {
      const availableSlots = av.timeSlots.filter(slot => !slot.isBooked);
      const bookedSlots = av.timeSlots.filter(slot => slot.isBooked);
      
      console.log(`   📅 ${new Date(av.date).toLocaleDateString()}`);
      console.log(`      Doctor: ${av.doctor.firstName} ${av.doctor.lastName} (${av.doctor.specialistCategory})`);
      console.log(`      Total slots: ${av.timeSlots.length}`);
      console.log(`      Available: ${availableSlots.length}`);
      console.log(`      Booked: ${bookedSlots.length}`);
      
      if (availableSlots.length > 0) {
        console.log(`      Available times:`, availableSlots.map(slot => `${slot.startTime}-${slot.endTime}`).join(', '));
      }
      console.log('');
    });
    
    // Step 3: Test the specific query that the API uses
    console.log('3. Testing API query logic...');
    
    if (futureAvailabilities.length > 0) {
      const testDate = futureAvailabilities[0].date;
      const testSpecialty = futureAvailabilities[0].doctor.specialistCategory;
      
      console.log(`Testing for date: ${new Date(testDate).toLocaleDateString()}`);
      console.log(`Testing for specialty: ${testSpecialty}`);
      
      // Find doctors in specialty
      const doctors = await User.find({
        role: "specialist",
        specialistCategory: testSpecialty,
        isApproved: true,
      });
      
      console.log(`Found ${doctors.length} doctors for ${testSpecialty}`);
      
      const doctorIds = doctors.map((doctor) => doctor._id);
      
      // Create date range
      const requestDate = new Date(testDate);
      const startOfDay = new Date(requestDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(requestDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      console.log('Query date range:', { startOfDay, endOfDay });
      
      // Test the exact query used by the API
      const apiAvailabilities = await Availability.find({
        doctor: { $in: doctorIds },
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        timeSlots: {
          $elemMatch: {
            isBooked: false,
          },
        },
      }).populate("doctor", "firstName lastName specialistCategory");
      
      console.log(`API query returned ${apiAvailabilities.length} availabilities`);
      
      apiAvailabilities.forEach(av => {
        const availableSlots = av.timeSlots.filter(slot => !slot.isBooked);
        console.log(`   - ${av.doctor.firstName} ${av.doctor.lastName}: ${availableSlots.length} available slots`);
        availableSlots.forEach(slot => {
          console.log(`     ⏰ ${slot.startTime} - ${slot.endTime}`);
        });
      });
    }
    
    // Step 4: Check if there are any date/timezone issues
    console.log('\n4. Checking for date/timezone issues...');
    
    const sampleAvailability = await Availability.findOne({}).populate('doctor');
    if (sampleAvailability) {
      console.log('Sample availability date:', sampleAvailability.date);
      console.log('Date type:', typeof sampleAvailability.date);
      console.log('Date ISO string:', sampleAvailability.date.toISOString());
      console.log('Date local string:', sampleAvailability.date.toLocaleDateString());
    }
    
    console.log('\n✅ Debugging complete!');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugAvailableSlots();
