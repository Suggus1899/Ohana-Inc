import User from './User';
import Property from './Property';
import Service from './Service';
import PropertyService from './PropertyService';
import Favorite from './Favorite';
import RentalRequest from './RentalRequest';
import Report from './Report';
import Ticket from './Ticket';
import TicketResponse from './TicketResponse';
import UserAction from './UserAction';
import AuditLog from './AuditLog';
import UserBehavior from './UserBehavior';
import SearchHistory from './SearchHistory';
import PropertyView from './PropertyView';
import Message from './Message';
import Task from './Task';
import KYCVerification from './KYCVerification';
import KYCDocument from './KYCDocument';
import KYCAttempt from './KYCAttempt';
import Transaction from './Transaction';
import TransactionTimeline from './TransactionTimeline';
import Dispute from './Dispute';
import PropertyAssignment from './PropertyAssignment';
import ChatConversation from './ChatConversation';
import ChatMessage from './ChatMessage';
import ChatUserBlock from './ChatUserBlock';
import ChatMessageDeletion from './ChatMessageDeletion';
import UserSession from './UserSession';
import UserBehaviorEvent from './UserBehaviorEvent';
import Settings from './Settings';
import Announcement from './Announcement';
import PropertyReview from './PropertyReview';
import UserReview from './UserReview';
import PropertyVisit from './PropertyVisit';
import EmailVerificationCode from './EmailVerificationCode';
import Notification from './Notification';
import InboundEmail from './InboundEmail';
import Auditoria from './Auditoria';

// --- Properties & Users ---
User.hasMany(Property, { foreignKey: 'authorId', as: 'properties' });
Property.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

User.hasMany(Property, { foreignKey: 'moderatorId', as: 'moderatedProperties' });
Property.belongsTo(User, { foreignKey: 'moderatorId', as: 'moderator' });

// --- Services (Many-to-Many via PropertyService) ---
Property.belongsToMany(Service, { 
  through: PropertyService,
  foreignKey: 'propertyId',
  otherKey: 'serviceId',
  as: 'services'
});
Service.belongsToMany(Property, { 
  through: PropertyService,
  foreignKey: 'serviceId',
  otherKey: 'propertyId',
  as: 'properties'
});

// --- Favorites ---
User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Property.hasMany(Favorite, { foreignKey: 'propertyId', as: 'favoritedBy' });
Favorite.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

// --- Rental Requests ---
User.hasMany(RentalRequest, { foreignKey: 'tenantId', as: 'rentalRequests' });
RentalRequest.belongsTo(User, { foreignKey: 'tenantId', as: 'tenant' });

User.hasMany(RentalRequest, { foreignKey: 'ownerId', as: 'propertyRequests' });
RentalRequest.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

Property.hasMany(RentalRequest, { foreignKey: 'propertyId', as: 'requests' });
RentalRequest.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

// --- Support / Tickets ---
User.hasMany(Ticket, { foreignKey: 'userId', as: 'tickets' });
Ticket.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Ticket, { foreignKey: 'assignedTo', as: 'assignedTickets' });
Ticket.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedToOperator' });

Ticket.hasMany(TicketResponse, { foreignKey: 'ticketId', as: 'responses' });
TicketResponse.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });

User.hasMany(TicketResponse, { foreignKey: 'userId', as: 'ticketResponses' });
TicketResponse.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- Moderation / Reports ---
User.hasMany(Report, { foreignKey: 'reportedBy', as: 'reportsSent' });
Report.belongsTo(User, { foreignKey: 'reportedBy', as: 'reporter' });

User.hasMany(Report, { foreignKey: 'assignedTo', as: 'moderatedReports' });
Report.belongsTo(User, { foreignKey: 'assignedTo', as: 'moderator' });

// --- Moderation / Actions ---
User.hasMany(UserAction, { foreignKey: 'targetUserId', as: 'actionsReceived' });
UserAction.belongsTo(User, { foreignKey: 'targetUserId', as: 'targetUser' });

User.hasMany(UserAction, { foreignKey: 'performedBy', as: 'actionsPerformed' });
UserAction.belongsTo(User, { foreignKey: 'performedBy', as: 'operator' });

