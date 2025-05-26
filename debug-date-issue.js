const mongoose = require('mongoose');
const Availability = require('./models/Availability');
const User = require('./models/User');

const debugSpecificDate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const testDate = '2025-05-26';
    const specialty = 'Cardiology';
    
    console.log(`🔍 Debugging date: ${testDate}`);
    console.log(`🔍 Debugging specialty: ${specialty}\n`);
    
    // Find doctors
    const doctors = await User.find({
      role: "specialist",
      specialistCategory: { $regex: new RegExp(`^${specialty}$`, 'i') },
      isApproved: true,
    });
    
    console.log(`👨‍⚕️ Found ${doctors.length} doctors:`);
    doctors.forEach(doc => {
      console.log(`  - ${doc.firstName} ${doc.lastName} (${doc.specialistCategory})`);
    });
    
    const doctorIds = doctors.map(d => d._id);
    
    console.log(`\n📅 Checking all availabilities around ${testDate}...`);
    
    // Check availabilities for a range around this date
    const startDate = new Date('2025-05-25');
    const endDate = new Date('2025-05-28');
    
    const allAvailabilities = await Availability.find({
      doctor: { $in: doctorIds },
      date: { $gte: startDate, $lte: endDate }
    }).populate('doctor', 'firstName lastName').sort({ date: 1 });
    
    console.log(`\n📊 Found ${allAvailabilities.length} availabilities in range:`);
    allAvailabilities.forEach(av => {
      const dateStr = av.date.toISOString().split('T')[0];
      const availableSlots = av.timeSlots.filter(slot => !slot.isBooked);
      const bookedSlots = av.timeSlots.filter(slot => slot.isBooked);
      
      console.log(`\n📅 ${dateStr} (${av.date.toISOString()}):`);
      console.log(`  👨‍⚕️ Dr. ${av.doctor.firstName} ${av.doctor.lastName}`);
      console.log(`  📊 Total slots: ${av.timeSlots.length}`);
      console.log(`  ✅ Available: ${availableSlots.length}`);
      console.log(`  ❌ Booked: ${bookedSlots.length}`);
      
      if (availableSlots.length > 0) {
        console.log(`  ⏰ Available times: ${availableSlots.map(s => s.startTime + '-' + s.endTime).join(', ')}`);
      }
    });
    
    // Now test both query approaches
    console.log(`\n🔍 Testing query approaches for ${testDate}:`);
    
    // Approach 1: getAvailableDates style (uses date range)
    const start = new Date('2025-05-25');
    const end = new Date('2025-05-28');
    
    const datesQuery = await Availability.find({
      doctor: { $in: doctorIds },
      date: { $gte: start, $lte: end },
      timeSlots: { $elemMatch: { isBooked: false } },
    }).populate("doctor", "firstName lastName specialistCategory");
    
    console.log(`\n📅 getAvailableDates style query (${start.toISOString()} to ${end.toISOString()}):`);
    console.log(`  Found: ${datesQuery.length} availabilities`);
    
    // Approach 2: getAvailableSlots style (specific date)
    const requestDate = new Date(testDate);
    const startOfDay = new Date(requestDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log(`\n🎯 getAvailableSlots style query:`);
    console.log(`  Start: ${startOfDay.toISOString()}`);
    console.log(`  End: ${endOfDay.toISOString()}`);
    
    const slotsQuery = await Availability.find({
      doctor: { $in: doctorIds },
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlots: { $elemMatch: { isBooked: false } },
    }).populate("doctor", "firstName lastName specialistCategory");
    
    console.log(`  Found: ${slotsQuery.length} availabilities`);
    
    // Check if dates match
    slotsQuery.forEach(av => {
      console.log(`    📅 ${av.date.toISOString()} - Dr. ${av.doctor.firstName} ${av.doctor.lastName}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

debugSpecificDate();
