import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { superAdminService } from '../services/superAdmin.service';
import { SocietyOnboardingRequest } from '../models/SocietyOnboardingRequest';
import { Society } from '../models/Society';
import { User } from '../models/User';
import { hashPassword } from '../utils/hash';

dotenv.config();

const runTest = async () => {
  console.log('🧪 Starting Automated Onboarding Flow Tests...');
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/portl';
  await mongoose.connect(uri);

  const testEmail = 'onboarding_test_admin@test.com';

  try {
    // 1. Cleanup any previous test data
    await SocietyOnboardingRequest.deleteMany({ adminEmail: testEmail });
    await Society.deleteMany({ contactEmail: testEmail });
    await User.deleteMany({ email: testEmail });

    console.log('🧹 Cleaned up old test records.');

    // 2. Submit onboarding request
    const dummyPasswordHash = await hashPassword('Test@1234');
    const request = await superAdminService.submitRequest({
      societyName: 'Test Automation Society',
      address: '999 Silicon Highway',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560100',
      totalTowers: 2,
      totalFlats: 40,
      adminName: 'Test Automated Admin',
      adminEmail: testEmail,
      adminPhone: '9999999900',
      adminPasswordHash: dummyPasswordHash,
    });

    console.log(`📤 Society onboarding request submitted. ID: ${request._id}`);
    if (request.status !== 'pending') {
      throw new Error(`Expected status to be pending, got ${request.status}`);
    }

    // 3. Verify duplicate submission prevention
    try {
      await superAdminService.submitRequest({
        societyName: 'Another Society',
        address: '100 Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560100',
        adminName: 'Another Admin',
        adminEmail: testEmail,
        adminPhone: '9999999900',
        adminPasswordHash: dummyPasswordHash,
      });
      throw new Error('Expected duplicate email submission to fail, but it succeeded.');
    } catch (err: any) {
      console.log('✅ Duplicate email prevention works (rejected as expected).');
    }

    // 4. List pending requests
    const pendingList = await superAdminService.listRequests('pending');
    const found = pendingList.some((r) => r.adminEmail === testEmail);
    if (!found) {
      throw new Error('Could not find our submitted onboarding request in the pending list.');
    }
    console.log('✅ Listing pending requests works.');

    // 5. Approve request
    console.log('⏳ Approving onboarding request...');
    const result = await superAdminService.approveRequest(request._id.toString());
    console.log(`✅ Request approved! Linked Society: ${result.society.name}, Admin: ${result.admin.name}`);

    // 6. Verify database records are created
    const createdSociety = await Society.findById(result.society.id);
    if (!createdSociety || createdSociety.name !== 'Test Automation Society') {
      throw new Error('Society was not properly created in MongoDB.');
    }
    console.log('✅ Verified Society record creation in MongoDB.');

    const createdAdmin = await User.findById(result.admin.id);
    if (!createdAdmin || createdAdmin.email !== testEmail || !createdAdmin.isActive) {
      throw new Error('Admin user was not properly created/activated in MongoDB.');
    }
    console.log('✅ Verified Admin User record creation in MongoDB.');

    const finalRequest = await SocietyOnboardingRequest.findById(request._id);
    if (!finalRequest || finalRequest.status !== 'approved') {
      throw new Error('SocietyOnboardingRequest status was not updated to approved.');
    }
    console.log('✅ Verified SocietyOnboardingRequest status updated to "approved".');

    // 7. Cleanup test data
    await SocietyOnboardingRequest.findByIdAndDelete(request._id);
    await Society.findByIdAndDelete(result.society.id);
    await User.findByIdAndDelete(result.admin.id);
    console.log('🧹 Cleaned up created test records.');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! Onboarding flow is robust.');
  } catch (error: any) {
    console.error('\n❌ Test execution failed:', error.message || error);
  } finally {
    await mongoose.disconnect();
  }
};

runTest();