// --- Analytics & Tracking ---
User.hasMany(UserBehavior, { foreignKey: 'userId', as: 'behaviors' });
UserBehavior.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(SearchHistory, { foreignKey: 'userId', as: 'searchHistory' });
SearchHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(PropertyView, { foreignKey: 'userId', as: 'propertyViews' });
PropertyView.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Property.hasMany(PropertyView, { foreignKey: 'propertyId', as: 'viewsData' });
PropertyView.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

Property.hasMany(PropertyVisit, { foreignKey: 'propertyId', as: 'visits' });
PropertyVisit.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
User.hasMany(PropertyVisit, { foreignKey: 'userId', as: 'propertyVisits' });
PropertyVisit.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- Messages ---
User.hasMany(Message, { foreignKey: 'senderId', as: 'messagesSent' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

User.hasMany(Message, { foreignKey: 'receiverId', as: 'messagesReceived' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

Property.hasMany(Message, { foreignKey: 'propertyId', as: 'propertyMessages' });
Message.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

// --- Audit ---
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- Tasks ---
User.hasMany(Task, { foreignKey: 'assignedToId', as: 'tasks' });
Task.belongsTo(User, { foreignKey: 'assignedToId', as: 'assignedTo' });
Task.belongsTo(User, { foreignKey: 'assignedById', as: 'assignedBy' });

// KYC associations
User.hasOne(KYCVerification, { foreignKey: 'userId', as: 'kycVerification' });
KYCVerification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(KYCVerification, { foreignKey: 'reviewedBy', as: 'reviewedVerifications' });
KYCVerification.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

KYCVerification.hasMany(KYCDocument, { foreignKey: 'verificationId', as: 'documents' });
KYCDocument.belongsTo(KYCVerification, { foreignKey: 'verificationId', as: 'verification' });

KYCVerification.hasMany(KYCAttempt, { foreignKey: 'verificationId', as: 'attemptRecords' });
KYCAttempt.belongsTo(KYCVerification, { foreignKey: 'verificationId', as: 'verification' });

// Transaction ↔ RentalRequest
Transaction.belongsTo(RentalRequest, { foreignKey: 'rentalRequestId', as: 'rentalRequest' });
RentalRequest.hasOne(Transaction, { foreignKey: 'rentalRequestId', as: 'transaction' });

// Transaction associations
Transaction.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
Property.hasMany(Transaction, { foreignKey: 'propertyId', as: 'transactions' });

Transaction.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
User.hasMany(Transaction, { foreignKey: 'ownerId', as: 'ownedTransactions' });

Transaction.belongsTo(User, { foreignKey: 'clientId', as: 'client' });
User.hasMany(Transaction, { foreignKey: 'clientId', as: 'clientTransactions' });

// TransactionTimeline associations
Transaction.hasMany(TransactionTimeline, { foreignKey: 'transactionId', as: 'timeline' });
TransactionTimeline.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });

TransactionTimeline.belongsTo(User, { foreignKey: 'actorId', as: 'actorUser' });

// Dispute associations
Dispute.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });
Transaction.hasMany(Dispute, { foreignKey: 'transactionId', as: 'disputes' });

Dispute.belongsTo(User, { foreignKey: 'reportedBy', as: 'reporter' });
Dispute.belongsTo(User, { foreignKey: 'reportedAgainst', as: 'reported' });
Dispute.belongsTo(User, { foreignKey: 'resolvedBy', as: 'resolver' });

// PropertyAssignment associations
PropertyAssignment.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
Property.hasMany(PropertyAssignment, { foreignKey: 'propertyId', as: 'assignments' });

PropertyAssignment.belongsTo(User, { foreignKey: 'clientId', as: 'client' });
User.hasMany(PropertyAssignment, { foreignKey: 'clientId', as: 'propertyAssignments' });

