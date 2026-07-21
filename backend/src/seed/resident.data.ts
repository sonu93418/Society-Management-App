// Resident Seed Data & Community Structures
import { StaffCategory, PaymentStatus } from '../constants';

export const residentUsersData = [
  { email: 'resident@portl.app', name: 'Priya Patel', phone: '9876543212', flatIndex: 0 },
  { email: 'sonu.23jics107@jietjodhpur.ac.in', name: 'Sonu Resident', phone: '9876543298', flatIndex: 0 },
  { email: 'ankit@portl.app', name: 'Ankit Verma', phone: '9876543213', flatIndex: 1 },
  { email: 'neha@portl.app', name: 'Neha Gupta', phone: '9876543214', flatIndex: 2 },
  { email: 'vikram@portl.app', name: 'Vikram Singh', phone: '9876543215', flatIndex: 4 },
  { email: 'meera@portl.app', name: 'Meera Nair', phone: '9876543216', flatIndex: 5 },
];

export const staffDirectoryData = [
  { name: 'Raju Electrician', phone: '9800000001', category: StaffCategory.ELECTRICIAN, workingHours: '9:00 AM - 6:00 PM', description: 'Handles all electrical repairs' },
  { name: 'Mohan Plumber', phone: '9800000002', category: StaffCategory.PLUMBER, workingHours: '9:00 AM - 5:00 PM', description: 'Plumbing & water tank maintenance' },
  { name: 'Lakshmi Housekeeping', phone: '9800000003', category: StaffCategory.HOUSEKEEPING, workingHours: '7:00 AM - 4:00 PM', description: 'Common area cleaning' },
  { name: 'Ramu Gardener', phone: '9800000004', category: StaffCategory.GARDENER, workingHours: '6:00 AM - 12:00 PM', description: 'Garden & landscape maintenance' },
];

export const generatePaymentSeedData = (residentId: any, flatId: any, societyId: any) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
  return months.map((month, idx) => ({
    resident: residentId,
    flat: flatId,
    society: societyId,
    amount: 5000,
    month,
    year: 2026,
    status: idx < 5 ? PaymentStatus.PAID : idx === 5 ? PaymentStatus.PENDING : PaymentStatus.OVERDUE,
    dueDate: new Date(2026, idx, 10),
    paidAt: idx < 5 ? new Date(2026, idx, 8) : undefined,
    description: 'Monthly Maintenance Fee',
  }));
};
