import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Admin, Guard, Resident } from '../models/User';
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
import { UserRole } from '../constants';

// Modular Role Seed Data Imports
import {
  societyData,
  towerData,
  adminUserData,
  amenitiesData,
  noticesData,
  pollsData,
} from './admin.data';

import {
  guardUserData,
  sampleVisitorRequests,
} from './guard.data';

import {
  residentUsersData,
  staffDirectoryData,
  generatePaymentSeedData,
} from './resident.data';

dotenv.config();

const seed = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/portl';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // 1. Clear existing database collections
    await Promise.all([
      User.deleteMany({}),
      Admin.deleteMany({}),
      Guard.deleteMany({}),
      Resident.deleteMany({}),
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
    console.log('🗑️  Cleared existing database collections');

    // 2. Create Society Infrastructure (Admin Domain)
    const society = await Society.create(societyData);
    console.log('🏘️  Society created:', society.name);

    const towers = await Tower.insertMany(
      towerData.map((t) => ({ ...t, society: society._id }))
    );
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

    // 3. Create Admin Accounts (Admin Domain)
    const hashedPassword = await hashPassword('Demo@1234');
    const admin = await Admin.create({
      ...adminUserData,
      password: hashedPassword,
      society: society._id,
    });

    const loverbirdAdmin = await Admin.create({
      email: 'loverbirdcpr6457@gmail.com',
      name: 'Loverbird Admin',
      phone: '9876543299',
      role: UserRole.ADMIN,
      password: hashedPassword,
      society: society._id,
      isActive: true,
    });
    console.log('👑 Admin users created:', admin.email, loverbirdAdmin.email);

    // 4. Create Guard Account (Guard Domain)
    const guard = await Guard.create({
      ...guardUserData,
      password: hashedPassword,
      society: society._id,
    });
    console.log('🛡️  Guard user created:', guard.email);

    // 5. Create Resident Accounts & Link Flats (Resident Domain)
    const residents = [];
    for (const resData of residentUsersData) {
      const flatObj = flats[resData.flatIndex];
      const resident = await Resident.create({
        email: resData.email,
        password: hashedPassword,
        name: resData.name,
        phone: resData.phone,
        role: UserRole.RESIDENT,
        society: society._id,
        flat: flatObj._id,
        isActive: true,
      });
      residents.push(resident);
      await Flat.findByIdAndUpdate(flatObj._id, {
        $push: { residents: resident._id },
        isOccupied: true,
      });
    }
    console.log('👥 Resident users created:', residents.length);

    // 6. Create Staff, Amenities, Notices, and Polls (Admin & Resident Domains)
    await Staff.insertMany(
      staffDirectoryData.map((s) => ({ ...s, society: society._id }))
    );

    await Amenity.insertMany(
      amenitiesData.map((a) => ({ ...a, society: society._id }))
    );

    await Notice.insertMany(
      noticesData.map((n) => ({ ...n, society: society._id, author: admin._id }))
    );

    await Poll.insertMany(
      pollsData.map((p) => ({
        ...p,
        society: society._id,
        author: admin._id,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }))
    );
    console.log('📋 Amenities, Notices, Polls & Staff initialized');

    // 7. Create Visitor Requests (Guard Domain)
    await VisitorRequest.insertMany([
      {
        ...sampleVisitorRequests[0],
        flat: flats[0]._id,
        resident: residents[0]._id,
        guard: guard._id,
        society: society._id,
      },
      {
        ...sampleVisitorRequests[1],
        flat: flats[1]._id,
        resident: residents[1]._id,
        guard: guard._id,
        society: society._id,
      },
      {
        ...sampleVisitorRequests[2],
        flat: flats[2]._id,
        resident: residents[2]._id,
        guard: guard._id,
        entryGuard: guard._id,
        society: society._id,
      },
    ]);
    console.log('🚶 Visitor requests initialized');

    // 8. Create Maintenance Payments (Resident Domain)
    const paymentRecords: any[] = [];
    for (const resident of residents.slice(0, 3)) {
      const records = generatePaymentSeedData(resident._id, resident.flat, society._id);
      paymentRecords.push(...records);
    }
    await Payment.insertMany(paymentRecords);
    console.log('💰 Maintenance payments initialized:', paymentRecords.length);

    console.log('\n🎉 Modular Role Seed completed successfully!');
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
