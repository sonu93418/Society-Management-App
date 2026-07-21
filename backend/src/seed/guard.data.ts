// Security Guard Seed Data & Gate Operations
import { VisitorType, VisitorStatus } from '../constants';

export const guardUserData = {
  email: 'guard@portl.app',
  name: 'Suresh Kumar',
  phone: '9876543211',
  role: 'guard' as const,
  isActive: true,
};

export const sampleVisitorRequests = [
  {
    visitorName: 'Rahul Delivery',
    visitorPhone: '9900000001',
    purpose: 'Amazon Package',
    type: VisitorType.DELIVERY,
    status: VisitorStatus.PENDING,
    expectedCount: 1,
  },
  {
    visitorName: 'Sunita Aunty',
    visitorPhone: '9900000002',
    purpose: 'Family Visit',
    type: VisitorType.GUEST,
    status: VisitorStatus.APPROVED,
    approvedAt: new Date(),
    qrCode: 'demo-qr-001',
    expectedCount: 2,
  },
  {
    visitorName: 'Ola Driver',
    visitorPhone: '9900000003',
    purpose: 'Cab Pickup',
    type: VisitorType.CAB,
    status: VisitorStatus.INSIDE,
    approvedAt: new Date(),
    entryAt: new Date(),
    expectedCount: 1,
  },
];
