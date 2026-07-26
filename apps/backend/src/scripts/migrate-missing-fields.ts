/**
 * migrate-missing-fields.ts
 *
 * Migración incremental y segura: agrega columnas/tablas faltantes
 * sin borrar datos existentes.
 *
 * Uso: npx ts-node src/scripts/migrate-missing-fields.ts
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

async function run() {
  await sequelize.authenticate();
  console.log('✅ Conectado a PostgreSQL\n');

  const qi = sequelize.getQueryInterface();

  // ─────────────────────────────────────────────────────────────────
  // 0. users — agregar valores faltantes al ENUM de roles
  // ─────────────────────────────────────────────────────────────────
  console.log('🔧 [0] users — agregando valores faltantes al ENUM role ...');
  for (const val of ['propietario', 'estudiante']) {
    try {
      await sequelize.query(`ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS '${val}';`);
      console.log(`   ✅ Valor "${val}" agregado a enum_users_role`);
    } catch {
      try {
        await sequelize.query(`ALTER TYPE "enum_users_role" ADD VALUE '${val}';`);
        console.log(`   ✅ Valor "${val}" agregado a enum_users_role`);
      } catch {
        console.log(`   ⏭  No se pudo agregar "${val}" a enum_users_role`);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 1. users — columna "status" (active/blocked/suspended)
  // ─────────────────────────────────────────────────────────────────
  console.log('🔧 [1] users.status ...');
  if (!(await columnExists(qi, 'users', 'status'))) {
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_users_status" AS ENUM('active','blocked','suspended');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await qi.addColumn('users', 'status', {
      type: DataTypes.ENUM('active', 'blocked', 'suspended'),
      allowNull: false,
      defaultValue: 'active',
    });
    // Rellenar con valor por defecto para filas existentes
    await sequelize.query(`UPDATE "users" SET "status" = 'active' WHERE "status" IS NULL`);
    console.log('   ✅ Columna users.status agregada');
  } else {
    console.log('   ⏭  users.status ya existe');
  }

  // ─────────────────────────────────────────────────────────────────
  // 1a. users — campos de dirección y preferencias (desde merge gustavo-backend)
  // ─────────────────────────────────────────────────────────────────
  console.log('\n🔧 [1a] users — address, preferences ...');
  const userGustavoFields: [string, object][] = [
    ['address', { type: DataTypes.STRING, allowNull: true, defaultValue: null }],
    ['preferences', { type: DataTypes.JSON, allowNull: true, defaultValue: null }],
  ];
  for (const [col, def] of userGustavoFields) {
    if (!(await columnExists(qi, 'users', col))) {
      console.log(`   📝 Agregando users.${col}...`);
      await qi.addColumn('users', col, def as any);
      console.log(`   ✅ Columna users.${col} agregada`);
    } else {
      console.log(`   ⏭  users.${col} ya existe`);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 1b. users — campos de información bancaria
  // ─────────────────────────────────────────────────────────────────
  console.log('\n🔧 [1b] users — campos de información bancaria ...');
  const bankFields: [string, object][] = [
    ['bankName', { type: DataTypes.STRING, allowNull: true, defaultValue: null }],
    ['bankAccountNumber', { type: DataTypes.STRING, allowNull: true, defaultValue: null }],
    ['bankAccountHolder', { type: DataTypes.STRING, allowNull: true, defaultValue: null }],
    ['bankAccountType', { type: DataTypes.STRING, allowNull: true, defaultValue: null }],
    ['bankPhone', { type: DataTypes.STRING, allowNull: true, defaultValue: null }],
    ['bankPhoneId', { type: DataTypes.STRING, allowNull: true, defaultValue: null }],
    ['bankPhoneName', { type: DataTypes.STRING, allowNull: true, defaultValue: null }],
  ];
  for (const [col, def] of bankFields) {
    if (!(await columnExists(qi, 'users', col))) {
      console.log(`   📝 Agregando users.${col}...`);
      await qi.addColumn('users', col, def as any);
      console.log(`   ✅ Columna users.${col} agregada`);
    } else {
      console.log(`   ⏭  users.${col} ya existe`);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 1c. users — statusReason y suspendedUntil
  // ─────────────────────────────────────────────────────────────────
  console.log('\n🔧 [1c] users — statusReason, suspendedUntil ...');
  const userStatusFields: [string, object][] = [
    ['statusReason', { type: DataTypes.TEXT, allowNull: true, defaultValue: null }],
    ['suspendedUntil', { type: DataTypes.DATE, allowNull: true, defaultValue: null }],
  ];
  for (const [col, def] of userStatusFields) {
    if (!(await columnExists(qi, 'users', col))) {
      console.log(`   📝 Agregando users.${col}...`);
      await qi.addColumn('users', col, def as any);
      console.log(`   ✅ Columna users.${col} agregada`);
    } else {
      console.log(`   ⏭  users.${col} ya existe`);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 1d. users — campos de rating (avg_rating_as_owner, etc.)
  // ─────────────────────────────────────────────────────────────────
  console.log('\n🔧 [1d] users — campos de rating ...');
  const userRatingFields: [string, object][] = [
    ['avg_rating_as_owner', { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 }],
    ['review_count_as_owner', { type: DataTypes.INTEGER, defaultValue: 0 }],
    ['avg_rating_as_tenant', { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 }],
    ['review_count_as_tenant', { type: DataTypes.INTEGER, defaultValue: 0 }],
  ];
  for (const [col, def] of userRatingFields) {
    if (!(await columnExists(qi, 'users', col))) {
      console.log(`   📝 Agregando users.${col}...`);
      await qi.addColumn('users', col, def as any);
      console.log(`   ✅ Columna users.${col} agregada`);
    } else {
      console.log(`   ⏭  users.${col} ya existe`);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 1e. users — verifiedById, verificationLevel, profilePhotoUrl, dateOfBirth, city
  // ─────────────────────────────────────────────────────────────────
  console.log('\n🔧 [1e] users — verifiedById, verificationLevel, profilePhotoUrl ...');
  const userExtraFields: [string, object][] = [
    ['verifiedById', { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } }],
    ['verificationLevel', { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false }],
    ['profilePhotoUrl', { type: DataTypes.TEXT, allowNull: true }],
    ['dateOfBirth', { type: DataTypes.STRING, allowNull: true }],
    ['city', { type: DataTypes.STRING(100), allowNull: true }],
  ];
  for (const [col, def] of userExtraFields) {
    if (!(await columnExists(qi, 'users', col))) {
      console.log(`   📝 Agregando users.${col}...`);
      await qi.addColumn('users', col, def as any);
      console.log(`   ✅ Columna users.${col} agregada`);
    } else {
      console.log(`   ⏭  users.${col} ya existe`);
    }
  }
  if (!(await indexExists(qi, 'users', 'users_verified_by_idx'))) {
    await qi.addIndex('users', ['verifiedById'], { name: 'users_verified_by_idx' });
    console.log('   ✅ Índice users_verified_by_idx creado');
  }

  // ─────────────────────────────────────────────────────────────────
  // 1f. properties — campos faltantes
  // ─────────────────────────────────────────────────────────────────
  console.log('\n🔧 [1f] properties — campos faltantes ...');
  if (await tableExists(qi, 'properties')) {
    const propertyFields: [string, object][] = [
      ['city', { type: DataTypes.STRING(100), allowNull: false, defaultValue: '' }],
      ['state', { type: DataTypes.STRING(100), allowNull: false, defaultValue: '' }],
      ['zipCode', { type: DataTypes.STRING(20), allowNull: false, defaultValue: '' }],
      ['priceType', { type: DataTypes.ENUM('monthly', 'daily'), defaultValue: 'monthly' }],
      ['neighborhood', { type: DataTypes.STRING(100), allowNull: true }],
      ['floor', { type: DataTypes.INTEGER, allowNull: true }],
      ['totalFloors', { type: DataTypes.INTEGER, allowNull: true }],
      ['furnished', { type: DataTypes.BOOLEAN, defaultValue: false }],
      ['features', { type: DataTypes.JSON, defaultValue: [] }],
      ['isVerified', { type: DataTypes.BOOLEAN, defaultValue: false }],
      ['verifiedBy', { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } }],
      ['verifiedAt', { type: DataTypes.DATE, allowNull: true }],
      ['images', { type: DataTypes.JSON, defaultValue: [] }],
      ['mainImage', { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' }],
      ['isFeatured', { type: DataTypes.BOOLEAN, defaultValue: false }],
      ['views', { type: DataTypes.INTEGER, defaultValue: 0 }],
      ['moderatorId', { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } }],
      ['avg_rating', { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 }],
      ['review_count', { type: DataTypes.INTEGER, defaultValue: 0 }],
      ['videoUrl', { type: DataTypes.STRING(500), allowNull: true }],
      ['rejectionReason', { type: DataTypes.TEXT, allowNull: true }],
    ];
    for (const [col, def] of propertyFields) {
      if (!(await columnExists(qi, 'properties', col))) {
        console.log(`   📝 Agregando properties.${col}...`);
        await qi.addColumn('properties', col, def as any);
        console.log(`   ✅ Columna properties.${col} agregada`);
      } else {
        console.log(`   ⏭  properties.${col} ya existe`);
      }
    }
    // Agregar índices faltantes
    const propertyIndexes: [string, string[]][] = [
      ['properties_moderator_idx', ['moderatorId']],
      ['properties_featured_idx', ['isFeatured']],
      ['properties_location_idx', ['city', 'state', 'neighborhood']],
      ['properties_author_idx', ['authorId']],
      ['properties_status_idx', ['status']],
      ['properties_type_idx', ['type']],
    ];
    for (const [idxName, fields] of propertyIndexes) {
      if (!(await indexExists(qi, 'properties', idxName))) {
        console.log(`   📝 Creando índice ${idxName}...`);
        await qi.addIndex('properties', fields, { name: idxName });
        console.log(`   ✅ Índice ${idxName} creado`);
      }
    }
  } else {
    console.log('   ⚠️  Tabla properties no existe, saltando...');
  }

  // ─────────────────────────────────────────────────────────────────
  // 2. rent_requests / rental_requests
  //    El modelo usa tableName 'rental_requests'; la migración antigua
  //    creó 'rent_requests'. Manejamos ambos casos.
  // ─────────────────────────────────────────────────────────────────
  console.log('\n🔧 [2] Tabla rent_requests / rental_requests ...');

  const hasRentRequests   = await tableExists(qi, 'rent_requests');
  const hasRentalRequests = await tableExists(qi, 'rental_requests');

  if (!hasRentalRequests && !hasRentRequests) {
    // Crear desde cero con el esquema completo del modelo
    console.log('   📝 Creando tabla rental_requests...');
    await qi.createTable('rental_requests', {
      id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenantId:      { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      propertyId:    { type: DataTypes.INTEGER, allowNull: false, references: { model: 'properties', key: 'id' } },
      ownerId:       { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      status:        { type: DataTypes.ENUM('pending','viewed','accepted','rejected','cancelled'), defaultValue: 'pending' },
      message:       { type: DataTypes.TEXT, allowNull: true },
      phoneNumber:   { type: DataTypes.STRING(20), allowNull: true },
      moveInDate:    { type: DataTypes.DATE, allowNull: true },
      leaseDuration: { type: DataTypes.INTEGER, allowNull: true },
      respondedAt:   { type: DataTypes.DATE, allowNull: true },
      createdAt:     { type: DataTypes.DATE, allowNull: false },
      updatedAt:     { type: DataTypes.DATE, allowNull: false },
    });
    for (const [name, fields] of [
      ['rental_requests_tenant_idx',   ['tenantId']],
      ['rental_requests_owner_idx',    ['ownerId']],
      ['rental_requests_property_idx', ['propertyId']],
      ['rental_requests_status_idx',   ['status']],
    ] as [string, string[]][]) {
      await qi.addIndex('rental_requests', fields, { name });
    }
    console.log('   ✅ Tabla rental_requests creada');
  } else {
    // Trabajar sobre la tabla que exista (preferir rental_requests)
    const targetTable = hasRentalRequests ? 'rental_requests' : 'rent_requests';
    console.log(`   ⚠️  Tabla ${targetTable} ya existe, verificando columnas...`);

    // Agregar ENUM values que pueden faltar
    try {
      await sequelize.query(`ALTER TYPE "enum_${targetTable}_status" ADD VALUE IF NOT EXISTS 'viewed';`);
      await sequelize.query(`ALTER TYPE "enum_${targetTable}_status" ADD VALUE IF NOT EXISTS 'accepted';`);
      await sequelize.query(`ALTER TYPE "enum_${targetTable}_status" ADD VALUE IF NOT EXISTS 'payment_submitted';`);
      await sequelize.query(`ALTER TYPE "enum_${targetTable}_status" ADD VALUE IF NOT EXISTS 'completed';`);
    } catch {
      // El tipo puede tener nombre distinto; ignorar si falla
    }

    const missingCols: [string, object][] = [
      ['ownerId',       { type: DataTypes.INTEGER, allowNull: true }],
      ['leaseDuration', { type: DataTypes.INTEGER, allowNull: true }],
      ['respondedAt',   { type: DataTypes.DATE, allowNull: true }],
    ];
    for (const [col, def] of missingCols) {
      if (!(await columnExists(qi, targetTable, col))) {
        console.log(`   📝 Agregando ${targetTable}.${col}...`);
        await qi.addColumn(targetTable, col, def as any);
      }
    }

    // Si existe rent_requests pero NO rental_requests, crear un alias/renombrar
    if (hasRentRequests && !hasRentalRequests) {
      console.log('   📝 Renombrando rent_requests → rental_requests...');
      await sequelize.query(`ALTER TABLE "rent_requests" RENAME TO "rental_requests";`);
      console.log('   ✅ Tabla renombrada a rental_requests');
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 3. chat_conversations
  // ─────────────────────────────────────────────────────────────────
  console.log('\n🔧 [3] chat_conversations ...');
  if (!(await tableExists(qi, 'chat_conversations'))) {
    console.log('   📝 Creando tabla chat_conversations...');
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_chat_conversations_type" AS ENUM('rent_request','direct');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await qi.createTable('chat_conversations', {
      id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      rentRequestId:  { type: DataTypes.INTEGER, allowNull: true, references: { model: 'rental_requests', key: 'id' } },
      participant1Id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      participant2Id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      type:           { type: DataTypes.ENUM('rent_request', 'direct'), allowNull: false, defaultValue: 'rent_request' },
      lastMessageAt:  { type: DataTypes.DATE, allowNull: true, defaultValue: null },
      isActive:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt:      { type: DataTypes.DATE, allowNull: false },
      updatedAt:      { type: DataTypes.DATE, allowNull: false },
    });
    await qi.addIndex('chat_conversations', ['rentRequestId'], { name: 'chat_conversations_rent_request_idx', unique: true });
    await qi.addIndex('chat_conversations', ['participant1Id'], { name: 'chat_conversations_participant1_idx' });
    await qi.addIndex('chat_conversations', ['participant2Id'], { name: 'chat_conversations_participant2_idx' });
    await qi.addIndex('chat_conversations', ['lastMessageAt'], { name: 'chat_conversations_last_message_idx' });
    console.log('   ✅ Tabla chat_conversations creada');
  } else {
    console.log('   ⏭  chat_conversations ya existe, verificando columnas...');
    // Agregar columna type si no existe
    if (!(await columnExists(qi, 'chat_conversations', 'type'))) {
      await sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_chat_conversations_type" AS ENUM('rent_request','direct');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
      `);
      await qi.addColumn('chat_conversations', 'type', {
        type: DataTypes.ENUM('rent_request', 'direct'),
        allowNull: false,
        defaultValue: 'rent_request',
      });
      console.log('   ✅ Columna chat_conversations.type agregada');
    }
    // Hacer rentRequestId opcional si es requerido
    const convDesc = await qi.describeTable('chat_conversations');
    if (convDesc.rentRequestId && !convDesc.rentRequestId.allowNull) {
      await sequelize.query(`ALTER TABLE "chat_conversations" ALTER COLUMN "rentRequestId" DROP NOT NULL`);
      console.log('   ✅ chat_conversations.rentRequestId ahora es opcional');
    }

    // Agregar columnas faltantes en chat_conversations
    if (!(await columnExists(qi, 'chat_conversations', 'status'))) {
      await sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_chat_conversations_status" AS ENUM('accepted','pending','rejected');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
      `);
      await qi.addColumn('chat_conversations', 'status', {
        type: DataTypes.ENUM('accepted', 'pending', 'rejected'),
        defaultValue: 'pending',
        allowNull: false,
      });
      console.log('   ✅ Columna chat_conversations.status agregada');
    } else {
      console.log('   ⏭  chat_conversations.status ya existe');
    }
    const convCols: [string, object][] = [
      ['deletedForP1', { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false }],
      ['deletedForP2', { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false }],
      ['clearedForP1At', { type: DataTypes.DATE, allowNull: true, defaultValue: null }],
      ['clearedForP2At', { type: DataTypes.DATE, allowNull: true, defaultValue: null }],
    ];
    for (const [col, def] of convCols) {
      if (!(await columnExists(qi, 'chat_conversations', col))) {
        console.log(`   📝 Agregando chat_conversations.${col}...`);
        await qi.addColumn('chat_conversations', col, def as any);
        console.log(`   ✅ Columna chat_conversations.${col} agregada`);
      } else {
        console.log(`   ⏭  chat_conversations.${col} ya existe`);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 4. chat_messages
  // ─────────────────────────────────────────────────────────────────
  console.log('\n🔧 [4] chat_messages ...');
  if (!(await tableExists(qi, 'chat_messages'))) {
    console.log('   📝 Creando tabla chat_messages...');
    await qi.createTable('chat_messages', {
      id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      conversationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'chat_conversations', key: 'id' } },
      senderId:       { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      content:        { type: DataTypes.TEXT, allowNull: false },
      originalContent: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      isBlocked:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      blockReason:    { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      riskScore:      { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      violations:     { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      readAt:         { type: DataTypes.DATE, allowNull: true, defaultValue: null },
      createdAt:      { type: DataTypes.DATE, allowNull: false },
      updatedAt:      { type: DataTypes.DATE, allowNull: false },
    });
    await qi.addIndex('chat_messages', ['conversationId'], { name: 'chat_messages_conversation_idx' });
    await qi.addIndex('chat_messages', ['senderId'],       { name: 'chat_messages_sender_idx' });
    await qi.addIndex('chat_messages', ['conversationId', 'createdAt'], { name: 'chat_messages_conversation_created_idx' });
    await qi.addIndex('chat_messages', ['conversationId', 'readAt'],    { name: 'chat_messages_unread_idx' });
    await qi.addIndex('chat_messages', ['riskScore'], { name: 'chat_messages_risk_score_idx' });
    console.log('   ✅ Tabla chat_messages creada');
  } else {
    console.log('   ⏭  chat_messages ya existe, verificando columnas...');
    const chatMsgCols: [string, object][] = [
      ['originalContent', { type: DataTypes.TEXT, allowNull: true, defaultValue: null }],
      ['blockReason', { type: DataTypes.TEXT, allowNull: true, defaultValue: null }],
      ['riskScore', { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }],
      ['violations', { type: DataTypes.JSONB, allowNull: false, defaultValue: [] }],
    ];
    for (const [col, def] of chatMsgCols) {
      if (!(await columnExists(qi, 'chat_messages', col))) {
        console.log(`   📝 Agregando chat_messages.${col}...`);
        await qi.addColumn('chat_messages', col, def as any);
        console.log(`   ✅ Columna chat_messages.${col} agregada`);
      }
    }
    // Agregar índice para riskScore si no existe
    if (!(await indexExists(qi, 'chat_messages', 'chat_messages_risk_score_idx'))) {
      await qi.addIndex('chat_messages', ['riskScore'], { name: 'chat_messages_risk_score_idx' });
      console.log('   ✅ Índice chat_messages_risk_score_idx creado');
    }
    // Agregar columna deletedAt (soft delete)
    if (!(await columnExists(qi, 'chat_messages', 'deletedAt'))) {
      await qi.addColumn('chat_messages', 'deletedAt', {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      });
      console.log('   ✅ Columna chat_messages.deletedAt agregada');
    } else {
      console.log('   ⏭  chat_messages.deletedAt ya existe');
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 4b. messages — tabla legacy de mensajes
  // ─────────────────────────────────────────────────────────────────
  console.log('\n🔧 [4b] messages ...');
  if (!(await tableExists(qi, 'messages'))) {
    console.log('   📝 Creando tabla messages...');
    await qi.createTable('messages', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      senderId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      receiverId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      propertyId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'properties', key: 'id' } },
      content: { type: DataTypes.TEXT, allowNull: false },
      isRead: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await qi.addIndex('messages', ['senderId'], { name: 'messages_sender_idx' });
    await qi.addIndex('messages', ['receiverId'], { name: 'messages_receiver_idx' });
    await qi.addIndex('messages', ['propertyId'], { name: 'messages_property_idx' });
    console.log('   ✅ Tabla messages creada');
  } else {
    console.log('   ⏭  messages ya existe, verificando columnas...');
    const msgCols: [string, object][] = [
      ['senderId', { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } }],
      ['receiverId', { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } }],
      ['propertyId', { type: DataTypes.INTEGER, allowNull: true, references: { model: 'properties', key: 'id' } }],
      ['isRead', { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false }],
    ];
    for (const [col, def] of msgCols) {
      if (!(await columnExists(qi, 'messages', col))) {
        console.log(`   📝 Agregando messages.${col}...`);
        await qi.addColumn('messages', col, def as any);
        console.log(`   ✅ Columna messages.${col} agregada`);
      } else {
        console.log(`   ⏭  messages.${col} ya existe`);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 5. user_sessions (por si no fue creada por la migración unificada)
  // ─────────────────────────────────────────────────────────────────
  console.log('\n🔧 [5] user_sessions ...');
  if (!(await tableExists(qi, 'user_sessions'))) {
    console.log('   📝 Creando tabla user_sessions...');
    await qi.createTable('user_sessions', {
      id:              { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId:          { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      startedAt:       { type: DataTypes.DATE, allowNull: false },
      endedAt:         { type: DataTypes.DATE, allowNull: true },
      durationSeconds: { type: DataTypes.INTEGER, allowNull: true },
      osDevice:        { type: DataTypes.STRING, allowNull: true },
      createdAt:       { type: DataTypes.DATE, allowNull: false },
      updatedAt:       { type: DataTypes.DATE, allowNull: false },
    });
    await qi.addIndex('user_sessions', ['userId'], { name: 'user_sessions_user_idx' });
    console.log('   ✅ Tabla user_sessions creada');
  } else {
    console.log('   ⏭  user_sessions ya existe');
  }

  // ─────────────────────────────────────────────────────────────────
  // 6. user_behavior_events (por si no fue creada)
  // ─────────────────────────────────────────────────────────────────
  console.log('\n🔧 [6] user_behavior_events ...');
  if (!(await tableExists(qi, 'user_behavior_events'))) {
    console.log('   📝 Creando tabla user_behavior_events...');
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_user_behavior_events_eventType" AS ENUM('CLICK','SEARCH','VIEW','SCROLL_LIMIT');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await qi.createTable('user_behavior_events', {
      id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      sessionId:     { type: DataTypes.INTEGER, allowNull: true, references: { model: 'user_sessions', key: 'id' } },
      userId:        { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      eventType:     { type: DataTypes.ENUM('CLICK','SEARCH','VIEW','SCROLL_LIMIT'), allowNull: false },
      targetElement: { type: DataTypes.STRING, allowNull: true },
      metadata:      { type: DataTypes.JSONB, allowNull: true },
      createdAt:     { type: DataTypes.DATE, allowNull: false },
    });
    await qi.addIndex('user_behavior_events', ['userId'],    { name: 'user_behavior_events_user_idx' });
    await qi.addIndex('user_behavior_events', ['sessionId'], { name: 'user_behavior_events_session_idx' });
    console.log('   ✅ Tabla user_behavior_events creada');
  } else {
    console.log('   ⏭  user_behavior_events ya existe');
  }

  // ─────────────────────────────────────────────────────────────────
  // RESUMEN
  // ─────────────────────────────────────────────────────────────────
  console.log('\n🎉 ========================================');
  console.log('   MIGRACIÓN INCREMENTAL COMPLETADA');
  console.log('========================================');
  console.log('   • users.status, address, preferences');
  console.log('   • users (campos bancarios)');
  console.log('   • users.statusReason, suspendedUntil');
  console.log('   • users.avg_rating_as_owner, review_count_as_owner, etc');
  console.log('   • users.verifiedById, verificationLevel, profilePhotoUrl');
  console.log('   • properties (priceType, neighborhood, floor, etc)');
  console.log('   • properties (avg_rating, review_count, videoUrl, rejectionReason)');
  console.log('   • rental_requests (columnas + ENUM values + renombrado)');
  console.log('   • chat_conversations (type, status, deleted flags, clear dates)');
  console.log('   • chat_messages (originalContent, blockReason, riskScore, violations, deletedAt)');
  console.log('   • user_sessions, user_behavior_events, messages');
  console.log('\n✨ Sin pérdida de datos\n');

  await sequelize.close();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('\n❌ Error en migración:', err);
  try { await sequelize.close(); } catch {}
  process.exit(1);
});
