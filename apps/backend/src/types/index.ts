import type { Request } from 'express';

export type UserRole = 'admin' | 'cliente' | 'operator' | 'propietario' | 'estudiante';
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'rejected';

/**
 * Payload esperado dentro del JWT (lo que verifyToken devuelve)
 */
export interface JWTPayload {
  userId: number;
  id: number; // Alias for userId for backward compatibility
  email: string;
  role: UserRole;
  verificationLevel?: number;
  exp?: number;
  iat?: number;
}

/**
 * TokenPayload (para generar tokens) — opcionalmente usado por jwt.service
 */
export interface TokenPayload {
  userId: number;
  id?: number;
  email: string;
  role: UserRole;
  verificationLevel?: number;
}

export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DUPLICATE_EMAIL: "DUPLICATE_EMAIL",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  CREATE_ERROR: "CREATE_ERROR",
  UPDATE_ERROR: "UPDATE_ERROR",
  DELETE_ERROR: "DELETE_ERROR",
  FETCH_ERROR: "FETCH_ERROR",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
  ACCOUNT_REJECTED: "ACCOUNT_REJECTED",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  PROCESSING_ERROR: "PROCESSING_ERROR",
  FFMPEG_NOT_FOUND: "FFMPEG_NOT_FOUND",
  MODELS_NOT_FOUND: "MODELS_NOT_FOUND",
  OCR_INITIALIZATION_FAILED: "OCR_INITIALIZATION_FAILED",
  LIVENESS_FAILED: "LIVENESS_FAILED",
  POOR_QUALITY: "POOR_QUALITY",
  INSUFFICIENT_FRAMES: "INSUFFICIENT_FRAMES",
  UNDERAGE: "UNDERAGE",
  FACE_NOT_DETECTED: "FACE_NOT_DETECTED",
  FACE_MISMATCH: "FACE_MISMATCH",
  VIDEO_PROCESSING_FAILED: "VIDEO_PROCESSING_FAILED",
  OCR_EXTRACTION_FAILED: "OCR_EXTRACTION_FAILED",
  FACE_DETECTION_FAILED: "FACE_DETECTION_FAILED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode | string;
    message: string;
    details?: any;
    timestamp?: string;
  };
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phonePrefix: string;
  phone: string;
  cedulaType: string;
  cedula: string;
  dateOfBirth?: string;
  gender?: string;
  city?: string;
  isVerified: boolean;
  accountStatus: AccountStatus;
  verifiedById?: number | null;
  verificationLevel?: number;
  profilePhotoUrl?: string;
  status: "active" | "blocked" | "suspended";
  statusReason?: string | null;
  suspendedUntil?: Date | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolder?: string | null;
  bankAccountType?: string | null;
  bankPhone?: string | null;
  bankPhoneId?: string | null;
  bankPhoneName?: string | null;
  address?: string;
  preferences?: {
    emailNotifications?: boolean;
    whatsappNotifications?: boolean;
  };
  emailVerified?: boolean;
  authProvider: 'local' | 'google';
  googleId?: string;
  tutorialCompleted: boolean;
  avgRatingAsOwner?: number;
  reviewCountAsOwner?: number;
  avgRatingAsTenant?: number;
  reviewCountAsTenant?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Omit<
  UserAttributes,
  "id" | "createdAt" | "updatedAt" | "accountStatus" | "status"
> {
  accountStatus?: AccountStatus;
  status?: "active" | "blocked" | "suspended";
}

export type PropertyType =
  | "Residencia"
  | "Apartamento"
  | "Casa"
  | "Cuarto"
  | "Finca"
  | "Local"
  | "Terreno";
export type ListingType = "Alquiler" | "Venta";
export type PropertyStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "rented"
  | "sold";

