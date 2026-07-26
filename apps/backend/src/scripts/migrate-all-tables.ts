/**
 * migrate-all-tables.ts
 *
 * Migración completa: crea todas las tablas faltantes del backend
 * sin borrar datos existentes.
 *
 * Uso: npx ts-node src/scripts/migrate-all-tables.ts
 * Ejecutar DESPUÉS de migrate-missing-fields.ts
 */

import { sequelize } from '../config/database';
import { QueryInterface, DataTypes } from 'sequelize';

async function tableExists(qi: QueryInterface, name: string): Promise<boolean> {
  try { await qi.describeTable(name); return true; } catch { return false; }
}

async function columnExists(qi: QueryInterface, table: string, col: string): Promise<boolean> {
  try { const d = await qi.describeTable(table); return d[col] !== undefined; } catch { return false; }
}

async function indexExists(qi: QueryInterface, table: string, indexName: string): Promise<boolean> {
  const indexes = await qi.showIndex(table) as any[];
  return indexes.some((i: any) => i.name === indexName);
}

async function createEnum(name: string, values: string[]) {
  try {
    await sequelize.query(`DO $$ BEGIN CREATE TYPE "${name}" AS ENUM(${values.map(v => `'${v}'`).join(',')}); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
  } catch {}
}

async function ensureTable(qi: QueryInterface, tableName: string, definition: any, indexes: [string, string[], boolean?][]) {
  if (await tableExists(qi, tableName)) {
    console.log(`   ⏭  ${tableName} ya existe`);
    return;
  }
  console.log(`   📝 Creando tabla ${tableName}...`);
  await qi.createTable(tableName, definition);
  for (const [name, fields, unique] of indexes) {
    await qi.addIndex(tableName, fields, { name, unique: unique || false });
  }
  console.log(`   ✅ Tabla ${tableName} creada`);
}

async function run() {
  await sequelize.authenticate();
  console.log('✅ Conectado a PostgreSQL\n');
  const qi = sequelize.getQueryInterface();

  // ════════════════════════════════════════════════════════════════
  // 1. kyc_verifications
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [1] kyc_verifications ...');
  await createEnum('enum_kyc_verifications_status', [
    'not_started','in_progress','level_1_in_progress','level_1_completed',
    'level_2_in_progress','level_2_completed','level_3_in_progress','level_3_completed',
    'documents_uploaded','pending_review','under_review','approved','rejected','expired','resubmission_required',
  ]);
  await ensureTable(qi, 'kyc_verifications', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true, references: { model: 'users', key: 'id' } },
    status: { type: DataTypes.ENUM('not_started','in_progress','level_1_in_progress','level_1_completed','level_2_in_progress','level_2_completed','level_3_in_progress','level_3_completed','documents_uploaded','pending_review','under_review','approved','rejected','expired','resubmission_required'), defaultValue: 'not_started' },
    verificationLevel: { type: DataTypes.INTEGER, defaultValue: 0 },
    currentLevel: { type: DataTypes.INTEGER, defaultValue: 0 },
    level1Data: { type: DataTypes.JSONB, allowNull: true },
    level2Data: { type: DataTypes.JSONB, allowNull: true },
    level3Data: { type: DataTypes.JSONB, allowNull: true },
    level1CompletedAt: { type: DataTypes.DATE, allowNull: true },
    level2CompletedAt: { type: DataTypes.DATE, allowNull: true },
    level3CompletedAt: { type: DataTypes.DATE, allowNull: true },
    fullName: { type: DataTypes.STRING(255), allowNull: true },
    documentNumber: { type: DataTypes.STRING(50), allowNull: true },
    documentType: { type: DataTypes.STRING(50), allowNull: true },
    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
    nationality: { type: DataTypes.STRING(100), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    documentFrontUrl: { type: DataTypes.TEXT, allowNull: true },
    documentBackUrl: { type: DataTypes.TEXT, allowNull: true },
    selfieUrl: { type: DataTypes.TEXT, allowNull: true },
    selfieWithDocumentUrl: { type: DataTypes.TEXT, allowNull: true },
    livenessVideoUrl: { type: DataTypes.TEXT, allowNull: true },
    proofOfAddressUrl: { type: DataTypes.TEXT, allowNull: true },
    faceMatchScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    livenessScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    documentValidityScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    fraudScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    ocrData: { type: DataTypes.JSONB, allowNull: true },
    reviewedBy: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    reviewedAt: { type: DataTypes.DATE, allowNull: true },
    reviewNotes: { type: DataTypes.TEXT, allowNull: true },
    rejectionReason: { type: DataTypes.TEXT, allowNull: true },
    attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastAttemptAt: { type: DataTypes.DATE, allowNull: true },
    verifiedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    consentedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, [
    ['kyc_verifications_user_id_idx', ['userId'], true],
    ['kyc_verifications_status_idx', ['status']],
    ['kyc_verifications_verification_level_idx', ['verificationLevel']],
    ['kyc_verifications_document_number_idx', ['documentNumber']],
    ['kyc_verifications_created_at_idx', ['createdAt']],
    ['kyc_verifications_reviewed_by_idx', ['reviewedBy']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 2. kyc_documents
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [2] kyc_documents ...');
  await createEnum('enum_kyc_documents_documentType', ['id_front','id_back','selfie','selfie_with_doc','liveness_video','proof_of_address']);
  await ensureTable(qi, 'kyc_documents', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    verificationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'kyc_verifications', key: 'id' }, onDelete: 'CASCADE' },
    documentType: { type: DataTypes.ENUM('id_front','id_back','selfie','selfie_with_doc','liveness_video','proof_of_address'), allowNull: false },
    url: { type: DataTypes.TEXT, allowNull: false },
    encryptedUrl: { type: DataTypes.TEXT, allowNull: false },
    fileHash: { type: DataTypes.STRING(64), allowNull: false },
    metadata: { type: DataTypes.JSONB, defaultValue: {} },
    uploadedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, [
    ['kyc_documents_verification_id_idx', ['verificationId']],
    ['kyc_documents_document_type_idx', ['documentType']],
    ['kyc_documents_file_hash_idx', ['fileHash']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 3. kyc_attempts
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [3] kyc_attempts ...');
  await createEnum('enum_kyc_attempts_step', ['document_capture','selfie','liveness','ocr','face_match','document_validation','manual_review']);
  await ensureTable(qi, 'kyc_attempts', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    verificationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'kyc_verifications', key: 'id' }, onDelete: 'CASCADE' },
    attemptNumber: { type: DataTypes.INTEGER, allowNull: false },
    step: { type: DataTypes.ENUM('document_capture','selfie','liveness','ocr','face_match','document_validation','manual_review'), allowNull: false },
    success: { type: DataTypes.BOOLEAN, defaultValue: false },
    errorMessage: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSONB, defaultValue: {} },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, [
    ['kyc_attempts_verification_id_idx', ['verificationId']],
    ['kyc_attempts_step_idx', ['step']],
    ['kyc_attempts_created_at_idx', ['createdAt']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 4. transactions
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [4] transactions ...');
  await createEnum('enum_transactions_status', [
    'pending_owner_approval','pending_payment','payment_submitted','payment_confirmed',
    'completed','cancelled','rejected','disputed','refunded','expired',
  ]);
  await createEnum('enum_transactions_escrowStatus', ['none','holding','released','refunded','frozen']);
  await ensureTable(qi, 'transactions', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rentalRequestId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'rental_requests', key: 'id' } },
    propertyId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'properties', key: 'id' } },
    ownerId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    clientId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), defaultValue: 'USD' },
    status: { type: DataTypes.ENUM('pending_owner_approval','pending_payment','payment_submitted','payment_confirmed','completed','cancelled','rejected','disputed','refunded','expired'), defaultValue: 'pending_owner_approval' },
    escrowStatus: { type: DataTypes.ENUM('none','holding','released','refunded','frozen'), defaultValue: 'none' },
    paymentMethod: { type: DataTypes.STRING(50), allowNull: true },
    paymentReference: { type: DataTypes.STRING(100), allowNull: true },
    paymentProof: { type: DataTypes.JSONB, defaultValue: [] },
    paymentDate: { type: DataTypes.DATE, allowNull: true },
    clientConfirmedAt: { type: DataTypes.DATE, allowNull: true },
    ownerConfirmedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSONB, defaultValue: {} },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, [
    ['transactions_property_idx', ['propertyId']],
    ['transactions_owner_idx', ['ownerId']],
    ['transactions_client_idx', ['clientId']],
    ['transactions_status_idx', ['status']],
    ['transactions_escrow_status_idx', ['escrowStatus']],
    ['transactions_created_at_idx', ['createdAt']],
    ['transactions_expires_at_idx', ['expiresAt']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 5. transaction_timeline
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [5] transaction_timeline ...');
  await ensureTable(qi, 'transaction_timeline', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    transactionId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'transactions', key: 'id' }, onDelete: 'CASCADE' },
    action: { type: DataTypes.STRING(50), allowNull: false },
    actor: { type: DataTypes.STRING(20), allowNull: false },
    actorId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    previousStatus: { type: DataTypes.STRING(50), allowNull: true },
    newStatus: { type: DataTypes.STRING(50), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSONB, defaultValue: {} },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  }, [
    ['timeline_transaction_idx', ['transactionId']],
    ['timeline_created_at_idx', ['createdAt']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 6. disputes
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [6] disputes ...');
  await createEnum('enum_disputes_status', ['open','under_review','resolved','closed']);
  await ensureTable(qi, 'disputes', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    transactionId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'transactions', key: 'id' } },
    reportedBy: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    reportedAgainst: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    reason: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    evidence: { type: DataTypes.JSONB, defaultValue: [] },
    status: { type: DataTypes.ENUM('open','under_review','resolved','closed'), defaultValue: 'open' },
    resolution: { type: DataTypes.TEXT, allowNull: true },
    resolvedBy: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, [
    ['disputes_transaction_idx', ['transactionId']],
    ['disputes_reported_by_idx', ['reportedBy']],
    ['disputes_status_idx', ['status']],
    ['disputes_created_at_idx', ['createdAt']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 7. property_assignments
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [7] property_assignments ...');
  await createEnum('enum_property_assignments_status', ['active','completed','cancelled']);
  await ensureTable(qi, 'property_assignments', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    propertyId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'properties', key: 'id' } },
    clientId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    transactionId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'transactions', key: 'id' } },
    startDate: { type: DataTypes.DATE, allowNull: false },
    endDate: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.ENUM('active','completed','cancelled'), defaultValue: 'active' },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, [
    ['assignments_property_idx', ['propertyId']],
    ['assignments_client_idx', ['clientId']],
    ['assignments_transaction_idx', ['transactionId']],
    ['assignments_status_idx', ['status']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 8. favorites
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [8] favorites ...');
  await ensureTable(qi, 'favorites', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    propertyId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'properties', key: 'id' } },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, [
    ['favorites_user_property_unique', ['userId', 'propertyId'], true],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 9. announcements
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [9] announcements ...');
  await createEnum('enum_announcements_targetAudience', ['all','clients','operators','owners']);
  await createEnum('enum_announcements_status', ['active','draft','expired']);
  await ensureTable(qi, 'announcements', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    targetAudience: { type: DataTypes.ENUM('all','clients','operators','owners'), defaultValue: 'all' },
    status: { type: DataTypes.ENUM('active','draft','expired'), defaultValue: 'draft' },
    createdById: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, [
    ['announcements_status_idx', ['status']],
    ['announcements_creator_idx', ['createdById']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 10. reports
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [10] reports ...');
  await createEnum('enum_reports_reportedEntity', ['user','property','comment','message']);
  await createEnum('enum_reports_reason', ['spam','inappropriate','fraud','harassment','other']);
  await createEnum('enum_reports_status', ['pending','investigating','resolved','dismissed']);
  await ensureTable(qi, 'reports', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    reportedBy: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    reportedEntity: { type: DataTypes.ENUM('user','property','comment','message'), allowNull: false },
    entityId: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.ENUM('spam','inappropriate','fraud','harassment','other'), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('pending','investigating','resolved','dismissed'), defaultValue: 'pending' },
    assignedTo: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    resolution: { type: DataTypes.TEXT, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, [
    ['reports_reported_by_idx', ['reportedBy']],
    ['reports_entity_idx', ['reportedEntity', 'entityId']],
    ['reports_status_idx', ['status']],
    ['reports_priority_idx', ['assignedTo']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 11. tickets
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [11] tickets ...');
  await createEnum('enum_tickets_category', ['technical','billing','property','account','other']);
  await createEnum('enum_tickets_priority', ['low','medium','high','urgent']);
  await createEnum('enum_tickets_status', ['open','assigned','in_progress','waiting_user','resolved','closed','escalated']);
  await ensureTable(qi, 'tickets', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    category: { type: DataTypes.ENUM('technical','billing','property','account','other'), defaultValue: 'other' },
    priority: { type: DataTypes.ENUM('low','medium','high','urgent'), defaultValue: 'medium' },
    status: { type: DataTypes.ENUM('open','assigned','in_progress','waiting_user','resolved','closed','escalated'), defaultValue: 'open' },
    escalationReason: { type: DataTypes.TEXT, allowNull: true },
    subject: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: true },
    assignedTo: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    moderatorId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, [
    ['tickets_user_idx', ['userId']],
    ['tickets_assigned_idx', ['assignedTo']],
    ['tickets_status_idx', ['status']],
    ['tickets_priority_idx', ['priority']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 12. ticket_responses
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [12] ticket_responses ...');
  await ensureTable(qi, 'ticket_responses', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ticketId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tickets', key: 'id' } },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    message: { type: DataTypes.TEXT, allowNull: false },
    isInternal: { type: DataTypes.BOOLEAN, defaultValue: false },
    attachments: { type: DataTypes.JSON, defaultValue: [] },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, [
    ['ticket_responses_ticket_idx', ['ticketId']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 13. user_actions
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [13] user_actions ...');
  await createEnum('enum_user_actions_action', ['block','unblock','suspend','activate','warn']);
  await ensureTable(qi, 'user_actions', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    action: { type: DataTypes.ENUM('block','unblock','suspend','activate','warn'), allowNull: false },
    targetUserId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    performedBy: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    reason: { type: DataTypes.TEXT, allowNull: false },
    duration: { type: DataTypes.INTEGER, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, [
    ['user_actions_target_idx', ['targetUserId']],
    ['user_actions_performer_idx', ['performedBy']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 14. audit_logs
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [14] audit_logs ...');
  await ensureTable(qi, 'audit_logs', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    action: { type: DataTypes.STRING(100), allowNull: false },
    entity: { type: DataTypes.STRING(100), allowNull: false },
    entityId: { type: DataTypes.INTEGER, allowNull: false },
    changes: { type: DataTypes.JSON, allowNull: true },
    ipAddress: { type: DataTypes.STRING(45), allowNull: false },
    userAgent: { type: DataTypes.STRING(255), allowNull: false },
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, [
    ['audit_logs_user_idx', ['userId']],
    ['audit_logs_timestamp_idx', ['timestamp']],
    ['audit_logs_entity_idx', ['entity', 'entityId']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 15. search_histories
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [15] search_histories ...');
  await ensureTable(qi, 'search_histories', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    sessionId: { type: DataTypes.STRING(100), allowNull: false },
    searchQuery: { type: DataTypes.STRING(255), allowNull: true },
    filters: { type: DataTypes.JSON, defaultValue: {} },
    resultCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    clickedResults: { type: DataTypes.JSON, defaultValue: [] },
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, [
    ['search_history_session_idx', ['sessionId']],
    ['search_history_timestamp_idx', ['timestamp']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 16. property_views
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [16] property_views ...');
  await createEnum('enum_property_views_source', ['search','direct','favorite','recommendation']);
  await createEnum('enum_property_views_deviceType', ['desktop','mobile','tablet']);
  await ensureTable(qi, 'property_views', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    propertyId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'properties', key: 'id' } },
    userId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    sessionId: { type: DataTypes.STRING(100), allowNull: false },
    viewDuration: { type: DataTypes.INTEGER, defaultValue: 0 },
    source: { type: DataTypes.ENUM('search','direct','favorite','recommendation'), defaultValue: 'direct' },
    deviceType: { type: DataTypes.ENUM('desktop','mobile','tablet'), defaultValue: 'desktop' },
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, [
    ['property_view_property_idx', ['propertyId']],
    ['property_view_session_idx', ['sessionId']],
    ['property_view_timestamp_idx', ['timestamp']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 17. property_services
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [17] property_services ...');
  await ensureTable(qi, 'property_services', {
    propertyId: { type: DataTypes.INTEGER, primaryKey: true, references: { model: 'properties', key: 'id' } },
    serviceId: { type: DataTypes.INTEGER, primaryKey: true, references: { model: 'services', key: 'id' } },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, []);

  // ════════════════════════════════════════════════════════════════
  // 18. services
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [18] services ...');
  await createEnum('enum_services_category', ['basic','premium','amenity']);
  await ensureTable(qi, 'services', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    icon: { type: DataTypes.STRING(50), allowNull: false },
    category: { type: DataTypes.ENUM('basic','premium','amenity'), defaultValue: 'basic' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, []);

  // ════════════════════════════════════════════════════════════════
  // 19. settings
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [19] settings ...');
  await createEnum('enum_settings_type', ['string','number','boolean','json']);
  await ensureTable(qi, 'settings', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    value: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.ENUM('string','number','boolean','json'), defaultValue: 'string' },
    description: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, [
    ['settings_key_idx', ['key'], true],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 20. tasks
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [20] tasks ...');
  await createEnum('enum_tasks_priority', ['low','medium','high','urgent']);
  await createEnum('enum_tasks_status', ['pending','in_progress','completed','cancelled']);
  await ensureTable(qi, 'tasks', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    priority: { type: DataTypes.ENUM('low','medium','high','urgent'), defaultValue: 'medium' },
    status: { type: DataTypes.ENUM('pending','in_progress','completed','cancelled'), defaultValue: 'pending' },
    type: { type: DataTypes.STRING(50), defaultValue: 'manual' },
    relatedId: { type: DataTypes.INTEGER, allowNull: true },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    assignedToId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    assignedById: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, [
    ['tasks_assigned_to_idx', ['assignedToId']],
    ['tasks_status_idx', ['status']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 21. property_reviews
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [21] property_reviews ...');
  await ensureTable(qi, 'property_reviews', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    propertyId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'properties', key: 'id' } },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    rating: { type: DataTypes.INTEGER, allowNull: false },
    comment: { type: DataTypes.TEXT, allowNull: true },
    rentRequestId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'rental_requests', key: 'id' } },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, [
    ['property_reviews_unique_user_property', ['propertyId', 'userId'], true],
    ['property_reviews_property_idx', ['propertyId']],
    ['property_reviews_user_idx', ['userId']],
    ['property_reviews_rent_request_idx', ['rentRequestId']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 22. user_reviews
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [22] user_reviews ...');
  await ensureTable(qi, 'user_reviews', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    reviewerId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    reviewedId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    rating: { type: DataTypes.INTEGER, allowNull: false },
    comment: { type: DataTypes.TEXT, allowNull: true },
    transactionId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'transactions', key: 'id' } },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, [
    ['user_reviews_unique_reviewer_reviewed', ['reviewerId', 'reviewedId'], true],
    ['user_reviews_reviewer_idx', ['reviewerId']],
    ['user_reviews_reviewed_idx', ['reviewedId']],
    ['user_reviews_transaction_idx', ['transactionId']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 23. chat_user_blocks
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [23] chat_user_blocks ...');
  await ensureTable(qi, 'chat_user_blocks', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    blockerId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    blockedId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  }, [
    ['chat_user_blocks_unique_idx', ['blockerId', 'blockedId'], true],
    ['chat_user_blocks_blocked_idx', ['blockedId']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // 24. chat_message_deletions
  // ════════════════════════════════════════════════════════════════
  console.log('\n🔧 [24] chat_message_deletions ...');
  await ensureTable(qi, 'chat_message_deletions', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    messageId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'chat_messages', key: 'id' }, onDelete: 'CASCADE' },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  }, [
    ['chat_message_deletions_unique', ['messageId', 'userId'], true],
    ['chat_message_deletions_user_idx', ['userId']],
  ]);

  // ════════════════════════════════════════════════════════════════
  // RESUMEN
  // ════════════════════════════════════════════════════════════════
  console.log('\n🎉 ========================================');
  console.log('   MIGRACIÓN DE TABLAS COMPLETADA');
  console.log('========================================');
  console.log('   • kyc_verifications');
  console.log('   • kyc_documents, kyc_attempts');
  console.log('   • transactions, transaction_timeline');
  console.log('   • disputes, property_assignments');
  console.log('   • favorites, announcements');
  console.log('   • reports, tickets, ticket_responses');
  console.log('   • user_actions, audit_logs');
  console.log('   • search_histories, property_views');
  console.log('   • property_services, services');
  console.log('   • settings, tasks');
  console.log('   • property_reviews, user_reviews');
  console.log('   • chat_user_blocks, chat_message_deletions');
  console.log('\n✨ Sin pérdida de datos\n');

  await sequelize.close();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('\n❌ Error en migración:', err);
  try { await sequelize.close(); } catch {}
  process.exit(1);
});
