import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migración: Crear tablas del sistema P2P con Escrow
 * 
 * Tablas creadas:
 * - transactions: Transacciones P2P entre clientes y propietarios
 * - transaction_timeline: Historial de acciones por transacción
 * - disputes: Disputas relacionadas con transacciones
 * - property_assignments: Asignaciones de propiedad tras pago confirmado
 * 
 * También modifica:
 * - properties.status: Agrega valores 'sold' y 'rented' al ENUM
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  try {
    console.log('\n🚀 ========================================');
    console.log('   CREANDO TABLAS P2P ESCROW');
    console.log('========================================\n');

    // 1. Agregar 'sold' y 'rented' al ENUM de properties.status
    console.log('📝 Agregando valores sold/rented al enum de properties.status...');
    try {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_properties_status" ADD VALUE IF NOT EXISTS 'sold';
      `);
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_properties_status" ADD VALUE IF NOT EXISTS 'rented';
      `);
      console.log('✅ Valores sold/rented agregados al enum de properties.status');
    } catch (error: any) {
      console.log('⚠️  Error agregando valores al enum (puede que ya existan):', error.message);
    }

    // 2. Crear ENUMs para transactions
    console.log('📝 Creando tipos ENUM para transactions...');
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_transactions_status" AS ENUM(
          'pending_owner_approval',
          'pending_payment',
          'payment_submitted',
          'payment_confirmed',
          'completed',
          'cancelled',
          'rejected',
          'disputed',
          'refunded',
          'expired'
        );
      EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'enum_transactions_status already exists';
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_transactions_escrowStatus" AS ENUM(
          'none',
          'holding',
          'released',
          'refunded',
          'frozen'
        );
      EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'enum_transactions_escrowStatus already exists';
      END $$;
    `);
    console.log('✅ ENUMs de transactions creados');

    // 3. Crear tabla transactions
    let tableExists = false;
    try {
      await queryInterface.describeTable('transactions');
      tableExists = true;
      console.log('⚠️  La tabla transactions ya existe, saltando creación...');
    } catch (error) {
      console.log('📝 Creando tabla transactions...');
    }

    if (!tableExists) {
      await queryInterface.createTable('transactions', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        propertyId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'properties', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        ownerId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        clientId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        amount: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
        },
        currency: {
          type: DataTypes.STRING(3),
          defaultValue: 'USD',
        },
        status: {
          type: 'enum_transactions_status',
          defaultValue: 'pending_owner_approval',
        },
        escrowStatus: {
          type: 'enum_transactions_escrowStatus',
          defaultValue: 'none',
        },
        paymentMethod: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        paymentReference: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        paymentProof: {
          type: DataTypes.JSONB,
          defaultValue: [],
        },
        paymentDate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        clientConfirmedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        ownerConfirmedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        completedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        metadata: {
          type: DataTypes.JSONB,
          defaultValue: {},
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      });

      // Indexes for transactions
      await queryInterface.addIndex('transactions', ['propertyId'], { name: 'transactions_property_idx' });
      await queryInterface.addIndex('transactions', ['ownerId'], { name: 'transactions_owner_idx' });
      await queryInterface.addIndex('transactions', ['clientId'], { name: 'transactions_client_idx' });
      await queryInterface.addIndex('transactions', ['status'], { name: 'transactions_status_idx' });
      await queryInterface.addIndex('transactions', ['escrowStatus'], { name: 'transactions_escrow_status_idx' });
      await queryInterface.addIndex('transactions', ['createdAt'], { name: 'transactions_created_at_idx' });
      await queryInterface.addIndex('transactions', ['expiresAt'], { name: 'transactions_expires_at_idx' });

      console.log('✅ Tabla transactions creada con índices');
    }

    // 4. Crear tabla transaction_timeline
    tableExists = false;
    try {
      await queryInterface.describeTable('transaction_timeline');
      tableExists = true;
      console.log('⚠️  La tabla transaction_timeline ya existe, saltando creación...');
    } catch (error) {
      console.log('📝 Creando tabla transaction_timeline...');
    }

    if (!tableExists) {
      await queryInterface.createTable('transaction_timeline', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        transactionId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'transactions', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        action: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        actor: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        actorId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        previousStatus: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        newStatus: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        metadata: {
          type: DataTypes.JSONB,
          defaultValue: {},
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      });

      await queryInterface.addIndex('transaction_timeline', ['transactionId'], { name: 'timeline_transaction_idx' });
      await queryInterface.addIndex('transaction_timeline', ['createdAt'], { name: 'timeline_created_at_idx' });

      console.log('✅ Tabla transaction_timeline creada con índices');
    }

    // 5. Crear ENUMs para disputes
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_disputes_status" AS ENUM(
          'open',
          'under_review',
          'resolved',
          'closed'
        );
      EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'enum_disputes_status already exists';
      END $$;
    `);

    // 6. Crear tabla disputes
    tableExists = false;
    try {
      await queryInterface.describeTable('disputes');
      tableExists = true;
      console.log('⚠️  La tabla disputes ya existe, saltando creación...');
    } catch (error) {
      console.log('📝 Creando tabla disputes...');
    }

    if (!tableExists) {
      await queryInterface.createTable('disputes', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        transactionId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'transactions', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        reportedBy: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        reportedAgainst: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        reason: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        evidence: {
          type: DataTypes.JSONB,
          defaultValue: [],
        },
        status: {
          type: 'enum_disputes_status',
          defaultValue: 'open',
        },
        resolution: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        resolvedBy: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        resolvedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      });

      await queryInterface.addIndex('disputes', ['transactionId'], { name: 'disputes_transaction_idx' });
      await queryInterface.addIndex('disputes', ['reportedBy'], { name: 'disputes_reported_by_idx' });
      await queryInterface.addIndex('disputes', ['status'], { name: 'disputes_status_idx' });
      await queryInterface.addIndex('disputes', ['createdAt'], { name: 'disputes_created_at_idx' });

      console.log('✅ Tabla disputes creada con índices');
    }

    // 7. Crear ENUM para property_assignments
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_property_assignments_status" AS ENUM(
          'active',
          'completed',
          'cancelled'
        );
      EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'enum_property_assignments_status already exists';
      END $$;
    `);

    // 8. Crear tabla property_assignments
    tableExists = false;
    try {
      await queryInterface.describeTable('property_assignments');
      tableExists = true;
      console.log('⚠️  La tabla property_assignments ya existe, saltando creación...');
    } catch (error) {
      console.log('📝 Creando tabla property_assignments...');
    }

    if (!tableExists) {
      await queryInterface.createTable('property_assignments', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        propertyId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'properties', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        clientId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        transactionId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'transactions', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        startDate: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        endDate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        status: {
          type: 'enum_property_assignments_status',
          defaultValue: 'active',
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      });

      await queryInterface.addIndex('property_assignments', ['propertyId'], { name: 'assignments_property_idx' });
      await queryInterface.addIndex('property_assignments', ['clientId'], { name: 'assignments_client_idx' });
      await queryInterface.addIndex('property_assignments', ['transactionId'], { name: 'assignments_transaction_idx' });
      await queryInterface.addIndex('property_assignments', ['status'], { name: 'assignments_status_idx' });

      console.log('✅ Tabla property_assignments creada con índices');
    }

    console.log('\n✅ ========================================');
    console.log('   MIGRACIÓN P2P ESCROW COMPLETADA');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Error en la migración P2P Escrow:', error);
    throw error;
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  try {
    console.log('\n🔄 Revirtiendo migración P2P Escrow...');

    await queryInterface.dropTable('property_assignments');
    await queryInterface.dropTable('disputes');
    await queryInterface.dropTable('transaction_timeline');
    await queryInterface.dropTable('transactions');

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_property_assignments_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_disputes_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_transactions_escrowStatus";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_transactions_status";');

    console.log('✅ Migración P2P Escrow revertida');
  } catch (error) {
    console.error('❌ Error revirtiendo migración P2P Escrow:', error);
    throw error;
  }
}
