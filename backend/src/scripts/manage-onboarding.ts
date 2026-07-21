import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { superAdminService } from '../services/superAdmin.service';

dotenv.config();

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/portl';
  await mongoose.connect(uri);
};

const showHelp = () => {
  console.log(`
🔧 Portl Society Onboarding Manager (Developer CLI)
Usage:
  npx ts-node src/scripts/manage-onboarding.ts <command> [args]

Commands:
  list                  List all onboarding requests
  approve <requestId>   Approve a request (creates society & admin account)
  reject <requestId> <reason>   Reject a request with a reason
  help                  Show this help menu
`);
};

const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    showHelp();
    process.exit(0);
  }

  try {
    await connectDB();

    if (command === 'list') {
      const requests = await superAdminService.listRequests();
      if (requests.length === 0) {
        console.log('📝 No onboarding requests found.');
      } else {
        console.log('\n--- Society Onboarding Requests ---');
        requests.forEach((req) => {
          console.log(`
ID:      ${req._id}
Society: ${req.societyName} (${req.city}, ${req.state})
Admin:   ${req.adminName} <${req.adminEmail}> (${req.adminPhone})
Status:  [${req.status.toUpperCase()}] ${req.rejectionReason ? `(Reason: ${req.rejectionReason})` : ''}
Created: ${req.createdAt.toLocaleString()}
---------------------------------`);
        });
      }
    } else if (command === 'approve') {
      const id = args[1];
      if (!id) {
        console.error('❌ Error: Please specify the Request ID to approve.');
        process.exit(1);
      }
      console.log(`⏳ Approving request ${id}...`);
      const result = await superAdminService.approveRequest(id);
      console.log(`\n✅ Approved successfully!`);
      console.log(`🏘️  Society Created: ${result.society.name} (ID: ${result.society.id})`);
      console.log(`👤 Admin User Created: ${result.admin.name} <${result.admin.email}> (ID: ${result.admin.id})`);
    } else if (command === 'reject') {
      const id = args[1];
      const reason = args.slice(2).join(' ');
      if (!id) {
        console.error('❌ Error: Please specify the Request ID to reject.');
        process.exit(1);
      }
      if (!reason) {
        console.error('❌ Error: Please specify a reason for rejection.');
        process.exit(1);
      }
      console.log(`⏳ Rejecting request ${id}...`);
      const request = await superAdminService.rejectRequest(id, reason);
      console.log(`\n❌ Request Rejected. Reason recorded: "${request.rejectionReason}"`);
    } else {
      console.error(`❌ Unknown command: ${command}`);
      showHelp();
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message || error}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

main();
