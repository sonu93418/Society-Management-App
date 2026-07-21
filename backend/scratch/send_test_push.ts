import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/portl';

// Map of test data configurations per feature
const FEATURE_TESTS: Record<string, { title: string; body: string; category: any; data: Record<string, string> }> = {
  visitor: {
    title: '🔔 Visitor at Gate',
    body: 'John Doe (Delivery) is waiting at the main gate.',
    category: 'visitor',
    data: { visitorId: 'VIS101' },
  },
  complaint: {
    title: '🛠️ Complaint Resolved',
    body: 'Your ticket #1024 regarding "Water Leakage" has been marked as resolved.',
    category: 'complaint',
    data: { ticketId: '6a5640990f2024736825629f' },
  },
  payment: {
    title: '💳 Maintenance Invoice Due',
    body: 'Maintenance invoice for August 2026 is pending. Amount: $150.',
    category: 'payment',
    data: { invoiceId: 'INV9928' },
  },
  notice: {
    title: '📋 New Society Notice',
    body: 'The annual maintenance schedule for elevators is posted on the notice board.',
    category: 'notice',
    data: { noticeId: 'NTC883' },
  },
  booking: {
    title: '🏸 Clubhouse Booking Confirmed',
    body: 'Your slot booking for Badminton Court 1 on July 20th is approved.',
    category: 'booking',
    data: { bookingId: 'BK332' },
  },
  poll: {
    title: '📊 New Community Poll',
    body: 'Should the society install solar panels? Cast your vote now!',
    category: 'poll',
    data: { pollId: 'POL404' },
  },
  emergency: {
    title: '🚨 Emergency Fire Alert',
    body: 'This is a test of the society fire alarm system. Please stay indoors.',
    category: 'emergency',
    data: { alarmId: 'ALM911' },
  },
  general: {
    title: '📢 General Announcement',
    body: 'Water supply will be temporarily shut off tomorrow from 2 PM to 4 PM.',
    category: 'general',
    data: { generalId: 'GEN772' },
  },
};

const sendDirectTest = async () => {
  const arg = process.argv[2]?.toLowerCase();
  
  if (!arg || !FEATURE_TESTS[arg]) {
    console.log('\n❌ Please specify a valid feature to test.');
    console.log('Usage: npx ts-node scratch/send_test_push.ts <feature>');
    console.log('\nAvailable features:');
    Object.keys(FEATURE_TESTS).forEach(key => {
      console.log(`  - ${key}`);
    });
    process.exit(1);
  }

  const selectedTest = FEATURE_TESTS[arg];

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    const { DeviceToken } = require('../src/models/DeviceToken');
    const { pushNotificationService } = require('../src/services/pushNotification.service');
    const { initializeFirebase } = require('../src/config/firebase');

    // Initialize Firebase Admin SDK
    initializeFirebase();

    // Find active developer device tokens
    const tokens = await DeviceToken.find({ isActive: true });
    if (tokens.length === 0) {
      console.log('❌ No active device tokens found in the database. Please log in on the app first so your device registers.');
      process.exit(0);
    }

    console.log(`📱 Found ${tokens.length} active device tokens in the database.`);

    for (const device of tokens) {
      console.log(`\n⚡ Sending direct test push [Feature: ${arg.toUpperCase()}]`);
      console.log(`   User: ${device.user} | Token: ${device.token.substring(0, 15)}... | Type: ${device.tokenType}`);
      
      const result = await pushNotificationService.sendToUser({
        userId: device.user.toString(),
        title: selectedTest.title,
        body: selectedTest.body,
        category: selectedTest.category,
        data: selectedTest.data,
      });
      
      console.log(`📤 Dispatch response:`, result);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Direct push test failed:', err);
    process.exit(1);
  }
};

sendDirectTest();
