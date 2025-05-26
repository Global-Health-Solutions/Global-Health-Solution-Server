// Test the booking flow with authentication
const axios = require('axios');

const testWithAuth = async () => {
  const baseURL = 'http://localhost:8000/api';
  
  try {
    console.log('🔑 Logging in to get authentication token...');
    
    // Login as a test patient
    const loginResponse = await axios.post(`${baseURL}/users/login`, {
      email: 'testpatient@example.com',
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed');
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Set up axios instance with auth
    const authAxios = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const specialty = 'Cardiology';
    const testDate = '2025-05-27';
    
    console.log(`\n🔍 Testing booking flow for ${specialty} on ${testDate}`);
    
    // Test 1: Get available dates
    console.log('\n📅 STEP 1: Testing /api/appointments/available-dates...');
    try {
      const availableDatesResponse = await authAxios.get('/appointments/available-dates', {
        params: { specialty }
      });
      
      console.log('✅ Available dates response:');
      console.log(`Status: ${availableDatesResponse.status}`);
      console.log(`Success: ${availableDatesResponse.data.success}`);
      console.log(`Available dates: ${availableDatesResponse.data.data?.length || 0}`);
      
      if (availableDatesResponse.data.debug) {
        console.log('🔍 Debug info:', availableDatesResponse.data.debug);
      }
      
      if (availableDatesResponse.data.data?.length > 0) {
        console.log('📅 First few available dates:');
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
      const availableSlotsResponse = await authAxios.get('/appointments/available-slots', {
        params: { 
          specialty,
          date: testDate 
        }
      });
      
      console.log('✅ Available slots response:');
      console.log(`Status: ${availableSlotsResponse.status}`);
      console.log(`Success: ${availableSlotsResponse.data.success}`);
      console.log(`Available slots: ${availableSlotsResponse.data.data?.length || 0}`);
      console.log(`Total slots: ${availableSlotsResponse.data.availableSlots || 0}`);
      
      if (availableSlotsResponse.data.debug) {
        console.log('🔍 Debug info:', availableSlotsResponse.data.debug);
      }
      
      if (availableSlotsResponse.data.data?.length > 0) {
        console.log('👨‍⚕️ Doctors with available slots:');
        availableSlotsResponse.data.data.forEach(availability => {
          console.log(`  Dr. ${availability.doctor.firstName} ${availability.doctor.lastName}: ${availability.timeSlots.length} slots`);
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
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Wait for server to be ready
setTimeout(() => {
  testWithAuth().then(() => {
    console.log('\n✅ Authenticated test completed');
    process.exit(0);
  }).catch(console.error);
}, 2000);
