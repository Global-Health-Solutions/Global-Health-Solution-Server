const mongoose = require('mongoose');
const User = require('./models/User');
const Availability = require('./models/Availability');
require('dotenv').config();

// MongoDB connection using the same URI as the main app
mongoose.connect(process.env.MONGO_URI);

async function createTestCalendarData() {
  try {
    console.log('Creating test availability data for calendar visualization...');
    
    // Find the test doctor
    const testDoctor = await User.findOne({ 
      email: 'testdoctor@example.com',
      role: 'specialist'
    });
    
    if (!testDoctor) {
      console.log('Test doctor not found. Please run create-test-users.js first.');
      return;
    }
    
    console.log(`Found test doctor: ${testDoctor.firstName} ${testDoctor.lastName} (${testDoctor._id})`);
    
    // Clear existing test availability for this doctor
    await Availability.deleteMany({ doctor: testDoctor._id });
    console.log('Cleared existing test availability data');
    
    // Create availability for various dates in the current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const testAvailabilities = [];
    
    // Add availability for several dates to demonstrate visual indicators
    const datesAndPatterns = [
      { days: 1, pattern: 'morning-available' },    // Tomorrow: morning slots, all available
      { days: 3, pattern: 'afternoon-partial' },   // In 3 days: afternoon slots, some booked
      { days: 5, pattern: 'fullday-available' },   // In 5 days: full day, all available
      { days: 7, pattern: 'morning-booked' },      // In 7 days: morning slots, all booked
      { days: 10, pattern: 'recurring-mixed' },    // In 10 days: recurring, mixed availability
      { days: 14, pattern: 'recurring-available' } // In 14 days: recurring, all available
    ];
    
    for (const { days, pattern } of datesAndPatterns) {
      const date = new Date(currentYear, currentMonth, now.getDate() + days);
      
      let timeSlots = [];
      let isRecurring = false;
      
      switch (pattern) {
        case 'morning-available':
          timeSlots = [
            { startTime: '09:00', endTime: '10:00', isBooked: false },
            { startTime: '10:00', endTime: '11:00', isBooked: false },
            { startTime: '11:00', endTime: '12:00', isBooked: false }
          ];
          break;
          
        case 'afternoon-partial':
          timeSlots = [
            { startTime: '14:00', endTime: '15:00', isBooked: true },
            { startTime: '15:00', endTime: '16:00', isBooked: false },
            { startTime: '16:00', endTime: '17:00', isBooked: false }
          ];
          break;
          
        case 'fullday-available':
          timeSlots = [
            { startTime: '09:00', endTime: '10:00', isBooked: false },
            { startTime: '10:00', endTime: '11:00', isBooked: false },
            { startTime: '11:00', endTime: '12:00', isBooked: false },
            { startTime: '14:00', endTime: '15:00', isBooked: false },
            { startTime: '15:00', endTime: '16:00', isBooked: false },
            { startTime: '16:00', endTime: '17:00', isBooked: false }
          ];
          break;
          
        case 'morning-booked':
          timeSlots = [
            { startTime: '09:00', endTime: '10:00', isBooked: true },
            { startTime: '10:00', endTime: '11:00', isBooked: true },
            { startTime: '11:00', endTime: '12:00', isBooked: true }
          ];
          break;
          
        case 'recurring-mixed':
          timeSlots = [
            { startTime: '09:00', endTime: '10:00', isBooked: true },
            { startTime: '10:00', endTime: '11:00', isBooked: false },
            { startTime: '14:00', endTime: '15:00', isBooked: false },
            { startTime: '15:00', endTime: '16:00', isBooked: true }
          ];
          isRecurring = true;
          break;
          
        case 'recurring-available':
          timeSlots = [
            { startTime: '14:00', endTime: '15:00', isBooked: false },
            { startTime: '15:00', endTime: '16:00', isBooked: false },
            { startTime: '16:00', endTime: '17:00', isBooked: false }
          ];
          isRecurring = true;
          break;
      }
      
      testAvailabilities.push({
        doctor: testDoctor._id,
        date: date,
        timeSlots: timeSlots,
        isRecurring: isRecurring,
        recurringPattern: isRecurring ? 'weekly' : null
      });
    }
    
    // Save all test availability data
    await Availability.insertMany(testAvailabilities);
    
    console.log('\n✅ Test availability data created successfully!');
    console.log('\nCalendar will show:');
    
    testAvailabilities.forEach((av, index) => {
      const totalSlots = av.timeSlots.length;
      const bookedSlots = av.timeSlots.filter(slot => slot.isBooked).length;
      const availableSlots = totalSlots - bookedSlots;
      
      let indicator = '';
      if (availableSlots > 0) {
        indicator = '🟢'; // Green circle for available
      } else {
        indicator = '🔴'; // Red circle for fully booked
      }
      
      const recurringIcon = av.isRecurring ? '🔵' : '';
      
      console.log(`${indicator}${recurringIcon} ${av.date.toLocaleDateString()}: ${availableSlots}/${totalSlots} available${av.isRecurring ? ' (recurring)' : ''}`);
    });
    
    console.log('\n📋 To test:');
    console.log('1. Login as testdoctor@example.com');
    console.log('2. Go to Calendar page');
    console.log('3. You should see visual indicators on the calendar dates');
    console.log('4. Green dots = available appointments');
    console.log('5. Red dots = fully booked');
    console.log('6. Blue dots = recurring schedule');
    console.log('7. Numbers show available/total slots');
    
  } catch (error) {
    console.error('Error creating test availability:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestCalendarData();
