const axios = require('axios');

const testEndpoints = async () => {
  const baseURL = 'http://localhost:8000/api';
  
  const specialty = 'Cardiology';
  const testDate = '2025-05-27';
  
  try {
    console.log('🔍 TESTING APPOINTMENT ENDPOINTS (NO AUTH)\n');
    console.log(`Specialty: ${specialty}`);
    console.log(`Date: ${testDate}\n`);
    
    // Test 1: Available dates
    console.log('📅 Testing /available-dates...');
    try {
      const datesResponse = await axios.get(`${baseURL}/appointments/available-dates`, {
        params: { specialty }
      });
      
      console.log(`✅ Status: ${datesResponse.status}`);
      console.log(`✅ Success: ${datesResponse.data.success}`);
      console.log(`✅ Available dates: ${datesResponse.data.data?.length || 0}`);
      
      if (datesResponse.data.debug) {
        console.log('🔍 Debug info:', datesResponse.data.debug);
      }
      
      if (datesResponse.data.data?.length > 0) {
        console.log('📋 Available dates:');
        datesResponse.data.data.forEach(date => {
          console.log(`  📅 ${date.date}: ${date.availableSlots} slots from ${date.doctors.length} doctors`);
        });
      }
    } catch (error) {
      console.log('❌ Available dates failed:', error.response?.data || error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Available slots for specific date
    console.log(`🎯 Testing /available-slots for ${testDate}...`);
    try {
      const slotsResponse = await axios.get(`${baseURL}/appointments/available-slots`, {
        params: { specialty, date: testDate }
      });
      
      console.log(`✅ Status: ${slotsResponse.status}`);
      console.log(`✅ Success: ${slotsResponse.data.success}`);
      console.log(`✅ Available slots: ${slotsResponse.data.data?.length || 0}`);
      console.log(`✅ Total slots: ${slotsResponse.data.availableSlots || 0}`);
      
      if (slotsResponse.data.debug) {
        console.log('🔍 Debug info:', slotsResponse.data.debug);
      }
      
      if (slotsResponse.data.data?.length > 0) {
        console.log('📋 Available slots:');
        slotsResponse.data.data.forEach(availability => {
          console.log(`  👨‍⚕️ Dr. ${availability.doctor.firstName} ${availability.doctor.lastName}:`);
          console.log(`    - Available: ${availability.availableSlots}`);
          console.log(`    - Total: ${availability.totalSlots}`);
          console.log(`    - Slots:`);
          availability.timeSlots.forEach(slot => {
            console.log(`      ⏰ ${slot.startTime} - ${slot.endTime}`);
          });
        });
      } else {
        console.log('❌ No slots found!');
      }
    } catch (error) {
      console.log('❌ Available slots failed:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Wait for server restart
setTimeout(() => {
  testEndpoints().then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  }).catch(console.error);
}, 2000);
