const express = require('express');
const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:8000/api';

// Simple test script to verify notification endpoints
async function testNotificationEndpoints() {
  try {
    console.log('🧪 Testing notification API endpoints...\n');
    
    // Test 1: Try to access notifications without authentication (should fail)
    console.log('Test 1: Accessing notifications without authentication');
    try {
      const response = await axios.get(`${BASE_URL}/notifications`);
      console.log('❌ Expected this to fail (no auth), but got:', response.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly rejected unauthenticated request');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    console.log('');
    
    // For a more complete test, we'd need to authenticate first
    // Let's just verify the server is responding
    console.log('Test 2: Server health check');
    try {
      const response = await axios.get(`${BASE_URL}/../test`);
      console.log('✅ Server is responding:', response.data);
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
    }
    
    console.log('\n📝 To fully test notifications:');
    console.log('1. Create a user account');
    console.log('2. Login to get an authentication token');
    console.log('3. Use the token to access /api/notifications');
    console.log('4. Create notifications via /api/notifications/create');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

testNotificationEndpoints();
