import { Property, User } from '../services/api';

export enum TransactionStatus {
  PENDING_OWNER_APPROVAL = 'pending_owner_approval',
  PENDING_PAYMENT = 'pending_payment',
  PAYMENT_SUBMITTED = 'payment_submitted',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  DISPUTED = 'disputed',
  REFUNDED = 'refunded',
  EXPIRED = 'expired',
}

export enum EscrowStatus {
  NONE = 'none',
  HOLDING = 'holding',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  FROZEN = 'frozen',
}

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export interface Transaction {
  id: number;
  propertyId: number;
  ownerId: number;
  clientId: number;
  amount: number;
  currency: string;
  status: TransactionStatus;
  escrowStatus: EscrowStatus;
  paymentMethod?: string;
  paymentReference?: string;
  paymentProof?: string[];
  paymentDate?: string;
  clientConfirmedAt?: string;
  ownerConfirmedAt?: string;
  expiresAt?: string;
  completedAt?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  property?: Property;
  owner?: User;
  client?: User;
  timeline?: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: number;
  transactionId: number;
  action: string;
  actor: string;
  actorId?: number;
  previousStatus?: string;
  newStatus: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Dispute {
  id: number;
  transactionId: number;
  reportedBy: number;
  reportedAgainst: number;
  reason: string;
  description: string;
  evidence: string[];
  status: DisputeStatus;
  resolution?: string;
  resolvedBy?: number;
  resolvedAt?: string;
  transaction?: Transaction;
  reporter?: User;
  reported?: User;
  resolver?: User;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  disputed: number;
}

export const STATUS_LABELS: Record<TransactionStatus, string> = {
  [TransactionStatus.PENDING_OWNER_APPROVAL]: 'Esperando Aprobación',
  [TransactionStatus.PENDING_PAYMENT]: 'Pendiente de Pago',
  [TransactionStatus.PAYMENT_SUBMITTED]: 'Pago Enviado',
  [TransactionStatus.PAYMENT_CONFIRMED]: 'Pago Confirmado',
  [TransactionStatus.COMPLETED]: 'Completada',
  [TransactionStatus.CANCELLED]: 'Cancelada',
  [TransactionStatus.REJECTED]: 'Rechazada',
  [TransactionStatus.DISPUTED]: 'En Disputa',
  [TransactionStatus.REFUNDED]: 'Reembolsada',
  [TransactionStatus.EXPIRED]: 'Expirada',
};

export const STATUS_COLORS: Record<TransactionStatus, string> = {
  [TransactionStatus.PENDING_OWNER_APPROVAL]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [TransactionStatus.PENDING_PAYMENT]: 'bg-blue-100 text-blue-800 border-blue-200',
  [TransactionStatus.PAYMENT_SUBMITTED]: 'bg-purple-100 text-purple-800 border-purple-200',
  [TransactionStatus.PAYMENT_CONFIRMED]: 'bg-green-100 text-green-800 border-green-200',
  [TransactionStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
  [TransactionStatus.CANCELLED]: 'bg-gray-100 text-gray-800 border-gray-200',
  [TransactionStatus.REJECTED]: 'bg-red-100 text-red-800 border-red-200',
  [TransactionStatus.DISPUTED]: 'bg-orange-100 text-orange-800 border-orange-200',
  [TransactionStatus.REFUNDED]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  [TransactionStatus.EXPIRED]: 'bg-gray-100 text-gray-600 border-gray-200',
};
