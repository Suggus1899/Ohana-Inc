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
import * as accountStatusMigration from '../migrations/20260311-add-account-status';
import verifiedByIdMigration from '../migrations/20260402-add-verifiedById-column';
import * as verificationLevelMigration from '../migrations/20260404-add-verification-level';
import * as kycVerificationsMigration from '../migrations/20260405-create-kyc-verifications';
import * as kycDocumentsMigration from '../migrations/20260406-create-kyc-documents';
import * as p2pEscrowMigration from '../migrations/20260406-create-p2p-escrow-tables';
import * as kycAttemptsMigration from '../migrations/20260407-create-kyc-attempts';
import * as consentedAtMigration from '../migrations/20260408-add-consented-at';
import * as kycLevelsMigration from '../migrations/20260409-add-kyc-levels';
import chatTablesMigration from '../migrations/20260420-create-chat-tables';
import * as chatMessageDeletionsMigration from '../migrations/20260517-chat-message-deletions';
import priceRateMigration from '../migrations/20260712-add-price-rate-to-properties';
import createAuditoriasTable from '../migrations/20260713-create-auditorias-table';
import { sequelize } from '../config/database';
import { runAllMigrations, Migration } from './migration-runner';

const migrations: { name: string; migration: Migration }[] = [
  { name: '20260311_add_account_status', migration: accountStatusMigration },
  { name: '20260402_add_verifiedById_column', migration: verifiedByIdMigration },
  { name: '20260403_add_escalation_to_tickets', migration: escalationMigration },
  { name: '20260404_add_verification_level', migration: verificationLevelMigration },
  { name: '20260405_create_kyc_verifications', migration: kycVerificationsMigration },
  { name: '20260406_create_kyc_documents', migration: kycDocumentsMigration },
  { name: '20260406_create_p2p_escrow_tables', migration: p2pEscrowMigration },
  { name: '20260407_create_kyc_attempts', migration: kycAttemptsMigration },
  { name: '20260408_add_consented_at', migration: consentedAtMigration },
  { name: '20260409_add_kyc_levels', migration: { up: kycLevelsMigration.up, down: kycLevelsMigration.down } },
  { name: '20260420_create_chat_tables', migration: chatTablesMigration },
  { name: '20260430_create_services_and_behaviors', migration: servicesMigration },
  { name: '20260507_add_rental_request_id_to_transactions', migration: rentalRequestIdMigration },
  { name: '20260517_chat_message_deletions', migration: { up: chatMessageDeletionsMigration.up, down: chatMessageDeletionsMigration.down } },
  { name: '20260517_chat_v2', migration: chatV2Migration },
  { name: '20260519_add_residencia_columns', migration: residenciaColumnsMigration },
  { name: '20260520_add_user_address_preferences', migration: userAddressPreferencesMigration },
  { name: '20260602_create_reviews_tables', migration: reviewsMigration },
  { name: '20260603_add_videourl_to_properties', migration: videoUrlMigration },
  { name: '20260606_fix_property_status_enum', migration: fixPropertyStatusEnum },
  { name: '20260706_add_available_occupied_rooms', migration: availableRoomsMigration },
  { name: '20260706_add_deletedat_to_properties', migration: deletedAtMigration },
  { name: '20260706_allow_null_lease_duration', migration: allowNullLeaseDuration },
  { name: '20260708_email_system', migration: emailSystemMigration },
  { name: '20260710_add_dateofbirth_gender', migration: dateOfBirthGenderMigration },
  { name: '20260711_create_notifications', migration: notificationsMigration },
  { name: '20260711_add_google_auth', migration: googleAuthMigration },
  { name: '20260712_add_tutorial_completed', migration: tutorialCompletedMigration },
  { name: '20260712_add_price_rate', migration: { up: priceRateMigration.up, down: priceRateMigration.down } },
  { name: '20260713_create_auditorias_table', migration: createAuditoriasTable },
  { name: 'unified_migrations', migration: unifiedMigrations },
];

async function main() {
  const action = process.argv[2] || 'up';

  try {
    if (action !== 'up' && action !== 'down') {
      console.error('❌ Acción inválida. Use "up" o "down"');
      process.exit(1);
    }

    await runAllMigrations(migrations, action);
    console.log('✅ All migrations completed successfully.\n');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    try { await sequelize.close(); } catch {}
    process.exit(1);
  }
}

main();