export interface PropertyAttributes {
  id: number;
  authorId: number;
  title: string;
  description: string;
  type: PropertyType;
  listingType: ListingType;
  price: number;
  priceType: "monthly" | "daily";
  priceRate?: "trm";
  lat: number;
  lng: number;
  address: string;
  location: string;
  city: string;
  state: string;
  zipCode: string;
  neighborhood?: string;
  availableRooms?: number;  // Para propiedades tipo Residencia: cuartos disponibles para alquilar
  occupiedRooms?: number;   // Para propiedades tipo Residencia: cuartos ya ocupados
  bedrooms: number;
  bathrooms: number;
  roomsWithBathroom?: number; // Específico para propiedades tipo Residencia
  outsideBathrooms?: number;  // Específico para propiedades tipo Residencia
  area: number;
  floor?: number;
  totalFloors?: number;
  furnished: boolean;
  features: string[];
  status: PropertyStatus;
  isVerified: boolean;
  verifiedBy?: number | null;
  verifiedAt?: Date | null;
  images: string[];
  mainImage: string;
  isFeatured: boolean;
  views: number;
  moderatorId?: number | null;
  rejectionReason?: string | null;
  avgRating?: number;
  reviewCount?: number;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PropertyCreationAttributes extends Omit<
  PropertyAttributes,
  "id" | "createdAt" | "updatedAt"
> {}

// New Model Interfaces

export interface ServiceAttributes {
  id: number;
  name: string;
  description?: string;
  icon: string;
  category: "basic" | "premium" | "amenity";
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServiceCreationAttributes extends Omit<
  ServiceAttributes,
  "id" | "createdAt" | "updatedAt"
> {}

export interface PropertyServiceAttributes {
  propertyId: number;
  serviceId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PropertyServiceCreationAttributes extends Omit<
  PropertyServiceAttributes,
  "createdAt" | "updatedAt"
> {}

export interface FavoriteAttributes {
  id: number;
  userId: number;
  propertyId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FavoriteCreationAttributes extends Omit<
  FavoriteAttributes,
  "id" | "createdAt" | "updatedAt"
> {}

export interface RentalRequestAttributes {
  id: number;
  tenantId: number;
  propertyId: number;
  ownerId: number;
  status?:
    | "pending"
    | "viewed"
    | "accepted"
    | "rejected"
    | "cancelled"
    | "payment_submitted"
    | "completed";
  message?: string;
  phoneNumber?: string;
  moveInDate: Date;
  leaseDuration?: number | null;
  respondedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RentalRequestCreationAttributes extends Omit<
  RentalRequestAttributes,
  "id" | "createdAt" | "updatedAt"
> {}

export interface ReportAttributes {
  id: number;
  reportedBy: number;
  reportedEntity: "user" | "property" | "comment" | "message";
  entityId: number;
  reason:
    | "spam"
    | "inappropriate"
    | "fraud"
    | "harassment"
    | "other"
    | "scam"
    | "inappropriate_content";
  description: string;
  status: "pending" | "investigating" | "resolved" | "dismissed" | "viewed";
  assignedTo?: number;
  resolution?: string;
  createdAt?: Date;
  updatedAt?: Date;
  resolvedAt?: Date;
}

export interface ReportCreationAttributes extends Omit<
  ReportAttributes,
  "id" | "createdAt" | "updatedAt"
> {}

export interface TicketAttributes {
  id: number;
  userId: number;
  category?: "technical" | "billing" | "property" | "account" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status:
    | "open"
    | "assigned"
    | "in_progress"
    | "waiting_user"
    | "resolved"
    | "closed"
    | "escalated";
  escalationReason?: string;
  subject: string;
  description?: string;
  message?: string;
  assignedTo?: number;
  moderatorId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  resolvedAt?: Date;
}

export interface TicketCreationAttributes extends Omit<
  TicketAttributes,
  "id" | "createdAt" | "updatedAt"
> {}

export interface TicketResponseAttributes {
  id: number;
  ticketId: number;
  userId: number;
  message: string;
  isInternal: boolean;
  attachments?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TicketResponseCreationAttributes extends Omit<
  TicketResponseAttributes,
  "id" | "createdAt" | "updatedAt"
> {}

export interface UserActionAttributes {
  id: number;
  action: "block" | "unblock" | "suspend" | "activate" | "warn";
  targetUserId: number;
  performedBy: number;
  reason: string;
  duration?: number;
  expiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserActionCreationAttributes extends Omit<
  UserActionAttributes,
  "id" | "createdAt" | "updatedAt"
> {}

export interface AuditLogAttributes {
  id: number;
  userId: number;
  action: string;
  entity: string;
  entityId: number;
  changes?: object;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface AuditLogCreationAttributes extends Omit<
  AuditLogAttributes,
  "id"
> {}

export interface UserBehaviorAttributes {
  id: number;
  userId: number | null;
  sessionId: string;
  eventType: "search" | "view" | "favorite" | "request" | "filter" | "click" | "geocode_search" | "nearby_search" | "autocomplete" | "reverse_geocode";
  eventData: object;
  timestamp: Date;
}

export interface UserBehaviorCreationAttributes extends Omit<
  UserBehaviorAttributes,
  "id"
> {}

export interface SearchHistoryAttributes {
  id: number;
  userId: number | null;
  sessionId: string;
  searchQuery?: string;
  filters: object;
  resultCount: number;
  clickedResults: number[];
  timestamp: Date;
}

export interface SearchHistoryCreationAttributes extends Omit<
  SearchHistoryAttributes,
  "id"
> {}

export interface PropertyViewAttributes {
  id: number;
  propertyId: number;
  userId: number | null;
  sessionId: string;
  viewDuration: number;
  source: "search" | "direct" | "favorite" | "recommendation";
  deviceType: "desktop" | "mobile" | "tablet";
  timestamp: Date;
}

export interface PropertyViewCreationAttributes extends Omit<
  PropertyViewAttributes,
  "id"
> {}

export interface MessageAttributes {
  id: number;
  senderId: number;
  receiverId: number;
  propertyId?: number | null;
  content: string;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MessageCreationAttributes extends Omit<
  MessageAttributes,
  "id" | "createdAt" | "updatedAt" | "isRead"
> {
  isRead?: boolean;
}


// ======================
// Review Interfaces
// ======================

export interface PropertyReviewAttributes {
  id: number;
  propertyId: number;
  userId: number;
  rating: number; // 1-5
  comment?: string;
  rentRequestId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PropertyReviewCreationAttributes extends Omit<
  PropertyReviewAttributes, 'id' | 'createdAt' | 'updatedAt'
> {}

export interface UserReviewAttributes {
  id: number;
  reviewerId: number;
  reviewedId: number;
  rating: number; // 1-5
  comment?: string;
  transactionId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserReviewCreationAttributes extends Omit<
  UserReviewAttributes, 'id' | 'createdAt' | 'updatedAt'
> {}

export interface PropertyVisitAttributes {
  id: number;
  propertyId: number;
  userId?: number | null;
  name: string;
  email: string;
  phone: string;
  visitDate: Date;
  message?: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PropertyVisitCreationAttributes extends Omit<
  PropertyVisitAttributes, 'id' | 'createdAt' | 'updatedAt'
> {}
