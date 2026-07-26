import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../config/database';
import '../models'; // Load all models to register associations

import unifiedMigrations from '../migrations/unified-migrations';
import servicesMigration from '../migrations/20260430-create-services-and-behaviors';
import * as rentalRequestIdMigration from '../migrations/20260507-add-rental-request-id-to-transactions';
import residenciaColumnsMigration from '../migrations/20260519-add-residencia-columns';
import chatV2Migration from '../migrations/20260517-chat-v2';
import escalationMigration from '../migrations/20260403-add-escalation-to-tickets';
import fixPropertyStatusEnum from '../migrations/20260606-fix-property-status-enum';
import * as reviewsMigration from '../migrations/20260602-create-reviews-tables';
import availableRoomsMigration from '../migrations/20260706-add-available-occupied-rooms';
import deletedAtMigration from '../migrations/20260706-add-deletedat-to-properties';
import allowNullLeaseDuration from '../migrations/20260706-allow-null-lease-duration';
import videoUrlMigration from '../migrations/20260603-add-videourl-to-properties';
import userAddressPreferencesMigration from '../migrations/20260520-add-user-address-preferences';
import * as emailSystemMigration from '../migrations/20260708-email-system';
import * as dateOfBirthGenderMigration from '../migrations/20260710-add-dateofbirth-gender';
import * as notificationsMigration from '../migrations/20260711-create-notifications';
import * as googleAuthMigration from '../migrations/20260711-add-google-auth';
import * as tutorialCompletedMigration from '../migrations/20260712-add-tutorial-completed';
import { up as p2pEscrowUp } from '../migrations/20260406-create-p2p-escrow-tables';

import { User } from '../models';

const migrations = [
  unifiedMigrations,
  servicesMigration,
  rentalRequestIdMigration,
  residenciaColumnsMigration,
  chatV2Migration,
  escalationMigration,
  fixPropertyStatusEnum,
  reviewsMigration,
  availableRoomsMigration,
  deletedAtMigration,
  allowNullLeaseDuration,
  videoUrlMigration,
  userAddressPreferencesMigration,
  emailSystemMigration,
  dateOfBirthGenderMigration,
  notificationsMigration,
  googleAuthMigration,
  tutorialCompletedMigration,
];

const adminData = {
  name: 'Admin User',
  email: 'admin@ohana.com',
  password: 'Admin123!',
  role: 'admin' as const,
  phonePrefix: '+57',
  phone: '3001234567',
  cedulaType: 'CC',
  cedula: '12345678',
  isVerified: true,
  verificationLevel: 5,
  accountStatus: 'active' as const,
  status: 'active' as const,
  emailVerified: true,
};

async function cleanDatabase() {
  try {
    console.log('🔌 Conectando a PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    console.log('🗑️  Eliminando todas las tablas y datos...');
    await sequelize.query('DROP SCHEMA public CASCADE;');
    await sequelize.query('CREATE SCHEMA public;');
    console.log('✅ Base de datos limpiada completamente\n');

    console.log('📦 Creando tablas desde modelos...');
    await sequelize.sync();
    console.log('✅ Tablas base creadas correctamente\n');

    console.log('📦 Ejecutando migraciones...');
    const qi = sequelize.getQueryInterface();
    for (const migration of migrations) {
      await migration.up(qi);
    }
    await p2pEscrowUp(qi);
    console.log('✅ Migraciones ejecutadas correctamente\n');

    console.log('👤 Creando usuario administrador...');
    const existingAdmin = await User.findOne({ where: { email: adminData.email } });
    if (existingAdmin) {
      console.log(`⚠️  Admin ${adminData.email} ya existe, actualizando...`);
      await existingAdmin.update(adminData);
    } else {
      await User.create(adminData);
    }
    console.log(`✅ Admin creado: ${adminData.email}\n`);

    console.log('📋 Credenciales del administrador:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Email:    ${adminData.email}`);
    console.log(`  Password: ${adminData.password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎨 Limpieza y seed completados exitosamente!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

cleanDatabase();
