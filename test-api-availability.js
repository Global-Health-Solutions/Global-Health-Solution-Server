const axios = require('axios');
require('dotenv').config();

// Test the API endpoint directly
const testAvailabilityAPI = async () => {
  try {
    console.log('🔍 TESTING AVAILABILITY API ENDPOINT\n');
    
    // You'll need to replace this with a valid JWT token from a logged-in specialist
    // You can get this by logging in through the frontend and checking the network tab
    const testToken = 'YOUR_TEST_JWT_TOKEN_HERE'; // Replace with actual token
    
    if (testToken === 'YOUR_TEST_JWT_TOKEN_HERE') {
      console.log('⚠️  Please replace testToken with a valid JWT token from a logged-in specialist');
      console.log('💡 To get a token:');
      console.log('   1. Log in as a specialist through the frontend');
      console.log('   2. Open browser dev tools > Network tab');
      console.log('   3. Look for the Authorization header in any API request');
      console.log('   4. Copy the token (without "Bearer " prefix) and paste it in this script');
      return;
    }
    
    const baseURL = 'http://localhost:8000'; // Adjust if your server runs on a different port
    
    // Test setting online status to true
    console.log('📡 Testing: Set status to ONLINE');
    try {
      const onlineResponse = await axios.put(`${baseURL}/api/users/availability`, 
        { isOnline: true },
        { 
          headers: { 
            'Authorization': `Bearer ${testToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Online response:', {
        success: onlineResponse.data.success,
        message: onlineResponse.data.message,
        isOnline: onlineResponse.data.data?.isOnline
      });
    } catch (error) {
      console.log('❌ Online request failed:', error.response?.data || error.message);
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test setting online status to false
    console.log('\n📡 Testing: Set status to OFFLINE');
    try {
      const offlineResponse = await axios.put(`${baseURL}/api/users/availability`, 
        { isOnline: false },
        { 
          headers: { 
            'Authorization': `Bearer ${testToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Offline response:', {
        success: offlineResponse.data.success,
        message: offlineResponse.data.message,
        isOnline: offlineResponse.data.data?.isOnline
      });
    } catch (error) {
      console.log('❌ Offline request failed:', error.response?.data || error.message);
    }
    
    // Test toggle (without specifying isOnline)
    console.log('\n📡 Testing: Toggle status (no isOnline parameter)');
    try {
      const toggleResponse = await axios.put(`${baseURL}/api/users/availability`, 
        {}, // Empty body to test toggle functionality
        { 
          headers: { 
            'Authorization': `Bearer ${testToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Toggle response:', {
        success: toggleResponse.data.success,
        message: toggleResponse.data.message,
        isOnline: toggleResponse.data.data?.isOnline
      });
    } catch (error) {
      console.log('❌ Toggle request failed:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Instructions for getting a test token
console.log('🚀 API Availability Test Script');
console.log('=====================================\n');

testAvailabilityAPI();
