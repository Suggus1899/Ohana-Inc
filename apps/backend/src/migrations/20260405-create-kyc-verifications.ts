import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migración: Crear tabla kyc_verifications
 * 
 * Esta tabla almacena toda la información de verificación KYC de usuarios.
 * Incluye datos personales, URLs de documentos, puntuaciones de validación,
 * datos OCR, y metadata de revisión.
 * 
 * Requisitos: 16.1-16.15
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  try {
    console.log('\n🚀 ========================================');
    console.log('   CREANDO TABLA kyc_verifications');
    console.log('========================================\n');

    // 1. Verificar si la tabla ya existe
    let tableExists = false;
    try {
      await queryInterface.describeTable('kyc_verifications');
      tableExists = true;
      console.log('⚠️  La tabla kyc_verifications ya existe, saltando creación...');
    } catch (error) {
      console.log('📝 La tabla kyc_verifications no existe, procediendo a crear...');
    }

    if (!tableExists) {
      // 2. Crear ENUM para status
      console.log('📝 Creando tipo ENUM para status...');
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_kyc_verifications_status" AS ENUM(
            'not_started',
            'in_progress',
            'documents_uploaded',
            'pending_review',
            'under_review',
            'approved',
            'rejected',
            'expired',
            'resubmission_required'
          );
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // 3. Crear la tabla kyc_verifications
      console.log('📝 Creando tabla kyc_verifications...');
      await queryInterface.createTable('kyc_verifications', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          unique: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          comment: 'Usuario asociado a esta verificación (UNIQUE)'
        },
        status: {
          type: DataTypes.ENUM(
            'not_started',
            'in_progress',
            'documents_uploaded',
            'pending_review',
            'under_review',
            'approved',
            'rejected',
            'expired',
            'resubmission_required'
          ),
          allowNull: false,
          defaultValue: 'not_started',
          comment: 'Estado actual de la verificación'
        },
        verificationLevel: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Nivel de verificación (0-5)'
        },
        // Campos de información personal
        fullName: {
          type: DataTypes.STRING(255),
          allowNull: true,
          comment: 'Nombre completo extraído del documento'
        },
        documentNumber: {
          type: DataTypes.STRING(50),
          allowNull: true,
          comment: 'Número de documento de identidad (V-XXXXXXXX o E-XXXXXXXX)'
        },
        documentType: {
          type: DataTypes.STRING(50),
          allowNull: true,
          comment: 'Tipo de documento (cédula, pasaporte, etc.)'
        },
        dateOfBirth: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          comment: 'Fecha de nacimiento del usuario'
        },
        nationality: {
          type: DataTypes.STRING(50),
          allowNull: true,
          comment: 'Nacionalidad (Venezolana, Extranjera)'
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Dirección del usuario'
        },
        // URLs de documentos
        documentFrontUrl: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'URL del documento de identidad (frente)'
        },
        documentBackUrl: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'URL del documento de identidad (reverso)'
        },
        selfieUrl: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'URL de la selfie del usuario'
        },
        selfieWithDocumentUrl: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'URL de la selfie con documento'
        },
        livenessVideoUrl: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'URL del video de detección de vida'
        },
        proofOfAddressUrl: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'URL del comprobante de domicilio'
        },
        // Puntuaciones (DECIMAL 5,2 permite valores de 0.00 a 999.99)
        faceMatchScore: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
          comment: 'Puntuación de coincidencia facial (0-100)'
        },
        livenessScore: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
          comment: 'Puntuación de detección de vida (0-100)'
        },
        documentValidityScore: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
          comment: 'Puntuación de validez del documento (0-100)'
        },
        fraudScore: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
          comment: 'Puntuación de riesgo de fraude (0-100)'
        },
        // Datos OCR en formato JSONB
        ocrData: {
          type: DataTypes.JSONB,
          allowNull: true,
          comment: 'Datos extraídos por OCR del documento'
        },
        // Campos de revisión manual
        reviewedBy: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
          comment: 'ID del operador que revisó la verificación'
        },
        reviewedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Fecha y hora de la revisión'
        },
        reviewNotes: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Notas del operador sobre la revisión'
        },
        rejectionReason: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Razón del rechazo si fue rechazada'
        },
        // Metadata
        attempts: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Número de intentos de verificación'
        },
        lastAttemptAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Fecha y hora del último intento'
        },
        verifiedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Fecha y hora de aprobación'
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Fecha de expiración de la verificación (1 año después de aprobación)'
        },
        // Timestamps automáticos
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      });

      console.log('✅ Tabla kyc_verifications creada exitosamente');
    }

    // 4. Crear índices
    console.log('📝 Creando índices...');
    const indexes = await queryInterface.showIndex('kyc_verifications') as any[];

    // Índice en userId (UNIQUE, ya creado por constraint pero verificamos)
    if (!indexes.some((idx: any) => idx.name === 'kyc_verifications_user_id')) {
      console.log('📝 Creando índice kyc_verifications_user_id...');
      await queryInterface.addIndex('kyc_verifications', ['userId'], {
        name: 'kyc_verifications_user_id',
        unique: true
      });
    } else {
      console.log('⚠️  Índice kyc_verifications_user_id ya existe');
    }

    // Índice en status
    if (!indexes.some((idx: any) => idx.name === 'kyc_verifications_status_idx')) {
      console.log('📝 Creando índice kyc_verifications_status_idx...');
      await queryInterface.addIndex('kyc_verifications', ['status'], {
        name: 'kyc_verifications_status_idx'
      });
    } else {
      console.log('⚠️  Índice kyc_verifications_status_idx ya existe');
    }

    // Índice en verificationLevel
    if (!indexes.some((idx: any) => idx.name === 'kyc_verifications_verification_level_idx')) {
      console.log('📝 Creando índice kyc_verifications_verification_level_idx...');
      await queryInterface.addIndex('kyc_verifications', ['verificationLevel'], {
        name: 'kyc_verifications_verification_level_idx'
      });
    } else {
      console.log('⚠️  Índice kyc_verifications_verification_level_idx ya existe');
    }

    // Índice en documentNumber
    if (!indexes.some((idx: any) => idx.name === 'kyc_verifications_document_number_idx')) {
      console.log('📝 Creando índice kyc_verifications_document_number_idx...');
      await queryInterface.addIndex('kyc_verifications', ['documentNumber'], {
        name: 'kyc_verifications_document_number_idx'
      });
    } else {
      console.log('⚠️  Índice kyc_verifications_document_number_idx ya existe');
    }

    // Índice en createdAt
    if (!indexes.some((idx: any) => idx.name === 'kyc_verifications_created_at_idx')) {
      console.log('📝 Creando índice kyc_verifications_created_at_idx...');
      await queryInterface.addIndex('kyc_verifications', ['createdAt'], {
        name: 'kyc_verifications_created_at_idx'
      });
    } else {
      console.log('⚠️  Índice kyc_verifications_created_at_idx ya existe');
    }

    // Índice en reviewedBy
    if (!indexes.some((idx: any) => idx.name === 'kyc_verifications_reviewed_by_idx')) {
      console.log('📝 Creando índice kyc_verifications_reviewed_by_idx...');
      await queryInterface.addIndex('kyc_verifications', ['reviewedBy'], {
        name: 'kyc_verifications_reviewed_by_idx'
      });
    } else {
      console.log('⚠️  Índice kyc_verifications_reviewed_by_idx ya existe');
    }

    console.log('\n🎉 ========================================');
    console.log('   MIGRACIÓN COMPLETADA');
    console.log('========================================');
    console.log('\n✅ Cambios aplicados:');
    console.log('   • Tabla kyc_verifications creada');
    console.log('   • ENUM status con 9 valores');
    console.log('   • userId UNIQUE con FK a users(id)');
    console.log('   • Campos JSONB para ocrData');
    console.log('   • Campos DECIMAL(5,2) para puntuaciones');
    console.log('   • 6 índices creados');
    console.log('\n✨ Base de datos actualizada exitosamente\n');

  } catch (error) {
    console.error('\n❌ Error en migración:', error);
    throw error;
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  try {
    console.log('\n⏪ ========================================');
    console.log('   REVIRTIENDO MIGRACIÓN kyc_verifications');
    console.log('========================================\n');

    // 1. Verificar si la tabla existe
    let tableExists = false;
    try {
      await queryInterface.describeTable('kyc_verifications');
      tableExists = true;
    } catch (error) {
      console.log('⚠️  La tabla kyc_verifications no existe');
    }

    if (tableExists) {
      // 2. Eliminar índices
      console.log('📝 Eliminando índices...');
      const indexes = await queryInterface.showIndex('kyc_verifications') as any[];

      const indexesToRemove = [
        'kyc_verifications_user_id',
        'kyc_verifications_status_idx',
        'kyc_verifications_verification_level_idx',
        'kyc_verifications_document_number_idx',
        'kyc_verifications_created_at_idx',
        'kyc_verifications_reviewed_by_idx'
      ];

      for (const indexName of indexesToRemove) {
        if (indexes.some((idx: any) => idx.name === indexName)) {
          console.log(`📝 Eliminando índice ${indexName}...`);
          await queryInterface.removeIndex('kyc_verifications', indexName);
        }
      }

      // 3. Eliminar la tabla
      console.log('📝 Eliminando tabla kyc_verifications...');
      await queryInterface.dropTable('kyc_verifications');
      console.log('✅ Tabla kyc_verifications eliminada');

      // 4. Eliminar ENUM
      console.log('📝 Eliminando tipo ENUM...');
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS "enum_kyc_verifications_status";
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
