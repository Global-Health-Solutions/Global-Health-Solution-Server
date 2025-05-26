const dotenv = require("dotenv");
dotenv.config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Availability = require('./models/Availability');

async function testAvailabilitySystem() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Find our test specialist
    const specialist = await User.findOne({ email: 'testdoctor@example.com' });
    if (!specialist) {
      console.log('Test specialist not found. Run create-test-users.js first.');
      return;
    }

    console.log('Found test specialist:', specialist.firstName, specialist.lastName);

    // Create test availability for the next few days
    const today = new Date();
    
    for (let i = 1; i <= 5; i++) {
      const testDate = new Date(today);
      testDate.setDate(today.getDate() + i);
      testDate.setHours(0, 0, 0, 0); // Start of day

      const testAvailability = {
        doctor: specialist._id,
        date: testDate,
        timeSlots: [
          { startTime: '09:00', endTime: '10:00', isBooked: false },
          { startTime: '10:00', endTime: '11:00', isBooked: false },
          { startTime: '11:00', endTime: '12:00', isBooked: false },
          { startTime: '14:00', endTime: '15:00', isBooked: false },
          { startTime: '15:00', endTime: '16:00', isBooked: false },
        ],
        isRecurring: false,
      };

      // Check if availability already exists
      const existingAvailability = await Availability.findOne({
        doctor: specialist._id,
        date: testDate
      });

      if (existingAvailability) {
        console.log(`Availability already exists for ${testDate.toLocaleDateString()}`);
      } else {
        const newAvailability = await Availability.create(testAvailability);
        console.log(`Created availability for ${testDate.toLocaleDateString()}:`, newAvailability._id);
      }
    }

    // Test fetching available dates for Cardiology
    console.log('\n--- Testing getAvailableDates for Cardiology ---');
    const availabilities = await Availability.find({
      doctor: specialist._id,
      timeSlots: {
        $elemMatch: {
          isBooked: false,
        },
      },
    }).populate('doctor', 'firstName lastName specialistCategory');

    console.log('Available slots found:', availabilities.length);
    availabilities.forEach(av => {
      const availableSlots = av.timeSlots.filter(slot => !slot.isBooked);
      console.log(`Date: ${av.date.toLocaleDateString()}, Available slots: ${availableSlots.length}`);
    });

    console.log('\nTest completed successfully!');
    console.log('Now you can:');
    console.log('1. Log in as doctor (testdoctor@example.com) to set more availability');
    console.log('2. Log in as patient (testpatient@example.com) to book appointments');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAvailabilitySystem();
