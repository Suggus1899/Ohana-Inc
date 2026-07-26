import { QueryInterface, DataTypes } from 'sequelize';

/**
 * MIGRACIONES UNIFICADAS - SISTEMA HABITAS
 *
 * Crea todas las tablas si no existen y aplica columnas/índices adicionales
 * de forma idempotente (seguro de ejecutar múltiples veces).
 */

// Helper: verifica si una tabla existe
async function tableExists(queryInterface: QueryInterface, tableName: string): Promise<boolean> {
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch {
    return false;
  }
}

// Helper: verifica si una columna existe en una tabla
async function columnExists(queryInterface: QueryInterface, tableName: string, columnName: string): Promise<boolean> {
  try {
    const desc = await queryInterface.describeTable(tableName);
    return desc[columnName] !== undefined;
  } catch {
    return false;
  }
}

// Helper: verifica si un índice existe
async function indexExists(queryInterface: QueryInterface, tableName: string, indexName: string): Promise<boolean> {
  const indexes = await queryInterface.showIndex(tableName) as any[];
  return indexes.some((idx: any) => idx.name === indexName);
}

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    console.log('\n🚀 ========================================');
    console.log('   INICIANDO MIGRACIONES UNIFICADAS');
    console.log('========================================\n');

    try {
      // ============================================================
      // TABLA 1: users
      // ============================================================
      console.log('📦 [1/14] Tabla: users');
      if (!(await tableExists(queryInterface, 'users'))) {
        console.log('📝 Creando tabla users...');
        await queryInterface.createTable('users', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          name: { type: DataTypes.STRING(100), allowNull: false },
          email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
          password: { type: DataTypes.STRING(255), allowNull: false },
          phonePrefix: { type: DataTypes.STRING(10), allowNull: false },
          phone: { type: DataTypes.STRING(20), allowNull: false },
          cedulaType: { type: DataTypes.STRING(1), allowNull: false },
          cedula: { type: DataTypes.STRING(20), allowNull: false, unique: true },
          dateOfBirth: { type: DataTypes.STRING(20), allowNull: true },
          city: { type: DataTypes.STRING(100), allowNull: true },
          role: {
            type: DataTypes.ENUM('admin', 'cliente', 'operator', 'propietario'),
            defaultValue: 'cliente',
            allowNull: false
          },
          isVerified: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
          accountStatus: {
            type: DataTypes.ENUM('pending', 'active', 'suspended', 'rejected'),
            defaultValue: 'pending',
            allowNull: false
          },
          verifiedById: { type: DataTypes.INTEGER, allowNull: true },
          verificationLevel: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
          profilePhotoUrl: { type: DataTypes.TEXT, allowNull: true },
          createdAt: { type: DataTypes.DATE, allowNull: false },
          updatedAt: { type: DataTypes.DATE, allowNull: false }
        });
      } else {
        console.log('⚠️  Tabla users ya existe, verificando columnas...');
        // Columnas que pueden faltar en instalaciones antiguas
        const cols: [string, object][] = [
          ['accountStatus', { type: DataTypes.ENUM('pending', 'active', 'suspended', 'rejected'), defaultValue: 'pending', allowNull: false }],
          ['verifiedById', { type: DataTypes.INTEGER, allowNull: true }],
          ['verificationLevel', { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false }],
          ['profilePhotoUrl', { type: DataTypes.TEXT, allowNull: true }],
          ['dateOfBirth', { type: DataTypes.STRING(20), allowNull: true }],
          ['city', { type: DataTypes.STRING(100), allowNull: true }],
        ];
        for (const [col, def] of cols) {
          if (!(await columnExists(queryInterface, 'users', col))) {
            console.log(`📝 Agregando columna users.${col}...`);
            if (col === 'accountStatus') {
              await queryInterface.sequelize.query(`
                DO $$ BEGIN
                  CREATE TYPE "enum_users_accountStatus" AS ENUM('pending','active','suspended','rejected');
                EXCEPTION WHEN duplicate_object THEN null; END $$;
              `);
            }
            await queryInterface.addColumn('users', col, def as any);
            if (col === 'accountStatus') {
              await queryInterface.sequelize.query(`
                UPDATE "users" SET "accountStatus" = CASE
                  WHEN "isVerified" = true THEN 'active'::"enum_users_accountStatus"
                  ELSE 'pending'::"enum_users_accountStatus"
                END
              `);
            }
          }
        }
      }

      // Índices de users
      const usersIndexes: [string, string[]][] = [
        ['users_email_idx', ['email']],
        ['users_cedula_idx', ['cedula']],
        ['users_role_idx', ['role']],
        ['users_is_verified_idx', ['isVerified']],
        ['users_account_status_idx', ['accountStatus']],
        ['users_status_role_idx', ['accountStatus', 'role']],
        ['users_role_verified_idx', ['role', 'isVerified']],
        ['users_verified_by_idx', ['verifiedById']],
      ];
      for (const [name, fields] of usersIndexes) {
        if (!(await indexExists(queryInterface, 'users', name))) {
          console.log(`📝 Creando índice ${name}...`);
          await queryInterface.addIndex('users', fields, { name });
        }
      }
      console.log('✅ Tabla users lista\n');

      // ============================================================
      // TABLA 2: user_sessions
      // ============================================================
      console.log('📦 [2/14] Tabla: user_sessions');
      if (!(await tableExists(queryInterface, 'user_sessions'))) {
        console.log('📝 Creando tabla user_sessions...');
        await queryInterface.createTable('user_sessions', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
          startedAt: { type: DataTypes.DATE, allowNull: false },
          endedAt: { type: DataTypes.DATE, allowNull: true },
          durationSeconds: { type: DataTypes.INTEGER, allowNull: true },
          osDevice: { type: DataTypes.STRING, allowNull: true },
          createdAt: { type: DataTypes.DATE, allowNull: false },
          updatedAt: { type: DataTypes.DATE, allowNull: false }
        });
      } else {
        console.log('⚠️  Tabla user_sessions ya existe');
      }
      console.log('✅ Tabla user_sessions lista\n');

      // ============================================================
      // TABLA 3: user_behavior_events
      // ============================================================
      console.log('📦 [3/14] Tabla: user_behavior_events');
      if (!(await tableExists(queryInterface, 'user_behavior_events'))) {
        console.log('📝 Creando tabla user_behavior_events...');
        await queryInterface.createTable('user_behavior_events', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          sessionId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'user_sessions', key: 'id' } },
          userId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
          eventType: { type: DataTypes.ENUM('CLICK', 'SEARCH', 'VIEW', 'SCROLL_LIMIT'), allowNull: false },
          targetElement: { type: DataTypes.STRING, allowNull: true },
          metadata: { type: DataTypes.JSONB, allowNull: true },
          createdAt: { type: DataTypes.DATE, allowNull: false }
        });
      } else {
        console.log('⚠️  Tabla user_behavior_events ya existe');
      }
      console.log('✅ Tabla user_behavior_events lista\n');

      // ============================================================
      // TABLA 4: properties
      // ============================================================
      console.log('📦 [4/14] Tabla: properties');
      if (!(await tableExists(queryInterface, 'properties'))) {
        console.log('📝 Creando tabla properties...');
        await queryInterface.createTable('properties', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          title: { type: DataTypes.STRING(255), allowNull: false },
          description: { type: DataTypes.TEXT, allowNull: false },
          price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
          bedrooms: { type: DataTypes.INTEGER, defaultValue: 0 },
          bathrooms: { type: DataTypes.INTEGER, defaultValue: 0 },
          roomsWithBathroom: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: true },
          outsideBathrooms: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: true },
          area: { type: DataTypes.INTEGER, defaultValue: 0 },
          type: { type: DataTypes.ENUM('Residencia', 'Apartamento', 'Casa', 'Cuarto', 'Finca', 'Local', 'Terreno'), allowNull: false },
          listingType: { type: DataTypes.ENUM('Alquiler', 'Venta'), allowNull: false },
          furnished: { type: DataTypes.BOOLEAN, defaultValue: false },
          location: { type: DataTypes.STRING(255), allowNull: false },
          address: { type: DataTypes.STRING(255), allowNull: false },
          lat: { type: DataTypes.FLOAT, allowNull: false },
          lng: { type: DataTypes.FLOAT, allowNull: false },
          features: { type: DataTypes.JSON, defaultValue: [] },
          images: { type: DataTypes.JSON, defaultValue: [] },
          status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'rented', 'sold'), defaultValue: 'pending' },
          isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
          views: { type: DataTypes.INTEGER, defaultValue: 0 },
          authorId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
          moderatorId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
          createdAt: { type: DataTypes.DATE, allowNull: false },
          updatedAt: { type: DataTypes.DATE, allowNull: false }
        });
        const propIndexes: [string, string[]][] = [
          ['properties_author_idx', ['authorId']],
          ['properties_status_idx', ['status']],
          ['properties_price_idx', ['price']],
          ['properties_type_idx', ['type']],
          ['properties_moderator_idx', ['moderatorId']],
        ];
        for (const [name, fields] of propIndexes) {
          await queryInterface.addIndex('properties', fields, { name });
        }
      } else {
        console.log('⚠️  Tabla properties ya existe, verificando columnas...');
        const propCols: [string, object][] = [
          ['rejectionReason', { type: DataTypes.TEXT, allowNull: true }],
          ['roomsWithBathroom', { type: DataTypes.INTEGER, defaultValue: 0, allowNull: true }],
          ['outsideBathrooms', { type: DataTypes.INTEGER, defaultValue: 0, allowNull: true }],
        ];
        for (const [col, def] of propCols) {
          if (!(await columnExists(queryInterface, 'properties', col))) {
            console.log(`📝 Agregando columna properties.${col}...`);
            await queryInterface.addColumn('properties', col, def as any);
          }
        }
        // Agregar valores al ENUM status si no existen
        await queryInterface.sequelize.query(`
          ALTER TYPE enum_properties_status ADD VALUE IF NOT EXISTS 'rented';
        `);
        await queryInterface.sequelize.query(`
          ALTER TYPE enum_properties_status ADD VALUE IF NOT EXISTS 'sold';
        `);
      }
      console.log('✅ Tabla properties lista\n');

      // ============================================================
      // TABLA 5: tickets
      // ============================================================
      console.log('📦 [5/14] Tabla: tickets');
      if (!(await tableExists(queryInterface, 'tickets'))) {
        console.log('📝 Creando tabla tickets...');
        await queryInterface.createTable('tickets', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
          subject: { type: DataTypes.STRING, allowNull: false },
          message: { type: DataTypes.TEXT, allowNull: false },
          status: { type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'escalated'), defaultValue: 'open' },
          priority: { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
          moderatorId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
          moderatorReply: { type: DataTypes.TEXT, allowNull: true },
          escalationReason: { type: DataTypes.TEXT, allowNull: true },
          createdAt: { type: DataTypes.DATE, allowNull: false },
          updatedAt: { type: DataTypes.DATE, allowNull: false }
        });
      } else {
        console.log('⚠️  Tabla tickets ya existe, verificando columnas...');
        if (!(await columnExists(queryInterface, 'tickets', 'escalationReason'))) {
          console.log('📝 Agregando columna tickets.escalationReason...');
          await queryInterface.addColumn('tickets', 'escalationReason', { type: DataTypes.TEXT, allowNull: true });
        }
        // Agregar valor 'escalated' al ENUM si no existe
        await queryInterface.sequelize.query(`
          ALTER TYPE enum_tickets_status ADD VALUE IF NOT EXISTS 'escalated';
        `);
      }
      console.log('✅ Tabla tickets lista\n');

      // ============================================================
      // TABLA 6: user_reports
      // ============================================================
      console.log('📦 [6/14] Tabla: user_reports');
      if (!(await tableExists(queryInterface, 'user_reports'))) {
        console.log('📝 Creando tabla user_reports...');
        await queryInterface.createTable('user_reports', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          reporterId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
          reportedUserId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
          reason: { type: DataTypes.ENUM('scam', 'inappropriate_content', 'harassment', 'spam', 'other'), allowNull: false },
          description: { type: DataTypes.TEXT, allowNull: false },
          status: { type: DataTypes.ENUM('pending', 'dismissed', 'resolved'), defaultValue: 'pending' },
          moderatorId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
          createdAt: { type: DataTypes.DATE, allowNull: false },
          updatedAt: { type: DataTypes.DATE, allowNull: false }
        });
      } else {
        console.log('⚠️  Tabla user_reports ya existe');
      }
      console.log('✅ Tabla user_reports lista\n');

      // ============================================================
      // TABLA 7: favorites
      // ============================================================
      console.log('📦 [7/14] Tabla: favorites');
      if (!(await tableExists(queryInterface, 'favorites'))) {
        console.log('📝 Creando tabla favorites...');
        await queryInterface.createTable('favorites', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
          propertyId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'properties', key: 'id' } },
          createdAt: { type: DataTypes.DATE, allowNull: false },
          updatedAt: { type: DataTypes.DATE, allowNull: false }
        });
        await queryInterface.addIndex('favorites', ['userId', 'propertyId'], { unique: true, name: 'favorites_user_property_unique' });
      } else {
        console.log('⚠️  Tabla favorites ya existe');
      }
      console.log('✅ Tabla favorites lista\n');

      // ============================================================
      // TABLA 8: rental_requests
      // ============================================================
      console.log('📦 [8/14] Tabla: rental_requests');
      if (!(await tableExists(queryInterface, 'rental_requests'))) {
        console.log('📝 Creando tabla rental_requests...');
        await queryInterface.createTable('rental_requests', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          tenantId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
          propertyId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'properties', key: 'id' } },
          ownerId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
          status: { type: DataTypes.ENUM('pending', 'viewed', 'accepted', 'rejected', 'cancelled'), defaultValue: 'pending' },
          message: { type: DataTypes.TEXT, allowNull: true },
          moveInDate: { type: DataTypes.DATE, allowNull: true },
          leaseDuration: { type: DataTypes.INTEGER, allowNull: true },
          phoneNumber: { type: DataTypes.STRING(20), allowNull: true },
          respondedAt: { type: DataTypes.DATE, allowNull: true },
          createdAt: { type: DataTypes.DATE, allowNull: false },
          updatedAt: { type: DataTypes.DATE, allowNull: false }
        });
        const rrIndexes: [string, string[]][] = [
          ['rental_requests_tenant_idx', ['tenantId']],
          ['rental_requests_owner_idx', ['ownerId']],
          ['rental_requests_property_idx', ['propertyId']],
          ['rental_requests_status_idx', ['status']],
        ];
        for (const [name, fields] of rrIndexes) {
          await queryInterface.addIndex('rental_requests', fields, { name });
        }
      } else {
        console.log('⚠️  Tabla rental_requests ya existe');
      }
      console.log('✅ Tabla rental_requests lista\n');

      // ============================================================
      // TABLA 9: tasks
      // ============================================================
      console.log('📦 [9/14] Tabla: tasks');
      if (!(await tableExists(queryInterface, 'tasks'))) {
        console.log('📝 Creando tabla tasks...');
        await queryInterface.createTable('tasks', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          title: { type: DataTypes.STRING(255), allowNull: false },
          description: { type: DataTypes.TEXT, allowNull: true },
          priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium', allowNull: false },
          status: { type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'), defaultValue: 'pending', allowNull: false },
          type: { type: DataTypes.STRING(50), defaultValue: 'manual', allowNull: false },
          relatedId: { type: DataTypes.INTEGER, allowNull: true },
          dueDate: { type: DataTypes.DATE, allowNull: true },
          completedAt: { type: DataTypes.DATE, allowNull: true },
          assignedToId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
          assignedById: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
          createdAt: { type: DataTypes.DATE, allowNull: false },
          updatedAt: { type: DataTypes.DATE, allowNull: false }
        });
        await queryInterface.addIndex('tasks', ['assignedToId'], { name: 'tasks_assigned_to_idx' });
        await queryInterface.addIndex('tasks', ['status'], { name: 'tasks_status_idx' });
      } else {
        console.log('⚠️  Tabla tasks ya existe');
      }
      console.log('✅ Tabla tasks lista\n');

      // ============================================================
      // TABLA 10: transactions
      // ============================================================
      console.log('📦 [10/14] Tabla: transactions');
      if (!(await tableExists(queryInterface, 'transactions'))) {
        console.log('📝 Creando tabla transactions...');
        await queryInterface.createTable('transactions', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          propertyId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'properties', key: 'id' } },
          ownerId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
          clientId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
          amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
          currency: { type: DataTypes.STRING(3), defaultValue: 'USD' },
          status: {
            type: DataTypes.ENUM(
              'pending_owner_approval', 'pending_payment', 'payment_submitted',
              'payment_confirmed', 'completed', 'cancelled', 'rejected',
              'disputed', 'refunded', 'expired'
            ),
            defaultValue: 'pending_owner_approval'
          },
          escrowStatus: {
            type: DataTypes.ENUM('none', 'holding', 'released', 'refunded', 'frozen'),
            defaultValue: 'none'
          },
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
          updatedAt: { type: DataTypes.DATE, allowNull: false }
        });
        const txIndexes: [string, string[]][] = [
          ['transactions_property_idx', ['propertyId']],
          ['transactions_owner_idx', ['ownerId']],
          ['transactions_client_idx', ['clientId']],
          ['transactions_status_idx', ['status']],
          ['transactions_escrow_status_idx', ['escrowStatus']],
          ['transactions_created_at_idx', ['createdAt']],
          ['transactions_expires_at_idx', ['expiresAt']],
        ];
        for (const [name, fields] of txIndexes) {
          await queryInterface.addIndex('transactions', fields, { name });
        }
      } else {
        console.log('⚠️  Tabla transactions ya existe');
      }
      console.log('✅ Tabla transactions lista\n');

      // ============================================================
      // TABLA 11: transaction_timeline
      // ============================================================
      console.log('📦 [11/14] Tabla: transaction_timeline');
      if (!(await tableExists(queryInterface, 'transaction_timeline'))) {
        console.log('📝 Creando tabla transaction_timeline...');
        await queryInterface.createTable('transaction_timeline', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          transactionId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'transactions', key: 'id' }, onDelete: 'CASCADE' },
          action: { type: DataTypes.STRING(50), allowNull: false },
          actor: { type: DataTypes.STRING(20), allowNull: false },
          actorId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
          previousStatus: { type: DataTypes.STRING(50), allowNull: true },
          newStatus: { type: DataTypes.STRING(50), allowNull: false },
          description: { type: DataTypes.TEXT, allowNull: true },
          metadata: { type: DataTypes.JSONB, defaultValue: {} },
          createdAt: { type: DataTypes.DATE, allowNull: false }
        });
        await queryInterface.addIndex('transaction_timeline', ['transactionId'], { name: 'timeline_transaction_idx' });
        await queryInterface.addIndex('transaction_timeline', ['createdAt'], { name: 'timeline_created_at_idx' });
      } else {
        console.log('⚠️  Tabla transaction_timeline ya existe');
      }
      console.log('✅ Tabla transaction_timeline lista\n');

      // ============================================================
      // TABLA 12: disputes
      // ============================================================
      console.log('📦 [12/14] Tabla: disputes');
      if (!(await tableExists(queryInterface, 'disputes'))) {
        console.log('📝 Creando tabla disputes...');
        await queryInterface.createTable('disputes', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          transactionId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'transactions', key: 'id' } },
          reportedBy: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
          reportedAgainst: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
          reason: { type: DataTypes.STRING(100), allowNull: false },
          description: { type: DataTypes.TEXT, allowNull: false },
          evidence: { type: DataTypes.JSONB, defaultValue: [] },
          status: { type: DataTypes.ENUM('open', 'under_review', 'resolved', 'closed'), defaultValue: 'open' },
          resolution: { type: DataTypes.TEXT, allowNull: true },
          resolvedBy: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
          resolvedAt: { type: DataTypes.DATE, allowNull: true },
          createdAt: { type: DataTypes.DATE, allowNull: false },
          updatedAt: { type: DataTypes.DATE, allowNull: false }
        });
        const dispIndexes: [string, string[]][] = [
          ['disputes_transaction_idx', ['transactionId']],
          ['disputes_reported_by_idx', ['reportedBy']],
          ['disputes_status_idx', ['status']],
          ['disputes_created_at_idx', ['createdAt']],
        ];
        for (const [name, fields] of dispIndexes) {
          await queryInterface.addIndex('disputes', fields, { name });
        }
      } else {
        console.log('⚠️  Tabla disputes ya existe');
      }
      console.log('✅ Tabla disputes lista\n');

      // ============================================================
      // TABLA 13: property_assignments
      // ============================================================
      console.log('📦 [13/14] Tabla: property_assignments');
      if (!(await tableExists(queryInterface, 'property_assignments'))) {
        console.log('📝 Creando tabla property_assignments...');
        await queryInterface.createTable('property_assignments', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          propertyId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'properties', key: 'id' } },
          clientId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
          transactionId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'transactions', key: 'id' } },
          startDate: { type: DataTypes.DATE, allowNull: false },
          endDate: { type: DataTypes.DATE, allowNull: true },
          status: { type: DataTypes.ENUM('active', 'completed', 'cancelled'), defaultValue: 'active' },
          createdAt: { type: DataTypes.DATE, allowNull: false },
          updatedAt: { type: DataTypes.DATE, allowNull: false }
        });
        const paIndexes: [string, string[]][] = [
          ['assignments_property_idx', ['propertyId']],
          ['assignments_client_idx', ['clientId']],
          ['assignments_transaction_idx', ['transactionId']],
          ['assignments_status_idx', ['status']],
        ];
        for (const [name, fields] of paIndexes) {
          await queryInterface.addIndex('property_assignments', fields, { name });
        }
      } else {
        console.log('⚠️  Tabla property_assignments ya existe');
      }
      console.log('✅ Tabla property_assignments lista\n');

      // ============================================================
      // TABLA 14: kyc_verifications, kyc_documents, kyc_attempts
      // ============================================================
      console.log('📦 [14/14] Tablas KYC: kyc_verifications, kyc_documents, kyc_attempts');

      // --- kyc_verifications ---
      if (!(await tableExists(queryInterface, 'kyc_verifications'))) {
        console.log('📝 Creando tabla kyc_verifications...');
        await queryInterface.createTable('kyc_verifications', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          userId: { type: DataTypes.INTEGER, allowNull: false, unique: true, references: { model: 'users', key: 'id' } },
          status: {
            type: DataTypes.ENUM(
              'not_started', 'in_progress',
              'level_1_in_progress', 'level_1_completed',
              'level_2_in_progress', 'level_2_completed',
              'level_3_in_progress', 'level_3_completed',
              'documents_uploaded', 'pending_review', 'under_review',
              'approved', 'rejected', 'expired', 'resubmission_required'
            ),
            defaultValue: 'not_started',
            allowNull: false
          },
          verificationLevel: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
          currentLevel: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
          level1Data: { type: DataTypes.JSONB, allowNull: true, defaultValue: null },
          level2Data: { type: DataTypes.JSONB, allowNull: true, defaultValue: null },
          level3Data: { type: DataTypes.JSONB, allowNull: true, defaultValue: null },
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
          ocrData: { type: DataTypes.JSONB, allowNull: true, defaultValue: null },
          reviewedBy: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
          reviewedAt: { type: DataTypes.DATE, allowNull: true },
          reviewNotes: { type: DataTypes.TEXT, allowNull: true },
          rejectionReason: { type: DataTypes.TEXT, allowNull: true },
          attempts: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
          lastAttemptAt: { type: DataTypes.DATE, allowNull: true },
          verifiedAt: { type: DataTypes.DATE, allowNull: true },
          expiresAt: { type: DataTypes.DATE, allowNull: true },
          consentedAt: { type: DataTypes.DATE, allowNull: true },
          createdAt: { type: DataTypes.DATE, allowNull: false },
          updatedAt: { type: DataTypes.DATE, allowNull: false }
        });
        const kycvIndexes: [string, string[], boolean?][] = [
          ['kyc_verifications_user_id_idx', ['userId'], true],
          ['kyc_verifications_status_idx', ['status']],
          ['kyc_verifications_verification_level_idx', ['verificationLevel']],
          ['kyc_verifications_current_level_idx', ['currentLevel']],
          ['kyc_verifications_document_number_idx', ['documentNumber']],
          ['kyc_verifications_created_at_idx', ['createdAt']],
          ['kyc_verifications_reviewed_by_idx', ['reviewedBy']],
        ];
        for (const [name, fields, unique] of kycvIndexes) {
          await queryInterface.addIndex('kyc_verifications', fields, { name, unique: !!unique });
        }
      } else {
        console.log('⚠️  Tabla kyc_verifications ya existe, verificando columnas KYC...');
        const kycCols: [string, object][] = [
          ['currentLevel', { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false }],
          ['level1Data', { type: DataTypes.JSONB, allowNull: true, defaultValue: null }],
          ['level2Data', { type: DataTypes.JSONB, allowNull: true, defaultValue: null }],
          ['level3Data', { type: DataTypes.JSONB, allowNull: true, defaultValue: null }],
          ['level1CompletedAt', { type: DataTypes.DATE, allowNull: true }],
          ['level2CompletedAt', { type: DataTypes.DATE, allowNull: true }],
          ['level3CompletedAt', { type: DataTypes.DATE, allowNull: true }],
          ['consentedAt', { type: DataTypes.DATE, allowNull: true }],
        ];
        for (const [col, def] of kycCols) {
          if (!(await columnExists(queryInterface, 'kyc_verifications', col))) {
            console.log(`📝 Agregando columna kyc_verifications.${col}...`);
            await queryInterface.addColumn('kyc_verifications', col, def as any);
          }
        }
        // Agregar nuevos valores al ENUM status
        const newStatuses = [
          'level_1_in_progress', 'level_1_completed',
          'level_2_in_progress', 'level_2_completed',
          'level_3_in_progress', 'level_3_completed'
        ];
        for (const val of newStatuses) {
          await queryInterface.sequelize.query(
            `ALTER TYPE "enum_kyc_verifications_status" ADD VALUE IF NOT EXISTS '${val}';`
          );
        }
        if (!(await indexExists(queryInterface, 'kyc_verifications', 'kyc_verifications_current_level_idx'))) {
          await queryInterface.addIndex('kyc_verifications', ['currentLevel'], { name: 'kyc_verifications_current_level_idx' });
        }
      }

      // --- kyc_documents ---
      if (!(await tableExists(queryInterface, 'kyc_documents'))) {
        console.log('📝 Creando tabla kyc_documents...');
        await queryInterface.createTable('kyc_documents', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          verificationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'kyc_verifications', key: 'id' }, onDelete: 'CASCADE' },
          documentType: {
            type: DataTypes.ENUM('id_front', 'id_back', 'selfie', 'selfie_with_doc', 'liveness_video', 'proof_of_address'),
            allowNull: false
          },
          url: { type: DataTypes.TEXT, allowNull: false },
          encryptedUrl: { type: DataTypes.TEXT, allowNull: false },
          fileHash: { type: DataTypes.STRING(64), allowNull: false },
          metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
          uploadedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        });
        await queryInterface.addIndex('kyc_documents', ['verificationId'], { name: 'kyc_documents_verification_id_idx' });
        await queryInterface.addIndex('kyc_documents', ['documentType'], { name: 'kyc_documents_document_type_idx' });
        await queryInterface.addIndex('kyc_documents', ['fileHash'], { name: 'kyc_documents_file_hash_idx' });
      } else {
        console.log('⚠️  Tabla kyc_documents ya existe');
      }

      // --- kyc_attempts ---
      if (!(await tableExists(queryInterface, 'kyc_attempts'))) {
        console.log('📝 Creando tabla kyc_attempts...');
        await queryInterface.createTable('kyc_attempts', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          verificationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'kyc_verifications', key: 'id' }, onDelete: 'CASCADE' },
          attemptNumber: { type: DataTypes.INTEGER, allowNull: false },
          step: {
            type: DataTypes.ENUM('document_capture', 'selfie', 'liveness', 'ocr', 'face_match', 'document_validation', 'manual_review'),
            allowNull: false
          },
          success: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
          errorMessage: { type: DataTypes.TEXT, allowNull: true },
          metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
          createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        });
        await queryInterface.addIndex('kyc_attempts', ['verificationId'], { name: 'kyc_attempts_verification_id_idx' });
        await queryInterface.addIndex('kyc_attempts', ['step'], { name: 'kyc_attempts_step_idx' });
        await queryInterface.addIndex('kyc_attempts', ['createdAt'], { name: 'kyc_attempts_created_at_idx' });
      } else {
        console.log('⚠️  Tabla kyc_attempts ya existe');
      }

      console.log('✅ Tablas KYC listas\n');

      // ============================================================
      // TABLA 15: settings
      // ============================================================
      console.log('📦 [15/17] Tabla: settings');
      if (!(await tableExists(queryInterface, 'settings'))) {
        console.log('📝 Creando tabla settings...');
        await queryInterface.createTable('settings', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
          value: { type: DataTypes.TEXT, allowNull: false },
          type: {
            type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
            defaultValue: 'string',
            allowNull: false,
          },
          description: { type: DataTypes.TEXT, allowNull: true },
          createdAt: { type: DataTypes.DATE, allowNull: false },
          updatedAt: { type: DataTypes.DATE, allowNull: false },
        });
        if (!(await indexExists(queryInterface, 'settings', 'settings_key_idx'))) {
          await queryInterface.addIndex('settings', ['key'], { name: 'settings_key_idx', unique: true });
        }
        const defaults = [
          { key: 'site_name', value: 'Habitas', type: 'string', description: 'Nombre del sitio' },
          { key: 'commission_percentage', value: '5', type: 'number', description: 'Comisión por transacción (%)' },
          { key: 'maintenance_mode', value: 'false', type: 'boolean', description: 'Modo mantenimiento' },
          { key: 'contact_email', value: 'contacto@habitas.com', type: 'string', description: 'Email de contacto' },
          { key: 'max_properties_per_user', value: '10', type: 'number', description: 'Máximo de propiedades por usuario' },
          { key: 'currency', value: 'USD', type: 'string', description: 'Moneda por defecto' },
        ];
        for (const setting of defaults) {
          const existing = await queryInterface.rawSelect('settings', { where: { key: setting.key } }, ['id']);
          if (!existing) {
            await queryInterface.sequelize.query(
              `INSERT INTO settings (key, value, type, description, "createdAt", "updatedAt")
               VALUES (:key, :value, :type, :description, NOW(), NOW())`,
              { replacements: setting }
            );
          }
        }
        console.log('✅ Tabla settings creada con valores por defecto');
      } else {
        console.log('⚠️  Tabla settings ya existe');
      }
      console.log('✅ Tabla settings lista\n');

      // ============================================================
      // TABLAS 16-17: REVIEWS (Puntuación y Comentarios)
      // ============================================================
      console.log('📦 [16/17] Tabla: property_reviews');
      if (!(await tableExists(queryInterface, 'property_reviews'))) {
        console.log('📝 Creando tabla property_reviews...');
        await queryInterface.createTable('property_reviews', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          propertyId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'properties', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
          userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
          rating: { type: DataTypes.INTEGER, allowNull: false },
          comment: { type: DataTypes.TEXT, allowNull: true },
          rentRequestId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'rental_requests', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
          createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
          updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        });
        await queryInterface.addIndex('property_reviews', ['propertyId'], { name: 'property_reviews_property_idx' });
        await queryInterface.addIndex('property_reviews', ['userId'], { name: 'property_reviews_user_idx' });
        await queryInterface.addIndex('property_reviews', ['rentRequestId'], { name: 'property_reviews_rent_request_idx' });
        await queryInterface.addConstraint('property_reviews', { type: 'unique', name: 'property_reviews_unique_user_property', fields: ['propertyId', 'userId'] });
        await queryInterface.sequelize.query(`ALTER TABLE property_reviews ADD CONSTRAINT property_reviews_rating_check CHECK (rating >= 1 AND rating <= 5)`);
        console.log('✅ Tabla property_reviews creada con índices y constraints');
      } else {
        console.log('⚠️  Tabla property_reviews ya existe');
      }
      console.log('✅ Tabla property_reviews lista\n');

      console.log('📦 [17/17] Tabla: user_reviews');
      if (!(await tableExists(queryInterface, 'user_reviews'))) {
        console.log('📝 Creando tabla user_reviews...');
        await queryInterface.createTable('user_reviews', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          reviewerId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
          reviewedId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
          rating: { type: DataTypes.INTEGER, allowNull: false },
          comment: { type: DataTypes.TEXT, allowNull: true },
          transactionId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'transactions', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
          createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
          updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        });
        await queryInterface.addIndex('user_reviews', ['reviewerId'], { name: 'user_reviews_reviewer_idx' });
        await queryInterface.addIndex('user_reviews', ['reviewedId'], { name: 'user_reviews_reviewed_idx' });
        await queryInterface.addIndex('user_reviews', ['transactionId'], { name: 'user_reviews_transaction_idx' });
        await queryInterface.addConstraint('user_reviews', { type: 'unique', name: 'user_reviews_unique_reviewer_reviewed', fields: ['reviewerId', 'reviewedId'] });
        await queryInterface.sequelize.query(`ALTER TABLE user_reviews ADD CONSTRAINT user_reviews_rating_check CHECK (rating >= 1 AND rating <= 5)`);
        await queryInterface.sequelize.query(`ALTER TABLE user_reviews ADD CONSTRAINT user_reviews_no_self_review CHECK ("reviewerId" <> "reviewedId")`);
        console.log('✅ Tabla user_reviews creada con índices y constraints');
      } else {
        console.log('⚠️  Tabla user_reviews ya existe');
      }
      console.log('✅ Tabla user_reviews lista\n');

      // --- Agregar columnas cache a tabla properties ---
      console.log('📝 Agregando columnas cache a tabla properties...');
      if (!(await columnExists(queryInterface, 'properties', 'avg_rating'))) {
        await queryInterface.addColumn('properties', 'avg_rating', { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 });
        console.log('✅ Columna properties.avg_rating agregada');
      }
      if (!(await columnExists(queryInterface, 'properties', 'review_count'))) {
        await queryInterface.addColumn('properties', 'review_count', { type: DataTypes.INTEGER, defaultValue: 0 });
        console.log('✅ Columna properties.review_count agregada');
      }

      // --- Agregar columnas cache a tabla users ---
      console.log('📝 Agregando columnas cache a tabla users...');
      for (const [col, def] of [['avg_rating_as_owner', DataTypes.DECIMAL(3, 2)], ['review_count_as_owner', DataTypes.INTEGER], ['avg_rating_as_tenant', DataTypes.DECIMAL(3, 2)], ['review_count_as_tenant', DataTypes.INTEGER]] as const) {
        if (!(await columnExists(queryInterface, 'users', col))) {
          await queryInterface.addColumn('users', col, { type: def, defaultValue: 0 });
          console.log(`✅ Columna users.${col} agregada`);
        }
      }
      console.log('✅ Columnas cache agregadas\n');
      // ============================================================
      // RESUMEN FINAL
      // ============================================================
      console.log('🎉 ========================================');
      console.log('   TODAS LAS MIGRACIONES COMPLETADAS');
      console.log('========================================');
      console.log('\n✅ Tablas creadas/verificadas:');
      console.log('   • users, user_sessions, user_behavior_events');
      console.log('   • properties, tickets, user_reports');
      console.log('   • favorites, rental_requests, tasks');
      console.log('   • transactions, transaction_timeline, disputes');
      console.log('   • property_assignments');
      console.log('   • kyc_verifications, kyc_documents, kyc_attempts');
      console.log('   • settings');
      console.log('   • property_reviews, user_reviews (Sistema de Puntuación)');
      console.log('\n✨ Base de datos lista\n');

    } catch (error) {
      console.error('\n❌ Error ejecutando migraciones:', error);
      throw error;
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    console.log('\n⏪ Revirtiendo migraciones (drop tables en orden inverso)...\n');
    const tables = [
      'settings', 'kyc_attempts', 'kyc_documents', 'kyc_verifications',
      'property_assignments', 'disputes', 'transaction_timeline', 'transactions',
      'tasks', 'rental_requests', 'favorites', 'user_reports', 'tickets',
      'properties', 'user_behavior_events', 'user_sessions', 'users'
    ];
    
    // Eliminar constraints primero
    console.log('📝 Eliminando constraints de reviews...');
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE user_reviews 
        DROP CONSTRAINT IF EXISTS user_reviews_no_self_review
      `);
      await queryInterface.sequelize.query(`
        ALTER TABLE user_reviews 
        DROP CONSTRAINT IF EXISTS user_reviews_rating_check
      `);
      await queryInterface.sequelize.query(`
        ALTER TABLE property_reviews 
        DROP CONSTRAINT IF EXISTS property_reviews_rating_check
      `);
      console.log('✅ Constraints eliminadas');
    } catch (error: any) {
      console.log('⚠️  Error eliminando constraints:', error.message);
    }

    // Eliminar tablas en orden inverso
    for (const table of tables) {
      if (await tableExists(queryInterface, table)) {
        console.log(`📝 Eliminando tabla ${table}...`);
        await queryInterface.dropTable(table);
      }
    }

    // Eliminar tablas de reviews
    const reviewTables = ['user_reviews', 'property_reviews'];
    for (const table of reviewTables) {
      if (await tableExists(queryInterface, table)) {
        console.log(`📝 Eliminando tabla ${table}...`);
        await queryInterface.dropTable(table);
      }
    }

    console.log('\n✅ Rollback completado\n');
  }
};
