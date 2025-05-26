const mongoose = require('mongoose');
const User = require('./models/User');
const Availability = require('./models/Availability');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/globalHealthSolution');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Debug patient booking flow
const debugPatientBookingFlow = async () => {
  try {
    console.log('\n🔍 DEBUGGING PATIENT BOOKING FLOW\n');
    
    const specialty = 'Cardiology'; // Test with a specific specialty
    const testDate = '2025-05-27'; // Test with tomorrow's date
    
    console.log(`Testing specialty: ${specialty}`);
    console.log(`Testing date: ${testDate}\n`);
    
    // Step 1: Simulate getAvailableDates endpoint
    console.log('📅 STEP 1: Testing getAvailableDates logic...');
    
    const doctors = await User.find({
      role: "specialist",
      specialistCategory: specialty,
      isApproved: true,
    });
    
    console.log(`Found ${doctors.length} doctors for ${specialty}:`);
    doctors.forEach(doc => {
      console.log(`  - ${doc.firstName} ${doc.lastName} (${doc.specialistCategory || 'undefined specialty'})`);
    });
    
    if (doctors.length === 0) {
      console.log('❌ No doctors found - this is the problem!');
      return;
    }
    
    const doctorIds = doctors.map(d => d._id);
    
    // Get available dates (30 days from now)
    const start = new Date();
    const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const availableDatesQuery = await Availability.find({
      doctor: { $in: doctorIds },
      date: { $gte: start, $lte: end },
      timeSlots: { $elemMatch: { isBooked: false } },
    }).populate("doctor", "firstName lastName specialistCategory");
    
    console.log(`\nFound ${availableDatesQuery.length} availabilities with slots in date range`);
    
    // Group by date
    const availableDates = availableDatesQuery.reduce((acc, availability) => {
      const dateStr = availability.date.toISOString().split('T')[0];
      const availableSlots = availability.timeSlots.filter(slot => !slot.isBooked);
      
      if (availableSlots.length > 0) {
        if (!acc[dateStr]) {
          acc[dateStr] = {
            date: dateStr,
            availableSlots: 0,
            doctors: [],
          };
        }
        acc[dateStr].availableSlots += availableSlots.length;
        acc[dateStr].doctors.push({
          id: availability.doctor._id,
          name: `${availability.doctor.firstName} ${availability.doctor.lastName}`,
          availableSlots: availableSlots.length,
        });
      }
      return acc;
    }, {});
    
    const sortedDates = Object.values(availableDates);
    console.log(`Available dates found: ${sortedDates.length}`);
    
    sortedDates.slice(0, 5).forEach(dateInfo => {
      console.log(`  📅 ${dateInfo.date}: ${dateInfo.availableSlots} slots from ${dateInfo.doctors.length} doctors`);
    });
    
    // Step 2: Test specific date slot fetching
    console.log(`\n🎯 STEP 2: Testing getAvailableSlots for ${testDate}...`);
    
    const startOfDay = new Date(testDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(testDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log(`Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
    
    const availableSlots = await Availability.find({
      doctor: { $in: doctorIds },
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlots: { $elemMatch: { isBooked: false } },
    }).populate("doctor", "firstName lastName specialistCategory");
    
    console.log(`Found ${availableSlots.length} availabilities for ${testDate}`);
    
    if (availableSlots.length === 0) {
      console.log('❌ No slots found for specific date!');
      
      // Debug: Check what's in the database for this date
      console.log('\n🔍 Debugging: All availabilities for this date (including booked):');
      const allAvailabilities = await Availability.find({
        doctor: { $in: doctorIds },
        date: { $gte: startOfDay, $lte: endOfDay },
      }).populate("doctor", "firstName lastName specialistCategory");
      
      console.log(`Total availabilities (including booked): ${allAvailabilities.length}`);
      allAvailabilities.forEach(av => {
        const availableSlots = av.timeSlots.filter(slot => !slot.isBooked);
        const bookedSlots = av.timeSlots.filter(slot => slot.isBooked);
        console.log(`  Dr. ${av.doctor.firstName} ${av.doctor.lastName}: ${availableSlots.length} available, ${bookedSlots.length} booked`);
      });
    } else {
      availableSlots.forEach(availability => {
        const availableTimeSlots = availability.timeSlots.filter(slot => !slot.isBooked);
        console.log(`  👨‍⚕️ Dr. ${availability.doctor.firstName} ${availability.doctor.lastName}: ${availableTimeSlots.length} available slots`);
        availableTimeSlots.slice(0, 3).forEach(slot => {
          console.log(`    ⏰ ${slot.startTime} - ${slot.endTime}`);
        });
      });
    }
    
    // Step 3: Check for data inconsistencies
    console.log('\n🔍 STEP 3: Checking for data inconsistencies...');
    
    // Check if doctors have undefined specialties
    const doctorsWithUndefinedSpecialty = await User.find({
      role: "specialist",
      $or: [
        { specialistCategory: { $exists: false } },
        { specialistCategory: null },
        { specialistCategory: undefined },
        { specialistCategory: "" }
      ]
    });
    
    if (doctorsWithUndefinedSpecialty.length > 0) {
      console.log(`⚠️ Found ${doctorsWithUndefinedSpecialty.length} doctors with undefined/null specialty:`);
      doctorsWithUndefinedSpecialty.forEach(doc => {
        console.log(`  - ${doc.firstName} ${doc.lastName} (specialty: ${doc.specialistCategory})`);
      });
    }
    
    // Check timezone issues
    console.log('\n🌍 Checking timezone handling...');
    const sampleAvailability = await Availability.findOne({
      doctor: { $in: doctorIds }
    });
    
    if (sampleAvailability) {
      console.log(`Sample availability date: ${sampleAvailability.date}`);
      console.log(`Date as ISO string: ${sampleAvailability.date.toISOString()}`);
      console.log(`Date split for comparison: ${sampleAvailability.date.toISOString().split('T')[0]}`);
      console.log(`Test date for comparison: ${testDate}`);
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
};

// Run the debug
const main = async () => {
  await connectDB();
  await debugPatientBookingFlow();
  process.exit(0);
};

main().catch(console.error);