PropertyAssignment.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });
Transaction.hasOne(PropertyAssignment, { foreignKey: 'transactionId', as: 'assignment' });
// Chat block associations
User.hasMany(ChatUserBlock, { foreignKey: 'blockerId', as: 'blocksGiven' });
User.hasMany(ChatUserBlock, { foreignKey: 'blockedId', as: 'blocksReceived' });
ChatUserBlock.belongsTo(User, { foreignKey: 'blockerId', as: 'blocker' });
ChatUserBlock.belongsTo(User, { foreignKey: 'blockedId', as: 'blocked' });

// Chat associations
RentalRequest.hasOne(ChatConversation, { foreignKey: 'rentRequestId', as: 'conversation' });
ChatConversation.belongsTo(RentalRequest, { foreignKey: 'rentRequestId', as: 'rentRequest' });

User.hasMany(ChatConversation, { foreignKey: 'participant1Id', as: 'conversationsAsTenant' });
User.hasMany(ChatConversation, { foreignKey: 'participant2Id', as: 'conversationsAsOwner' });
ChatConversation.belongsTo(User, { foreignKey: 'participant1Id', as: 'participant1' });
ChatConversation.belongsTo(User, { foreignKey: 'participant2Id', as: 'participant2' });

ChatConversation.hasMany(ChatMessage, { foreignKey: 'conversationId', as: 'messages' });
ChatMessage.belongsTo(ChatConversation, { foreignKey: 'conversationId', as: 'conversation' });

User.hasMany(ChatMessage, { foreignKey: 'senderId', as: 'chatMessages' });
ChatMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

ChatMessage.hasMany(ChatMessageDeletion, { foreignKey: 'messageId', as: 'deletions' });
ChatMessageDeletion.belongsTo(ChatMessage, { foreignKey: 'messageId', as: 'message' });
ChatMessageDeletion.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// UserSession ↔ UserBehaviorEvent (User associations are defined in User.ts)
UserSession.hasMany(UserBehaviorEvent, { foreignKey: 'sessionId', as: 'events' });
UserBehaviorEvent.belongsTo(UserSession, { foreignKey: 'sessionId', as: 'session' });

// Announcement ↔ User
User.hasMany(Announcement, { foreignKey: 'createdById', as: 'announcements' });
Announcement.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

// ======================
// REVIEWS ASSOCIATIONS
// ======================

// Property → PropertyReviews
Property.hasMany(PropertyReview, { foreignKey: 'propertyId', as: 'reviews' });
PropertyReview.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

// User → PropertyReviews (como autor)
User.hasMany(PropertyReview, { foreignKey: 'userId', as: 'propertyReviews' });
PropertyReview.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// User → UserReviews (como reviewer)
User.hasMany(UserReview, { foreignKey: 'reviewerId', as: 'reviewsGiven' });
UserReview.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

// User → UserReviews (como reviewed)
User.hasMany(UserReview, { foreignKey: 'reviewedId', as: 'reviewsReceived' });
UserReview.belongsTo(User, { foreignKey: 'reviewedId', as: 'reviewed' });

// RentalRequest → PropertyReview
RentalRequest.hasOne(PropertyReview, { foreignKey: 'rentRequestId', as: 'propertyReview' });
PropertyReview.belongsTo(RentalRequest, { foreignKey: 'rentRequestId', as: 'rentRequest' });

// Transaction → UserReview
Transaction.hasOne(UserReview, { foreignKey: 'transactionId', as: 'userReview' });
UserReview.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });

// Notification associations
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export {
  Notification,
  User,
  Property,
  Service,
  PropertyService,
  Favorite,
  RentalRequest,
  Task,
  KYCVerification,
  KYCDocument,
  KYCAttempt,
  Transaction,
  TransactionTimeline,
  Dispute,
  PropertyAssignment,
  ChatConversation,
  ChatMessage,
  ChatUserBlock,
  ChatMessageDeletion,
  Report,
  Ticket,
  TicketResponse,
  UserAction,
  AuditLog,
  UserBehavior,
  SearchHistory,
  PropertyView,
  Message,
  UserSession,
  UserBehaviorEvent,
  Announcement,
  Settings,
  PropertyReview,
  UserReview,
  PropertyVisit,
  EmailVerificationCode,
  InboundEmail,
  Auditoria
};
