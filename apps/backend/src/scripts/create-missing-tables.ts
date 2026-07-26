import { sequelize } from '../config/database';
import { 
  User, 
  Property, 
  Service, 
  PropertyService, 
  Favorite, 
  RentalRequest, 
  Task, 
  ChatConversation, 
  ChatMessage,
  Report,
  Ticket,
  TicketResponse,
  UserAction,
  AuditLog,
  UserBehavior,
  SearchHistory,
  PropertyView,
  PropertyVisit,
  Message,
  KYCVerification,
  KYCDocument,
  KYCAttempt,
  Transaction,
  TransactionTimeline,
  Dispute,
  PropertyAssignment,
  UserSession,
  UserBehaviorEvent
} from '../models';

async function createMissingTables() {
  try {
    console.log('🔄 Verificando y creando tablas faltantes...\n');
    
    // Create tables in order of dependencies
    // Core tables first
    await User.sync({ force: false });
    console.log('✅ Tabla "users" verificada/creada');
    
    await Property.sync({ force: false });
    console.log('✅ Tabla "properties" verificada/creada');
    
    await Service.sync({ force: false });
    console.log('✅ Tabla "services" verificada/creada');
    
    // Junction tables
    await PropertyService.sync({ force: false });
    console.log('✅ Tabla "property_services" verificada/creada');
    
    await Favorite.sync({ force: false });
    console.log('✅ Tabla "favorites" verificada/creada');
    
    // Request and task tables
    await RentalRequest.sync({ force: false });
    console.log('✅ Tabla "rental_requests" verificada/creada');
    
    await Task.sync({ force: false });
    console.log('✅ Tabla "tasks" verificada/creada');
    
    // Chat tables (nuevas)
    await ChatConversation.sync({ force: false });
    console.log('✅ Tabla "chat_conversations" verificada/creada');

    await ChatMessage.sync({ force: false });
    console.log('✅ Tabla "chat_messages" verificada/creada');
    
    // Support tables
    await Report.sync({ force: false });
    console.log('✅ Tabla "reports" verificada/creada');
    
    await Ticket.sync({ force: false });
    console.log('✅ Tabla "tickets" verificada/creada');
    
    await TicketResponse.sync({ force: false });
    console.log('✅ Tabla "ticket_responses" verificada/creada');
    
    await Message.sync({ force: false });
    console.log('✅ Tabla "messages" verificada/creada');
    
    // Audit and behavior tables
    await UserAction.sync({ force: false });
    console.log('✅ Tabla "user_actions" verificada/creada');
    
    await AuditLog.sync({ force: false });
    console.log('✅ Tabla "audit_logs" verificada/creada');
    
    await UserBehavior.sync({ force: false });
    console.log('✅ Tabla "user_behaviors" verificada/creada');
    
    await SearchHistory.sync({ force: false });
    console.log('✅ Tabla "search_histories" verificada/creada');
    
    await PropertyView.sync({ force: false });
    console.log('✅ Tabla "property_views" verificada/creada');

    await PropertyVisit.sync({ force: false });
    console.log('✅ Tabla "property_visits" verificada/creada');
    
    // KYC tables
    await KYCVerification.sync({ force: false });
    console.log('✅ Tabla "kyc_verifications" verificada/creada');
    
    await KYCDocument.sync({ force: false });
    console.log('✅ Tabla "kyc_documents" verificada/creada');
    
    await KYCAttempt.sync({ force: false });
    console.log('✅ Tabla "kyc_attempts" verificada/creada');
    
    // Transaction tables
    await Transaction.sync({ force: false });
    console.log('✅ Tabla "transactions" verificada/creada');
    
    await TransactionTimeline.sync({ force: false });
    console.log('✅ Tabla "transaction_timelines" verificada/creada');
    
    await Dispute.sync({ force: false });
    console.log('✅ Tabla "disputes" verificada/creada');
    
    await PropertyAssignment.sync({ force: false });
    console.log('✅ Tabla "property_assignments" verificada/creada');
    
    // Session tracking
    await UserSession.sync({ force: false });
    console.log('✅ Tabla "user_sessions" verificada/creada');
    
    await UserBehaviorEvent.sync({ force: false });
    console.log('✅ Tabla "user_behavior_events" verificada/creada');
    
    console.log('\n✨ =========================================');
    console.log('   Proceso completado exitosamente');
    console.log('=========================================');
    console.log('📋 Todas las tablas están disponibles');
    console.log('\n⚠️  Nota: Este script solo CREA tablas nuevas.');
    console.log('   Para agregar columnas faltantes, ejecuta:');
    console.log('   npm run migrate:fields');
    console.log('=========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear tablas:', error);
    process.exit(1);
  }
}

createMissingTables();
