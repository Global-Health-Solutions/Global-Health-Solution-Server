const express = require('express');
const connectDB = require('./config/db');
const { testEmailConfiguration } = require('./utils/emailService');
require('dotenv').config();

// Test script to verify email functionality
async function testEmailSystem() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // Test email configuration
    console.log('🧪 Testing email configuration...');
    const isEmailReady = await testEmailConfiguration();
    
    if (isEmailReady) {
      console.log('✅ Email system is properly configured and ready to send emails');
    } else {
      console.log('❌ Email system configuration issues found');
    }
    
    console.log('✅ Email system test completed');
    
  } catch (error) {
    console.error('❌ Error testing email system:', error);
  } finally {
    process.exit(0);
  }
}

testEmailSystem();
