/**
 * Shared API types — extracted from api.ts for reuse across services.
 *
 * All domain API modules import from here to avoid duplicating type
 * definitions and to keep api.ts focused on HTTP calls.
 */

export type UserRole = 'admin' | 'operator' | 'propietario' | 'cliente' | 'estudiante';
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phonePrefix: string;
  phone: string;
  cedulaType: string;
  cedula: string;
  dateOfBirth?: string;
  gender?: string;
  isVerified: boolean;
  accountStatus: AccountStatus;
  verifiedById?: number;
  profilePhotoUrl?: string;
  idDocumentUrl?: string;
  proofOfAddressUrl?: string;
  address?: string;
  status: 'active' | 'blocked' | 'suspended';
  statusReason?: string | null;
  suspendedUntil?: string | null;
  avgRatingAsOwner?: number;
  reviewCountAsOwner?: number;
  avgRatingAsTenant?: number;
  reviewCountAsTenant?: number;
  tutorialCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentUser extends User {
  rentalRequests?: Array<{
    id: number;
    status: string;
    property?: {
      id: number;
      title: string;
      address?: string;
      price: number;
      images?: string[];
      type?: string;
    };
  }>;
  propertyAssignments?: Array<{
    id: number;
    property?: {
      id: number;
      title: string;
      address?: string;
      price: number;
      images?: string[];
      type?: string;
    };
  }>;
}

export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  priceType: 'monthly' | 'daily';
  priceRate?: 'trm';
  bedrooms: number;
  bathrooms: number;
  roomsWithBathroom?: number;
  outsideBathrooms?: number;
  area: number;
  type: string;
  furnished: boolean;
  listingType: string;
  location: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  neighborhood?: string;
  availableRooms?: number;
  occupiedRooms?: number;
  lat: number;
  lng: number;
  features: string[];
  images: string[];
  mainImage?: string;
  views: number;
  isFeatured: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'rented' | 'sold';
  authorId: number;
  author?: User;
  moderatorId?: number;
  rejectionReason?: string;
  videoUrl?: string;
  avgRating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyReview {
  id: number;
  propertyId: number;
  userId: number;
  author?: User;
  property?: Property;
  rating: number;
  comment?: string;
  rentRequestId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserReview {
  id: number;
  reviewerId: number;
  reviewer?: User;
  reviewedId: number;
  reviewed?: User;
  rating: number;
  comment?: string;
  transactionId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  totalPages: number;
}

export interface PropertyFilters {
  bedrooms?: number | string;
  furnished?: boolean;
  location?: string;
  features?: string | string[];
  status?: string;
}

export interface ModerationStats {
  today: {
    propertiesModerated: number;
    propertiesApproved: number;
    propertiesRejected: number;
    usersVerified: number;
    resolvedTickets: number;
    totalActions: number;
  };
  pending: {
    tasks: number;
    properties: number;
    verifications: number;
    tickets: number;
    reports: number;
    total: number;
  };
}

export interface SupportTicket {
  id: number;
  userId: number;
  user?: User;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high';
  moderatorId: number | null;
  moderator?: User;
  moderatorReply: string | null;
  escalationReason?: string | null;
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserReport {
  id: number;
  reporterId: number;
  reporter?: User;
  reportedUserId: number;
  reportedUser?: User;
  reason: 'scam' | 'inappropriate_content' | 'harassment' | 'spam' | 'other';
  description: string;
  status: 'pending' | 'dismissed' | 'resolved';
  moderatorId: number | null;
  moderator?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  icon: string;
  category: 'basic' | 'premium' | 'amenity';
  isActive: boolean;
  createdAt: string;
}

export interface Favorite {
  id: number;
  userId: number;
  propertyId: number;
  property: Property;
  createdAt: string;
}

export interface RentalRequest {
  id: number;
  tenantId: number;
  tenant?: User;
  propertyId: number;
  property: Property;
  ownerId: number;
  owner?: User;
  status: 'pending' | 'viewed' | 'accepted' | 'rejected' | 'cancelled' | 'payment_submitted' | 'completed';
  message: string;
  moveInDate: string;
  leaseDuration: number;
  respondedAt?: string;
  createdAt: string;
}

export interface AnalyticsDashboard {
  totalActions: number;
  actionsByType: { action: string; count: number }[];
  topProperties: { propertyId: number; views: number; property: Property }[];
  topSearchTerms: { query: string; count: number }[];
  hourlyActivity: { hour: number; count: number }[];
}

export interface ConversionStats {
  views: number;
  requests: number;
  conversionRate: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  targetAudience: 'all' | 'clients' | 'operators' | 'owners';
  status: 'active' | 'draft' | 'expired';
  createdById: number;
  createdBy?: { id: number; name: string; email: string };
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totals: {
    users: number;
    properties: number;
    requests: number;
    pendingTickets: number;
    operators: number;
    pendingProperties: number;
    approvedProperties: number;
    activeAnnouncements: number;
  };
  growth: {
    usersThisMonth: number;
    usersLastMonth: number;
    userGrowthPercent: number;
    propertiesThisMonth: number;
  };
  recentUsers: User[];
}

export interface AuditLog {
  id: number;
  userId: number;
  user?: User;
  action: string;
  entity: string;
  entityId: number | string;
  changes: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  propertyId?: number;
  property?: Property;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

export interface Notification {
  id: number;
  userId: number;
  type: 'transaction' | 'message' | 'kyc' | 'system' | 'property' | 'review';
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedToId: number;
  assignedTo?: User;
  assignedById: number;
  assignedBy?: User;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}
