import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migración: Crear tabla kyc_documents
 * 
 * Esta tabla almacena metadatos de cada documento encriptado del proceso KYC.
 * Incluye URLs originales y encriptadas, hash SHA-256 para integridad,
 * y metadata adicional en formato JSONB.
 * 
 * Requisitos: 17.1-17.10
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  try {
    console.log('\n🚀 ========================================');
    console.log('   CREANDO TABLA kyc_documents');
    console.log('========================================\n');

    // 1. Verificar si la tabla ya existe
    let tableExists = false;
    try {
      await queryInterface.describeTable('kyc_documents');
      tableExists = true;
      console.log('⚠️  La tabla kyc_documents ya existe, saltando creación...');
    } catch (error) {
      console.log('📝 La tabla kyc_documents no existe, procediendo a crear...');
    }

    if (!tableExists) {
      // 2. Crear ENUM para documentType
      console.log('📝 Creando tipo ENUM para documentType...');
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_kyc_documents_document_type" AS ENUM(
            'id_front',
            'id_back',
            'selfie',
            'selfie_with_doc',
            'liveness_video',
            'proof_of_address'
          );
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // 3. Crear la tabla kyc_documents
      console.log('📝 Creando tabla kyc_documents...');
      await queryInterface.createTable('kyc_documents', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        verificationId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'kyc_verifications',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          comment: 'ID de la verificación asociada'
        },
        documentType: {
          type: DataTypes.ENUM(
            'id_front',
            'id_back',
            'selfie',
            'selfie_with_doc',
            'liveness_video',
            'proof_of_address'
          ),
          allowNull: false,
          comment: 'Tipo de documento'
        },
        url: {
          type: DataTypes.TEXT,
          allowNull: false,
          comment: 'URL original del archivo'
        },
        encryptedUrl: {
          type: DataTypes.TEXT,
          allowNull: false,
          comment: 'URL del archivo encriptado'
        },
        fileHash: {
          type: DataTypes.STRING(64),
          allowNull: false,
          comment: 'Hash SHA-256 del archivo para verificación de integridad'
        },
        metadata: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
          comment: 'Metadatos adicionales (originalName, size, mimeType, iv, authTag)'
        },
        uploadedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          comment: 'Fecha y hora de carga del documento'
        }
      });

      console.log('✅ Tabla kyc_documents creada exitosamente');
    }

    // 4. Crear índices
    console.log('📝 Creando índices...');
    const indexes = await queryInterface.showIndex('kyc_documents') as any[];

    // Índice en verificationId
    if (!indexes.some((idx: any) => idx.name === 'kyc_documents_verification_id_idx')) {
      console.log('📝 Creando índice kyc_documents_verification_id_idx...');
      await queryInterface.addIndex('kyc_documents', ['verificationId'], {
        name: 'kyc_documents_verification_id_idx'
      });
    } else {
      console.log('⚠️  Índice kyc_documents_verification_id_idx ya existe');
    }

    // Índice en documentType
    if (!indexes.some((idx: any) => idx.name === 'kyc_documents_document_type_idx')) {
      console.log('📝 Creando índice kyc_documents_document_type_idx...');
      await queryInterface.addIndex('kyc_documents', ['documentType'], {
        name: 'kyc_documents_document_type_idx'
      });
    } else {
      console.log('⚠️  Índice kyc_documents_document_type_idx ya existe');
    }

    // Índice en fileHash
    if (!indexes.some((idx: any) => idx.name === 'kyc_documents_file_hash_idx')) {
      console.log('📝 Creando índice kyc_documents_file_hash_idx...');
      await queryInterface.addIndex('kyc_documents', ['fileHash'], {
        name: 'kyc_documents_file_hash_idx'
      });
    } else {
      console.log('⚠️  Índice kyc_documents_file_hash_idx ya existe');
    }

    console.log('\n🎉 ========================================');
    console.log('   MIGRACIÓN COMPLETADA');
    console.log('========================================');
    console.log('\n✅ Cambios aplicados:');
    console.log('   • Tabla kyc_documents creada');
    console.log('   • ENUM documentType con 6 valores');
    console.log('   • verificationId con FK a kyc_verifications(id) ON DELETE CASCADE');
    console.log('   • Campo fileHash STRING(64) para SHA-256');
    console.log('   • Campo metadata JSONB para datos adicionales');
    console.log('   • 3 índices creados');
    console.log('\n✨ Base de datos actualizada exitosamente\n');

  } catch (error) {
    console.error('\n❌ Error en migración:', error);
    throw error;
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  try {
    console.log('\n⏪ ========================================');
    console.log('   REVIRTIENDO MIGRACIÓN kyc_documents');
    console.log('========================================\n');

    // 1. Verificar si la tabla existe
    let tableExists = false;
    try {
      await queryInterface.describeTable('kyc_documents');
      tableExists = true;
    } catch (error) {
      console.log('⚠️  La tabla kyc_documents no existe');
    }

    if (tableExists) {
      // 2. Eliminar índices
      console.log('📝 Eliminando índices...');
      const indexes = await queryInterface.showIndex('kyc_documents') as any[];

      const indexesToRemove = [
        'kyc_documents_verification_id_idx',
        'kyc_documents_document_type_idx',
        'kyc_documents_file_hash_idx'
      ];

      for (const indexName of indexesToRemove) {
        if (indexes.some((idx: any) => idx.name === indexName)) {
          console.log(`📝 Eliminando índice ${indexName}...`);
          await queryInterface.removeIndex('kyc_documents', indexName);
        }
      }

      // 3. Eliminar la tabla
      console.log('📝 Eliminando tabla kyc_documents...');
      await queryInterface.dropTable('kyc_documents');
      console.log('✅ Tabla kyc_documents eliminada');

      // 4. Eliminar ENUM
      console.log('📝 Eliminando tipo ENUM...');
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS "enum_kyc_documents_document_type";
      `);
      console.log('✅ Tipo ENUM eliminado');
    }

    console.log('\n🎉 ========================================');
    console.log('   ROLLBACK COMPLETADO');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Error en rollback:', error);
    throw error;
  }
}
