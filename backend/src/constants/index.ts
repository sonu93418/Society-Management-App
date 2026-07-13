export enum UserRole {
  RESIDENT = 'resident',
  GUARD = 'guard',
  ADMIN = 'admin',
}

export enum VisitorType {
  GUEST = 'guest',
  DELIVERY = 'delivery',
  CAB = 'cab',
  SERVICE = 'service',
}

export enum VisitorStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  INSIDE = 'inside',
  EXITED = 'exited',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketCategory {
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  CARPENTRY = 'carpentry',
  CLEANING = 'cleaning',
  SECURITY = 'security',
  PARKING = 'parking',
  NOISE = 'noise',
  COMMON_AREA = 'common_area',
  OTHER = 'other',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  PARTIAL = 'partial',
}

export enum NotificationType {
  VISITOR_REQUEST = 'visitor_request',
  VISITOR_APPROVED = 'visitor_approved',
  VISITOR_REJECTED = 'visitor_rejected',
  VISITOR_ENTRY = 'visitor_entry',
  VISITOR_EXIT = 'visitor_exit',
  TICKET_CREATED = 'ticket_created',
  TICKET_UPDATED = 'ticket_updated',
  TICKET_RESOLVED = 'ticket_resolved',
  NOTICE_PUBLISHED = 'notice_published',
  POLL_CREATED = 'poll_created',
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_CANCELLED = 'booking_cancelled',
  PAYMENT_REMINDER = 'payment_reminder',
  PAYMENT_RECEIVED = 'payment_received',
  EMERGENCY = 'emergency',
}

export enum StaffCategory {
  ELECTRICIAN = 'electrician',
  PLUMBER = 'plumber',
  HOUSEKEEPING = 'housekeeping',
  GARDENER = 'gardener',
  SECURITY = 'security',
  MAINTENANCE = 'maintenance',
  OTHER = 'other',
}
