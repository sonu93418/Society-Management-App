import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Society } from '../models/Society';
import { Tower } from '../models/Tower';
import { Flat } from '../models/Flat';
import { Staff } from '../models/Staff';
import { Amenity } from '../models/Amenity';
import { Notice } from '../models/Notice';
import { Poll } from '../models/Poll';
import { Payment } from '../models/Payment';
import { VisitorRequest } from '../models/VisitorRequest';
import { hashPassword } from '../utils/hash';
import { UserRole, StaffCategory, VisitorType, VisitorStatus, PaymentStatus } from '../constants';

dotenv.config();

const seed = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/portl';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Society.deleteMany({}),
      Tower.deleteMany({}),
      Flat.deleteMany({}),
      Staff.deleteMany({}),
      Amenity.deleteMany({}),
      Notice.deleteMany({}),
      Poll.deleteMany({}),
      Payment.deleteMany({}),
      VisitorRequest.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create Society
    const society = await Society.create({
      name: 'Portl Residency',
      address: '123 Tech Park Road, Whitefield',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560066',
      totalTowers: 3,
      totalFlats: 12,
      contactEmail: 'admin@portlresidency.com',
      contactPhone: '9876543210',
    });
    console.log('🏘️  Society created:', society.name);

    // Create Towers
    const towers = await Tower.insertMany([
      { name: 'Tower A - Orchid', society: society._id, totalFloors: 10, totalFlats: 4 },
      { name: 'Tower B - Jasmine', society: society._id, totalFloors: 10, totalFlats: 4 },
      { name: 'Tower C - Lily', society: society._id, totalFloors: 10, totalFlats: 4 },
    ]);
    console.log('🏗️  Towers created:', towers.length);

    // Create Flats
    const flatData = [];
    for (const tower of towers) {
      for (let floor = 1; floor <= 4; floor++) {
        flatData.push({
          flatNumber: `${floor}01`,
          floor,
          tower: tower._id,
          society: society._id,
          type: floor <= 2 ? '2BHK' : '3BHK',
          area: floor <= 2 ? 1200 : 1600,
          isOccupied: floor <= 3,
        });
      }
    }
    const flats = await Flat.insertMany(flatData);
    console.log('🏠 Flats created:', flats.length);

    // Create users
    const hashedPassword = await hashPassword('Demo@1234');

    // Admin
    const admin = await User.create({
      email: 'admin@portl.app',
      password: hashedPassword,
      name: 'Rajesh Sharma',
      phone: '9876543210',
      role: UserRole.ADMIN,
      society: society._id,
      isActive: true,
    });

    // Guard
    const guard = await User.create({
      email: 'guard@portl.app',
      password: hashedPassword,
      name: 'Suresh Kumar',
      phone: '9876543211',
      role: UserRole.GUARD,
      society: society._id,
      isActive: true,
    });

    // Residents
    const residentData = [
      { email: 'resident@portl.app', name: 'Priya Patel', phone: '9876543212', flat: flats[0]._id },
      { email: 'ankit@portl.app', name: 'Ankit Verma', phone: '9876543213', flat: flats[1]._id },
      { email: 'neha@portl.app', name: 'Neha Gupta', phone: '9876543214', flat: flats[2]._id },
      { email: 'vikram@portl.app', name: 'Vikram Singh', phone: '9876543215', flat: flats[4]._id },
      { email: 'meera@portl.app', name: 'Meera Nair', phone: '9876543216', flat: flats[5]._id },
    ];

    const residents = [];
    for (const data of residentData) {
      const resident = await User.create({
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone,
        role: UserRole.RESIDENT,
        society: society._id,
        flat: data.flat,
        isActive: true,
      });
      residents.push(resident);
      await Flat.findByIdAndUpdate(data.flat, {
        $push: { residents: resident._id },
        isOccupied: true,
      });
    }
    console.log('👥 Users created: 1 admin, 1 guard,', residents.length, 'residents');

    // Create Staff
    await Staff.insertMany([
      { name: 'Raju Electrician', phone: '9800000001', category: StaffCategory.ELECTRICIAN, society: society._id, workingHours: '9:00 AM - 6:00 PM', description: 'Handles all electrical repairs' },
      { name: 'Mohan Plumber', phone: '9800000002', category: StaffCategory.PLUMBER, society: society._id, workingHours: '9:00 AM - 5:00 PM', description: 'Plumbing & water tank maintenance' },
      { name: 'Lakshmi Housekeeping', phone: '9800000003', category: StaffCategory.HOUSEKEEPING, society: society._id, workingHours: '7:00 AM - 4:00 PM', description: 'Common area cleaning' },
      { name: 'Ramu Gardener', phone: '9800000004', category: StaffCategory.GARDENER, society: society._id, workingHours: '6:00 AM - 12:00 PM', description: 'Garden & landscape maintenance' },
    ]);
    console.log('🧑‍🔧 Staff created: 4');

    // Create Amenities
    const amenities = await Amenity.insertMany([
      { name: 'Swimming Pool', description: 'Olympic-size heated swimming pool with separate kids pool', society: society._id, capacity: 20, pricePerSlot: 0, availableFrom: '06:00', availableTo: '21:00', rules: ['Shower before entering', 'No diving in shallow end', 'Children must be accompanied'] },
      { name: 'Clubhouse', description: 'Multi-purpose clubhouse with AC and sound system', society: society._id, capacity: 50, pricePerSlot: 500, availableFrom: '09:00', availableTo: '22:00', requiresApproval: true, rules: ['No outside catering without permission', 'Clean up after use'] },
      { name: 'Tennis Court', description: 'Professional tennis court with floodlights', society: society._id, capacity: 4, pricePerSlot: 200, availableFrom: '06:00', availableTo: '21:00', rules: ['Proper sports shoes required', 'Max 1 hour per slot'] },
      { name: 'Gym', description: 'Fully equipped fitness center with cardio and weights', society: society._id, capacity: 15, pricePerSlot: 0, availableFrom: '05:30', availableTo: '22:00', rules: ['Carry a towel', 'Wipe equipment after use'] },
    ]);
    console.log('🏊 Amenities created:', amenities.length);

    // Create Notices
    await Notice.insertMany([
      { title: 'Water Supply Maintenance', content: 'Water supply will be interrupted on Sunday, 20th July from 10:00 AM to 2:00 PM for tank cleaning and maintenance work. Please store adequate water beforehand. We apologize for the inconvenience.', society: society._id, author: admin._id, isPinned: true },
      { title: 'Annual General Meeting', content: 'The Annual General Meeting for FY 2025-26 will be held on 25th July at 6:00 PM in the Clubhouse. All flat owners are requested to attend. Agenda includes budget approval, new committee election, and society improvement proposals.', society: society._id, author: admin._id },
      { title: 'New Parking Guidelines', content: 'Please note the updated parking guidelines effective from 1st August. Each flat is entitled to one covered parking slot. Visitor parking is available near the main gate. Unauthorized vehicles will be towed.', society: society._id, author: admin._id },
      { title: 'Diwali Celebration', content: 'Join us for the society Diwali celebration on 20th October at 7:00 PM at the garden area. There will be a community dinner, rangoli competition, and fireworks display. Families are welcome!', society: society._id, author: admin._id },
    ]);
    console.log('📋 Notices created: 4');

    // Create Polls
    await Poll.insertMany([
      {
        title: 'Should we install EV charging stations?',
        description: 'Proposal to install 4 EV charging stations in the parking area. Estimated cost: ₹2,00,000 from society fund.',
        options: [{ text: 'Yes, definitely needed', votes: 8 }, { text: 'No, not necessary right now', votes: 3 }, { text: 'Yes, but only 2 stations', votes: 5 }],
        society: society._id, author: admin._id, isAnonymous: false, endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), totalVotes: 16,
      },
      {
        title: 'Preferred timing for yoga classes',
        description: 'We are planning to start yoga classes in the clubhouse. Please vote for your preferred timing.',
        options: [{ text: '6:00 AM - 7:00 AM', votes: 12 }, { text: '7:00 AM - 8:00 AM', votes: 7 }, { text: '6:00 PM - 7:00 PM', votes: 4 }],
        society: society._id, author: admin._id, isAnonymous: true, endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), totalVotes: 23,
      },
    ]);
    console.log('🗳️  Polls created: 2');

    // Create sample visitor requests
    await VisitorRequest.insertMany([
      {
        visitorName: 'Rahul Delivery', visitorPhone: '9900000001', purpose: 'Amazon Package', type: VisitorType.DELIVERY,
        flat: flats[0]._id, resident: residents[0]._id, guard: guard._id, society: society._id,
        status: VisitorStatus.PENDING, expectedCount: 1,
      },
      {
        visitorName: 'Sunita Aunty', visitorPhone: '9900000002', purpose: 'Family Visit', type: VisitorType.GUEST,
        flat: flats[1]._id, resident: residents[1]._id, guard: guard._id, society: society._id,
        status: VisitorStatus.APPROVED, approvedAt: new Date(), qrCode: 'demo-qr-001', expectedCount: 2,
      },
      {
        visitorName: 'Ola Driver', visitorPhone: '9900000003', purpose: 'Cab Pickup', type: VisitorType.CAB,
        flat: flats[2]._id, resident: residents[2]._id, guard: guard._id, society: society._id,
        status: VisitorStatus.INSIDE, approvedAt: new Date(), entryAt: new Date(), entryGuard: guard._id, expectedCount: 1,
      },
    ]);
    console.log('🚶 Visitor requests created: 3');

    // Create Payments
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
    const paymentData: any[] = [];
    for (const resident of residents.slice(0, 3)) {
      for (let i = 0; i < months.length; i++) {
        paymentData.push({
          resident: resident._id,
          flat: resident.flat,
          society: society._id,
          amount: 5000,
          month: months[i],
          year: 2026,
          status: i < 5 ? PaymentStatus.PAID : i === 5 ? PaymentStatus.PENDING : PaymentStatus.OVERDUE,
          dueDate: new Date(2026, i, 10),
          paidAt: i < 5 ? new Date(2026, i, 8) : undefined,
          description: 'Monthly Maintenance',
        });
      }
    }
    await Payment.insertMany(paymentData);
    console.log('💰 Payments created:', paymentData.length);

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📧 Demo Credentials:');
    console.log('   Resident: resident@portl.app / Demo@1234');
    console.log('   Guard:    guard@portl.app / Demo@1234');
    console.log('   Admin:    admin@portl.app / Demo@1234');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();
