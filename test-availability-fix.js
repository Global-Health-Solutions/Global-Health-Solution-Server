const axios = require('axios');

// Test the availability update endpoint
async function testAvailabilityUpdate() {
  try {
    console.log('🧪 Testing availability update endpoint...');
    
    // First, we need to get a valid JWT token
    // For testing purposes, let's use the login endpoint
    console.log('📝 Attempting to log in as a test specialist...');
    
    const loginResponse = await axios.post('http://localhost:8000/api/users/login', {
      email: 'testdoctor@example.com', // Test doctor from create-test-users.js
      password: 'password123'
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      const token = loginResponse.data.token;
      console.log('✅ Login successful');
      
      // Now test the availability update
      console.log('🔄 Testing availability update...');
      
      const availabilityResponse = await axios.put(
        'http://localhost:8000/api/users/availability',
        { isOnline: true },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Availability update successful!');
      console.log('📊 Response:', availabilityResponse.data);
      
      // Test turning offline
      const offlineResponse = await axios.put(
        'http://localhost:8000/api/users/availability',
        { isOnline: false },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Offline update successful!');
      console.log('📊 Response:', offlineResponse.data);
      
    } else {
      console.log('❌ Login failed:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📋 Error response:', error.response.data);
      console.error('🔢 Status code:', error.response.status);
    }
  }
}

testAvailabilityUpdate();
