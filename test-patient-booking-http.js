const axios = require('axios');

// Test the patient booking flow via HTTP requests
const testPatientBookingFlow = async () => {
  const baseURL = 'http://localhost:8000/api';
  
  // You'll need to get a valid JWT token from login
  // For now, let's test without authentication first to see the errors
  
  try {
    console.log('🔍 TESTING PATIENT BOOKING FLOW VIA HTTP\n');
    
    const specialty = 'Cardiology';
    const testDate = '2025-05-27';
    
    console.log(`Testing specialty: ${specialty}`);
    console.log(`Testing date: ${testDate}\n`);
    
    // Test 1: Get available dates
    console.log('📅 STEP 1: Testing /api/appointments/available-dates...');
    try {
      const availableDatesResponse = await axios.get(`${baseURL}/appointments/available-dates`, {
        params: { specialty },
        timeout: 5000
      });
      
      console.log('✅ Available dates response:');
      console.log(`Status: ${availableDatesResponse.status}`);
      console.log(`Success: ${availableDatesResponse.data.success}`);
      console.log(`Available dates: ${availableDatesResponse.data.data?.length || 0}`);
      
      if (availableDatesResponse.data.data?.length > 0) {
        console.log('First few available dates:');
        availableDatesResponse.data.data.slice(0, 3).forEach(date => {
          console.log(`  📅 ${date.date}: ${date.availableSlots} slots from ${date.doctors.length} doctors`);
        });
      }
    } catch (error) {
      console.log('❌ Available dates failed:');
      console.log(`Status: ${error.response?.status || 'No response'}`);
      console.log(`Message: ${error.response?.data?.message || error.message}`);
    }
    
    // Test 2: Get available slots for specific date
    console.log(`\n🎯 STEP 2: Testing /api/appointments/available-slots for ${testDate}...`);
    try {
      const availableSlotsResponse = await axios.get(`${baseURL}/appointments/available-slots`, {
        params: { 
          specialty,
          date: testDate 
        },
        timeout: 5000
      });
      
      console.log('✅ Available slots response:');
      console.log(`Status: ${availableSlotsResponse.status}`);
      console.log(`Success: ${availableSlotsResponse.data.success}`);
      console.log(`Available slots: ${availableSlotsResponse.data.data?.length || 0}`);
      console.log(`Total slots: ${availableSlotsResponse.data.availableSlots || 0}`);
      
      if (availableSlotsResponse.data.data?.length > 0) {
        console.log('Doctors with available slots:');
        availableSlotsResponse.data.data.forEach(availability => {
          console.log(`  👨‍⚕️ Dr. ${availability.doctor.firstName} ${availability.doctor.lastName}: ${availability.timeSlots.length} slots`);
          availability.timeSlots.slice(0, 2).forEach(slot => {
            console.log(`    ⏰ ${slot.startTime} - ${slot.endTime}`);
          });
        });
      } else {
        console.log('❌ No available slots found for this date!');
      }
    } catch (error) {
      console.log('❌ Available slots failed:');
      console.log(`Status: ${error.response?.status || 'No response'}`);
      console.log(`Message: ${error.response?.data?.message || error.message}`);
      if (error.response?.data?.error) {
        console.log(`Error details: ${error.response.data.error}`);
      }
    }
    
    // Test 3: Check server logs for any additional info
    console.log('\n📊 Summary:');
    console.log('- Check if available dates endpoint shows dates with slots');
    console.log('- Check if available slots endpoint returns empty for same dates');
    console.log('- This would indicate a data consistency issue');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Wait a moment for server to start then run test
setTimeout(() => {
  testPatientBookingFlow().then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  }).catch(console.error);
}, 3000);
