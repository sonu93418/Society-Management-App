// ========== User Types ==========
export type UserRole = 'resident' | 'guard' | 'admin';

export interface User {
  id: string;
  _id?: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  society: string | Society;
  flat?: string | Flat;
  avatar?: string;
  isActive: boolean;
}

export interface Society {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  totalTowers: number;
  totalFlats: number;
  logo?: string;
}

export interface Tower {
  _id: string;
  name: string;
  society: string;
  totalFloors: number;
  totalFlats: number;
}

export interface Flat {
  _id: string;
  flatNumber: string;
  floor: number;
  tower: string | Tower;
  society: string;
  type: string;
  area?: number;
  isOccupied: boolean;
  residents: string[] | User[];
}

// ========== Visitor Types ==========
export type VisitorType = 'guest' | 'delivery' | 'cab' | 'service';
export type VisitorStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'inside' | 'exited';

export interface VisitorRequest {
  _id: string;
  visitorName: string;
  visitorPhone: string;
  visitorPhoto?: string;
  purpose: string;
  type: VisitorType;
  vehicleNumber?: string;
  flat: Flat | string;
  resident: User | string;
  guard?: User | string;
  society: string;
  status: VisitorStatus;
  qrCode?: string;
  preApproved: boolean;
  expectedCount: number;
  validFrom?: string;
  validUntil?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  entryAt?: string;
  exitAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ========== Helpdesk Types ==========
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'plumbing' | 'electrical' | 'carpentry' | 'cleaning' | 'security' | 'parking' | 'noise' | 'common_area' | 'other';

export interface HelpdeskTicket {
  _id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  images: string[];
  resident: User | string;
  flat: Flat | string;
  assignedTo?: User | string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketReply {
  _id: string;
  ticket: string;
  user: User;
  message: string;
  images: string[];
  createdAt: string;
}

// ========== Notice Types ==========
export interface Notice {
  _id: string;
  title: string;
  content: string;
  author: User | string;
  attachments: string[];
  isPinned: boolean;
  isPublished: boolean;
  readBy: string[];
  createdAt: string;
}

// ========== Poll Types ==========
export interface PollOption {
  text: string;
  votes: number;
}

export interface Poll {
  _id: string;
  title: string;
  description?: string;
  options: PollOption[];
  author: User | string;
  isAnonymous: boolean;
  isActive: boolean;
  endDate: string;
  totalVotes: number;
  hasVoted?: boolean;
  votedIndex?: number;
  createdAt: string;
}

// ========== Amenity Types ==========
export interface Amenity {
  _id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerSlot: number;
  availableFrom: string;
  availableTo: string;
  images: string[];
  rules: string[];
  isActive: boolean;
  requiresApproval: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  _id: string;
  amenity: Amenity | string;
  resident: User | string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  numberOfPeople: number;
  notes?: string;
  createdAt: string;
}

// ========== Payment Types ==========
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'partial';

export interface Payment {
  _id: string;
  resident: User | string;
  flat: Flat | string;
  amount: number;
  month: string;
  year: number;
  status: PaymentStatus;
  dueDate: string;
  paidAt?: string;
  transactionId?: string;
  description: string;
}

// ========== Notification Types ==========
export interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// ========== Staff Types ==========
export type StaffCategory = 'electrician' | 'plumber' | 'housekeeping' | 'gardener' | 'security' | 'maintenance' | 'other';

export interface Staff {
  _id: string;
  name: string;
  phone: string;
  category: StaffCategory;
  photo?: string;
  workingHours: string;
  description?: string;
}

// ========== API Types ==========
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ========== Dashboard Types ==========
export interface AdminDashboardStats {
  totalResidents: number;
  totalGuards: number;
  totalTowers: number;
  totalFlats: number;
  todayVisitors: number;
  insideVisitors: number;
  pendingApprovals: number;
  openComplaints: number;
  pendingPayments: number;
  occupancyRate: number;
}

export interface VisitorStats {
  total: number;
  pending: number;
  inside: number;
  approved: number;
}

export interface TicketStats {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  total: number;
}
