const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();

// Test script to verify notification functionality
async function testNotificationSystem() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // Test notification creation
    const Notification = require('./models/Notification');
    const { createNotification } = require('./utils/notificationService');
    
    // Create a test user ID (you should replace this with a real user ID from your database)
    const User = require('./models/User');
    const testUser = await User.findOne({ role: 'user' });
    
    if (!testUser) {
      console.log('⚠️  No test user found. Please create a user first.');
      return;
    }
    
    console.log('📧 Creating test notification...');
    
    // Test creating a notification
    const notification = await createNotification(
      testUser._id,
      'Test Notification',
      'This is a test notification to verify the system works',
      'system',
      null,
      { testData: true }
    );
    
    console.log('✅ Notification created successfully:', notification._id);
    
    // Test fetching notifications
    const notifications = await Notification.find({ user: testUser._id });
    console.log(`✅ Found ${notifications.length} notifications for user`);
    
    // Clean up test notification
    await Notification.findByIdAndDelete(notification._id);
    console.log('🧹 Test notification cleaned up');
    
    console.log('✅ Notification system test completed successfully');
    
  } catch (error) {
    console.error('❌ Error testing notification system:', error);
  } finally {
    process.exit(0);
  }
}

testNotificationSystem();
