const mongoose = require('mongoose');
const Availability = require('./models/Availability');

async function checkAvailabilityData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/Global-Health-Solution', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    const totalAvailabilities = await Availability.find({});
    console.log('📊 Total availability records:', totalAvailabilities.length);
    
    const allAvailabilities = await Availability.find({})
      .populate('doctor', 'firstName lastName specialistCategory');
    
    console.log('\n📋 Availability breakdown by specialty:');
    const specialtyGroups = {};
    
    allAvailabilities.forEach(av => {
      const specialty = av.doctor.specialistCategory;
      if (!specialtyGroups[specialty]) {
        specialtyGroups[specialty] = [];
      }
      specialtyGroups[specialty].push(av);
    });
    
    Object.keys(specialtyGroups).forEach(specialty => {
      const count = specialtyGroups[specialty].length;
      const totalSlots = specialtyGroups[specialty].reduce((sum, av) => sum + av.timeSlots.length, 0);
      const availableSlots = specialtyGroups[specialty].reduce((sum, av) => sum + av.timeSlots.filter(slot => !slot.isBooked).length, 0);
      console.log(`  🩺 ${specialty}: ${count} records, ${availableSlots}/${totalSlots} available slots`);
    });

    // Show specific example data
    console.log('\n📄 Sample availability records:');
    const sampleRecords = allAvailabilities.slice(0, 3);
    sampleRecords.forEach(av => {
      console.log(`\n  📅 Date: ${av.date.toISOString().split('T')[0]}`);
      console.log(`  👨‍⚕️ Doctor: ${av.doctor.firstName} ${av.doctor.lastName} (${av.doctor.specialistCategory})`);
      console.log(`  🕒 Time slots: ${av.timeSlots.length}`);
      av.timeSlots.forEach((slot, index) => {
        console.log(`    ${index + 1}. ${slot.startTime}-${slot.endTime} ${slot.isBooked ? '(BOOKED)' : '(AVAILABLE)'}`);
      });
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Database check completed');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAvailabilityData();
