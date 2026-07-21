// Admin Seed Data & Management Structures
export const societyData = {
  name: 'Portl Residency',
  address: '123 Tech Park Road, Whitefield',
  city: 'Bangalore',
  state: 'Karnataka',
  pincode: '560066',
  totalTowers: 3,
  totalFlats: 12,
  contactEmail: 'admin@portlresidency.com',
  contactPhone: '9876543210',
};

export const towerData = [
  { name: 'Tower A - Orchid', totalFloors: 10, totalFlats: 4 },
  { name: 'Tower B - Jasmine', totalFloors: 10, totalFlats: 4 },
  { name: 'Tower C - Lily', totalFloors: 10, totalFlats: 4 },
];

export const adminUserData = {
  email: 'admin@portl.app',
  name: 'Rajesh Sharma',
  phone: '9876543210',
  role: 'admin' as const,
  isActive: true,
};

export const amenitiesData = [
  {
    name: 'Swimming Pool',
    description: 'Olympic-size heated swimming pool with separate kids pool',
    capacity: 20,
    pricePerSlot: 0,
    availableFrom: '06:00',
    availableTo: '21:00',
    rules: ['Shower before entering', 'No diving in shallow end', 'Children must be accompanied'],
  },
  {
    name: 'Clubhouse',
    description: 'Multi-purpose clubhouse with AC and sound system',
    capacity: 50,
    pricePerSlot: 500,
    availableFrom: '09:00',
    availableTo: '22:00',
    requiresApproval: true,
    rules: ['No outside catering without permission', 'Clean up after use'],
  },
  {
    name: 'Tennis Court',
    description: 'Professional tennis court with floodlights',
    capacity: 4,
    pricePerSlot: 200,
    availableFrom: '06:00',
    availableTo: '21:00',
    rules: ['Proper sports shoes required', 'Max 1 hour per slot'],
  },
  {
    name: 'Gym',
    description: 'Fully equipped fitness center with cardio and weights',
    capacity: 15,
    pricePerSlot: 0,
    availableFrom: '05:30',
    availableTo: '22:00',
    rules: ['Carry a towel', 'Wipe equipment after use'],
  },
];

export const noticesData = [
  {
    title: 'Water Supply Maintenance',
    content:
      'Water supply will be interrupted on Sunday from 10:00 AM to 2:00 PM for tank cleaning and maintenance work. Please store adequate water beforehand.',
    isPinned: true,
  },
  {
    title: 'Annual General Meeting',
    content:
      'The Annual General Meeting will be held on 25th July at 6:00 PM in the Clubhouse. All flat owners are requested to attend.',
    isPinned: false,
  },
  {
    title: 'New Parking Guidelines',
    content:
      'Please note the updated parking guidelines effective from 1st August. Each flat is entitled to one covered parking slot.',
    isPinned: false,
  },
];

export const pollsData = [
  {
    title: 'Should we install EV charging stations?',
    description: 'Proposal to install 4 EV charging stations in the parking area.',
    options: [
      { text: 'Yes, definitely needed', votes: 8 },
      { text: 'No, not necessary right now', votes: 3 },
      { text: 'Yes, but only 2 stations', votes: 5 },
    ],
    isAnonymous: false,
    totalVotes: 16,
  },
  {
    title: 'Preferred timing for yoga classes',
    description: 'We are planning to start yoga classes in the clubhouse.',
    options: [
      { text: '6:00 AM - 7:00 AM', votes: 12 },
      { text: '7:00 AM - 8:00 AM', votes: 7 },
      { text: '6:00 PM - 7:00 PM', votes: 4 },
    ],
    isAnonymous: true,
    totalVotes: 23,
  },
];
