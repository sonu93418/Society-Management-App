const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/portl';

const test = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to Database');

    const { User } = require('../src/models/User');
    const { DeviceToken } = require('../src/models/DeviceToken');
    const { NotificationQueue } = require('../src/models/NotificationQueue');
    const { notificationQueueService } = require('../src/services/notificationQueue.service');

    // Find a demo user
    const user = await User.findOne({});
    if (!user) {
      console.error('❌ No user found in database. Seed the database first.');
      process.exit(1);
    }

    console.log(`👤 Found Demo User: ${user.name} (${user.email})`);

    // Verify preferences defaults
    console.log('📋 Current Notification Preferences:', user.notificationPreferences);

    // Enqueue a mock payment notification
    const paymentNotification = await notificationQueueService.enqueue({
      userId: user._id.toString(),
      title: '💳 Maintenance Invoice Due',
      body: 'Your maintenance dues for August 2026 are pending payment.',
      category: 'payment',
      data: { invoiceId: 'INV12345' },
    });

    if (paymentNotification) {
      console.log('✅ Payment notification enqueued successfully:', paymentNotification.title);
      console.log('   Status:', paymentNotification.status);
      console.log('   Category:', paymentNotification.category);
    }

    // Temporarily turn OFF payment notifications
    user.notificationPreferences = {
      ...user.notificationPreferences,
      payment: false,
    };
    await user.save();
    console.log('⚙️ Temporarily disabled payments notifications.');

    // Try enqueuing payment notification again (should skip!)
    const skippedNotification = await notificationQueueService.enqueue({
      userId: user._id.toString(),
      title: '💳 Maintenance Invoice Due (Again)',
      body: 'Your maintenance dues for August 2026 are pending payment.',
      category: 'payment',
      data: { invoiceId: 'INV12345' },
    });

    if (skippedNotification === null) {
      console.log('✅ Successfully filtered and skipped enqueuing payment notification due to user preference.');
    } else {
      console.error('❌ Failed! Notification should have been skipped.');
    }

    // Try enqueuing an emergency notification (should NOT skip even if payment is off)
    const emergencyNotification = await notificationQueueService.enqueue({
      userId: user._id.toString(),
      title: '🚨 Drill Announcement',
      body: 'Evacuation drill scheduled for tomorrow morning.',
      category: 'emergency',
    });

    if (emergencyNotification) {
      console.log('✅ Emergency notification enqueued (bypassed preferences successfully):', emergencyNotification.title);
    }

    // Restore preferences
    user.notificationPreferences = {
      ...user.notificationPreferences,
      payment: true,
    };
    await user.save();
    console.log('⚙️ Restored default preferences.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Script failed:', err);
    process.exit(1);
  }
};

test();
