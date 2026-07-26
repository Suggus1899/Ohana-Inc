import KYCVerification, { VerificationStatus } from '../models/KYCVerification';
import KYCDocument, { DocumentType } from '../models/KYCDocument';
import KYCAttempt, { AttemptStep } from '../models/KYCAttempt';
import User from '../models/User';
// Import models/index to ensure associations are loaded
import '../models/index';
import { EncryptionService } from './encryption.service';
import { StorageService } from './storage.service';
import { OCRService } from './ocr.service';
import { FaceMatchService } from './face-match.service';
import { LivenessDetectionService } from './liveness/liveness-detection.service';
import { NotificationService } from './notification.service';
import { auditLogger } from './audit-logger.service';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { KYCVerificationMetadata, LivenessAnalysisMetadata } from '../types/kyc-metadata.types';

/**
 * KYCService
 * 
 * Servicio principal que orquesta todo el proceso de verificación de identidad KYC.
 * Gestiona verificaciones, documentos, procesamiento automático, revisión manual,
 * expiración y renovación.
 * 
 * Requisitos: 3.1-3.7, 4.1-4.12, 5.1-5.13, 9.1-9.14, 10.1-10.9, 11.1-11.10,
 *             13.1-13.16, 14.1-14.10, 15.1-15.10, 16.1-16.15, 24.1-24.10
 */

export interface VerificationFilters {
  status?: VerificationStatus;
  dateFrom?: Date;
  dateTo?: Date;
  fraudScoreMin?: number;
  fraudScoreMax?: number;
}

export interface ProcessingResult {
  success: boolean;
  ocrData?: any;
  faceMatchScore?: number;
  livenessScore?: number;
  documentValidityScore?: number;
  fraudScore?: number;
  status: VerificationStatus;
  errors?: string[];
}

export class KYCService {
  private encryptionService: EncryptionService;
  private storageService: StorageService;
  private ocrService: OCRService;
  private faceMatchService: InstanceType<typeof FaceMatchService>;
  private livenessService: InstanceType<typeof LivenessDetectionService>;
  private notificationService: NotificationService;

  constructor() {
    this.encryptionService = new EncryptionService();
    this.storageService = new StorageService();
    this.ocrService = new OCRService();
    this.faceMatchService = new FaceMatchService();
    this.livenessService = new LivenessDetectionService();
    this.notificationService = new NotificationService();
  }

  /**
   * Crea una nueva verificación para un usuario
   * 
   * @param userId - ID del usuario
   * @param consentedAt - Fecha y hora del consentimiento (opcional)
   * @returns Verificación creada
   * @throws Error si el usuario ya tiene verificación activa o excede límite de intentos
   * 
   * Requisitos: 3.1-3.7, 16.1-16.15, 31.5
   */
  async createVerification(userId: number, consentedAt?: Date): Promise<KYCVerification> {
    // Validar que el usuario existe
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    return await sequelize.transaction(async (t) => {
      // Buscar CUALQUIER verificación existente del usuario con lock para prevenir race condition
      const existingVerification = await KYCVerification.findOne({
        where: { userId },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (existingVerification) {
        const RESTARTABLE_STATUSES = ['rejected', 'expired', 'not_started', 'documents_uploaded', 'pending_review'];
        if (RESTARTABLE_STATUSES.includes(existingVerification.status)) {
          const docsCount = await KYCDocument.count({
            where: { verificationId: existingVerification.id },
            transaction: t,
          });

          if (docsCount === 0 || ['rejected', 'expired'].includes(existingVerification.status)) {
            await existingVerification.destroy({ transaction: t });
          } else {
            await existingVerification.destroy({ transaction: t });
          }
        } else if (existingVerification.status === 'approved') {
          throw new Error('User is already verified');
        } else {
          throw new Error('User already has an active verification in progress');
        }
      }

      // Validar límite de 3 intentos en 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentAttempts = await KYCVerification.count({
        where: {
          userId,
          createdAt: {
            [Op.gte]: thirtyDaysAgo
          }
        },
        transaction: t,
      });

      if (recentAttempts >= 3) {
        throw new Error('Maximum of 3 verification attempts per 30 days exceeded');
      }

      // Crear nueva verificación
      const verification = await KYCVerification.create({
        userId,
        status: 'not_started',
        verificationLevel: 0,
        currentLevel: 0,
        attempts: 0,
        consentedAt: consentedAt || new Date()
      }, { transaction: t });

      return verification;
    }).then(async (verification) => {
      // Log audit after transaction commits — don't block or rollback for audit failures
      try {
        await auditLogger.logVerificationStarted(userId);
      } catch (auditErr) {
        console.error('Audit log failed for verification start:', auditErr);
      }
      return verification;
    });
  }

  /**
   * Obtiene la verificación de un usuario por su userId
   * 
   * @param userId - ID del usuario
   * @returns Verificación del usuario o null si no existe
   * 
   * Requisitos: 3.1-3.7
   */
  async getVerificationByUserId(userId: number): Promise<KYCVerification | null> {
    return await KYCVerification.findOne({
      where: { userId }
    });
  }

  /**
   * Obtiene una verificación por su ID
   * 
   * @param verificationId - ID de la verificación
   * @returns Verificación o null si no existe
   * 
   * Requisitos: 3.1-3.7
   */
  async getVerificationById(verificationId: number): Promise<KYCVerification | null> {
    return await KYCVerification.findByPk(verificationId);
  }

  /**
   * Sube y encripta un documento de verificación
   * 
   * @param verificationId - ID de la verificación
   * @param documentType - Tipo de documento
   * @param fileBuffer - Buffer del archivo
   * @returns Documento creado
   * 
   * Requisitos: 4.1-4.12, 12.1-12.13
   */
  async uploadDocument(
    verificationId: number,
    documentType: DocumentType,
    fileBuffer: Buffer
  ): Promise<KYCDocument> {
    // Obtener verificación
    const verification = await this.getVerificationById(verificationId);
    if (!verification) {
      throw new Error(`Verification with id ${verificationId} not found`);
    }

    // Calcular hash SHA-256 del archivo (Requisito 4.11, 12.7)
    const fileHash = this.encryptionService.calculateHash(fileBuffer);

    // Encriptar archivo (Requisito 4.12, 12.1, 12.2, 12.3)
    const encryptedData = this.encryptionService.encrypt(fileBuffer);

    // Generar nombre de archivo único
    const fileName = `${verificationId}-${documentType}-${Date.now()}`;
    const encryptedFileName = `${fileName}.enc`;

    // Guardar archivo encriptado (Requisito 12.4, 12.5)
    const encryptedUrl = await this.storageService.save(
      encryptedFileName,
      encryptedData.encrypted,
      {
        contentType: 'application/octet-stream',
        originalName: fileName,
        size: fileBuffer.length,
        iv: encryptedData.iv.toString('hex'),
        authTag: encryptedData.authTag.toString('hex')
      }
    );

    // Crear registro en KYCDocument (Requisito 12.6, 12.8)
    const document = await KYCDocument.create({
      verificationId,
      documentType,
      url: fileName,
      encryptedUrl,
      fileHash,
      metadata: {
        originalName: fileName,
        size: fileBuffer.length,
        mimeType: 'application/octet-stream',
        iv: encryptedData.iv.toString('hex'),
        authTag: encryptedData.authTag.toString('hex')
      }
    });

    // Registrar carga de documento en logs de auditoría (Requisito 32.2)
    await auditLogger.logDocumentUploaded(verification.userId, documentType, fileHash);

    // Actualizar status de verificación según documentos completados
    await this.updateVerificationStatus(verification);

    // Registrar intento en KYCAttempt (Requisito 3.7)
    await KYCAttempt.create({
      verificationId,
      attemptNumber: verification.attempts + 1,
      step: 'document_capture',
      success: true,
      metadata: {
        documentType,
        fileHash
      }
    });

    return document;
  }

  /**
   * Actualiza el status de verificación según documentos completados
   * 
   * @private
   */
  private async updateVerificationStatus(verification: KYCVerification): Promise<void> {
    const documents = await KYCDocument.findAll({
      where: { verificationId: verification.id }
    });

    const documentTypes = documents.map(d => d.documentType);
    const requiredDocs: DocumentType[] = ['id_front', 'id_back', 'selfie', 'selfie_with_doc', 'liveness_video'];
    const hasAllDocs = requiredDocs.every(type => documentTypes.includes(type));

    // Calculate level based on documents uploaded (Requisito 31.6)
    let currentLevel = verification.verificationLevel;
    
    // Level 2: At least one identity document uploaded
    if (documentTypes.includes('id_front') || documentTypes.includes('id_back')) {
      currentLevel = Math.max(currentLevel, 2);
    }
    
    // Update verification status
    if (hasAllDocs) {
      if (verification.status === 'not_started' || verification.status === 'in_progress') {
        await verification.update({ status: 'documents_uploaded' });
      }
    } else if (verification.status === 'not_started') {
      await verification.update({ status: 'in_progress' });
    }

    // Persist level update if changed
    if (currentLevel !== verification.verificationLevel) {
      await verification.update({ verificationLevel: currentLevel });
      
      // Update User level as well (Requisito 31.6)
      const user = await User.findByPk(verification.userId);
      if (user) {
        await user.update({ verificationLevel: currentLevel });
      }
    }
  }

  /**
   * Calcula la puntuación de fraude basada en las validaciones
   * 
   * @param verification - Verificación con puntuaciones
   * @returns Puntuación de fraude (0-100)
   * 
   * Requisitos: 11.1-11.10, 35.7-35.10
   */
  calculateFraudScore(verification: KYCVerification): number {
    let fraudScore = 0;

    // Sumar 40 puntos si documentValidityScore < 70 (Requisito 11.2, 35.8)
    if (verification.documentValidityScore !== null && 
        verification.documentValidityScore !== undefined && 
        verification.documentValidityScore < 70) {
      fraudScore += 40;
    }

    // Sumar 35 puntos si faceMatchScore < 80 (Requisito 11.3, 35.9)
    if (verification.faceMatchScore !== null && 
        verification.faceMatchScore !== undefined && 
        verification.faceMatchScore < 80) {
      fraudScore += 35;
    }

    // Sumar 25 puntos si livenessScore < 85 (Requisito 11.4, 35.10)
    if (verification.livenessScore !== null && 
        verification.livenessScore !== undefined && 
        verification.livenessScore < 85) {
      fraudScore += 25;
    }

    // Limitar puntuación máxima a 100 (Requisito 11.5, 35.7)
    return Math.min(fraudScore, 100);
  }

  /**
   * Procesa una verificación completa: OCR, face match, liveness, validaciones
   * 
   * @param verificationId - ID de la verificación
   * @returns Resultado del procesamiento
   * 
   * Requisitos: 5.1-5.13, 9.1-9.14, 10.1-10.9, 11.1-11.10
   */
  async processVerification(verificationId: number): Promise<ProcessingResult> {
    const errors: string[] = [];
    console.log(`[KYCService] Starting processing for verification ID: ${verificationId}`);

    try {
      // Obtener verificación
      const verification = await this.getVerificationById(verificationId);
      if (!verification) {
        throw new Error(`Verification with id ${verificationId} not found`);
      }
      console.log(`[KYCService] Verification found for user: ${verification.userId}`);

      // Obtener documentos asociados
      const documents = await KYCDocument.findAll({
        where: { verificationId }
      });
      console.log(`[KYCService] Documents found: ${documents.length}`);

      const docMap = new Map<DocumentType, KYCDocument>();
      documents.forEach(doc => docMap.set(doc.documentType, doc));

      // Desencriptar imágenes de documentos si existen
      const idFrontDoc = docMap.get('id_front');
      const idBackDoc = docMap.get('id_back');
      const selfieDoc = docMap.get('selfie');
      const selfieWithDoc = docMap.get('selfie_with_doc');
      const livenessDoc = docMap.get('liveness_video');

      console.log(`[KYCService] Decrypting documents...`);
      const idFrontBuffer = idFrontDoc ? await this.decryptDocument(idFrontDoc) : null;
      const idBackBuffer = idBackDoc ? await this.decryptDocument(idBackDoc) : null;
      const selfieBuffer = selfieDoc ? await this.decryptDocument(selfieDoc) : null;
      const selfieWithDocBuffer = selfieWithDoc ? await this.decryptDocument(selfieWithDoc) : null;
      console.log(`[KYCService] Decryption complete.`);

      // Llamar OCRService.extractData() si ambos lados existen (Requisito 5.1-5.13)
      let ocrData: any = undefined;
      if (idFrontBuffer && idBackBuffer) {
        console.log(`[KYCService] Starting OCR extraction...`);
        try {
          ocrData = await this.ocrService.extractData(idFrontBuffer, idBackBuffer);
          console.log(`[KYCService] OCR extraction complete. Confidence: ${ocrData.confidence}`);
          
          // Registrar llamada a OCR en logs de auditoría (Requisito 32.4)
          await auditLogger.logOCRCall(verification.userId, ocrData);
          
          // Registrar intento de OCR
          await KYCAttempt.create({
            verificationId,
            attemptNumber: verification.attempts + 1,
            step: 'ocr',
            success: true,
            metadata: { confidence: ocrData.confidence }
          });

          // Validar número de cédula con regex (Requisito 5.10, 35.1)
          const documentNumberPattern = /^[VE]\d{7,8}$/;
          if (!ocrData.documentNumber || !documentNumberPattern.test(ocrData.documentNumber)) {
            errors.push('Número de cédula inválido detectado en el documento');
          }

          // Validar documento no vencido (Requisito 10.8, 35.5)
          if (ocrData.expirationDate) {
            const isExpired = new Date() >= ocrData.expirationDate;
            if (isExpired) {
              errors.push('El documento de identidad está vencido');
            }
          } else {
            errors.push('No se detectó la fecha de vencimiento en el documento');
          }

          // Si pasó OCR sin errores fatales, subir nivel a 3 (Documentos aprobados)
          if (errors.length === 0) {
            await verification.update({ verificationLevel: Math.max(verification.verificationLevel, 3) });
            const user = await User.findByPk(verification.userId);
            if (user) await user.update({ verificationLevel: Math.max(user.verificationLevel || 0, 3) });
          }
        } catch (error: any) {
          console.error(`[KYCService] OCR failed:`, error);
          
          // Manejar error UNDERAGE específicamente (Requisito 7.6)
          if (error.code === 'UNDERAGE') {
            errors.push('UNDERAGE: El usuario debe ser mayor de 18 años para usar este servicio');
          } else {
            errors.push(`Fallo en la extracción de datos (OCR): ${error.message || error}`);
          }
          
          await KYCAttempt.create({
            verificationId,
            attemptNumber: verification.attempts + 1,
            step: 'ocr',
            success: false,
            errorMessage: String(error)
          });
        }
      } else {
        console.log(`[KYCService] Skipping OCR (missing buffers).`);
        errors.push('Faltan documentos de identidad (frontal o reverso) para el procesamiento OCR');
      }

      // Llamar FaceMatchService.compareFaces() si existe frontal y selfie (Requisito 9.1-9.14)
      let faceMatchScore = 0;
      if (idFrontBuffer && selfieBuffer && selfieWithDocBuffer) {
        console.log(`[KYCService] Starting face match comparison...`);
        try {
          // Comparar rostro del documento con la selfie normal
          const faceMatchResult = await this.faceMatchService.compareFaces(idFrontBuffer, selfieBuffer);
          
          // Comparar también con la selfie sosteniendo el documento para mayor seguridad (Requisito 9.11)
          const faceMatchWithDocResult = await this.faceMatchService.compareFaces(idFrontBuffer, selfieWithDocBuffer);
          
          // El score final es el promedio ponderado o el mínimo para ser conservadores
          faceMatchScore = Math.min(faceMatchResult.score, faceMatchWithDocResult.score);
          console.log(`[KYCService] Face match complete. Score: ${faceMatchScore}`);

          // Registrar llamada a face-api.js en logs de auditoría (Requisito 32.3)
          await auditLogger.logFaceMatchCall(verification.userId, 'compareFaces', {
            normal: faceMatchResult,
            withDoc: faceMatchWithDocResult,
            finalScore: faceMatchScore
          });

          await KYCAttempt.create({
            verificationId,
            attemptNumber: verification.attempts + 1,
            step: 'face_match',
            success: faceMatchResult.match && faceMatchWithDocResult.match,
            metadata: {
              score: faceMatchScore,
              normalMatch: faceMatchResult.match,
              withDocMatch: faceMatchWithDocResult.match,
              normalScore: faceMatchResult.score,
              withDocScore: faceMatchWithDocResult.score
            }
          });

          if (!faceMatchResult.match || !faceMatchWithDocResult.match) {
            errors.push('La selfie no coincide con la foto del documento de identidad');
          }
        } catch (error: any) {
          console.error(`[KYCService] Face match failed:`, error);
          
          // Manejar errores específicos con códigos (Requisito 8.2, 8.4)
          if (error.code === 'MODELS_NOT_FOUND') {
            errors.push('MODELS_NOT_FOUND: Sistema temporalmente no disponible. Por favor, intenta nuevamente más tarde.');
          } else if (error.message && error.message.includes('No face detected')) {
            errors.push('NO_FACE_DETECTED: No se pudo completar la comparación facial. Asegúrate de que tu rostro sea visible.');
          } else {
            errors.push(`FACE_MATCH_FAILED: No se pudo completar la comparación facial. Asegúrate de que tu rostro sea visible.`);
          }
          
          await KYCAttempt.create({
            verificationId,
            attemptNumber: verification.attempts + 1,
            step: 'face_match',
            success: false,
            errorMessage: String(error)
          });
        }
      } else {
        console.log(`[KYCService] Skipping face match (missing buffers).`);
        errors.push('Faltan selfies para la comparación facial');
      }

      // Llamar LivenessDetectionService.analyzeLiveness() si existe video (Requisito 2.1-2.6, 4.1-4.5)
      let livenessScore = 0;
      let livenessAnalysis: LivenessAnalysisMetadata | undefined = undefined;
      if (livenessDoc) {
        console.log(`[KYCService] Starting liveness detection...`);
        try {
          // Guardar video temporalmente para análisis
          const videoPath = await this.saveTemporaryFile(
            await this.decryptDocument(livenessDoc),
            'liveness-video.webm'
          );

          // Requirement 4.1: Ejecutar análisis de liveness antes de comparación facial
          const livenessResult = await this.livenessService.analyzeLiveness(videoPath);
          
          // Calcular score de liveness (0-100)
          livenessScore = livenessResult.qualityScore;
          
          // Requirement 4.4: Almacenar metadata de liveness
          livenessAnalysis = {
            isLive: livenessResult.isLive,
            blinkCount: livenessResult.blinkCount,
            headMovementRange: livenessResult.headMovementRange,
            averageFaceConfidence: livenessResult.averageFaceConfidence,
            framesAnalyzed: livenessResult.framesAnalyzed,
            qualityScore: livenessResult.qualityScore,
            failureReason: livenessResult.failureReason,
            timestamp: new Date().toISOString()
          };
          
          console.log(`[KYCService] Liveness complete. isLive: ${livenessResult.isLive}, Score: ${livenessScore}`);

          // Requirement 4.5, 10.1, 10.3, 10.4, 10.5: Registrar resultado en audit log
          await auditLogger.logLivenessAnalysis(verification.userId, {
            isLive: livenessResult.isLive,
            blinkCount: livenessResult.blinkCount,
            headMovementRange: livenessResult.headMovementRange,
            qualityScore: livenessResult.qualityScore,
            failureReason: livenessResult.failureReason
          });

          // Requirement 4.2: Rechazar si liveness falla con código LIVENESS_FAILED
          if (!livenessResult.isLive) {
            // Requirement 10.3: Registrar evento de seguridad cuando se detecta ataque
            await auditLogger.logSecurityAlert(verification.userId, 'liveness_failed', {
              reason: livenessResult.failureReason,
              blinkCount: livenessResult.blinkCount,
              headMovementRange: livenessResult.headMovementRange,
              qualityScore: livenessResult.qualityScore
            });
            
            errors.push(`LIVENESS_FAILED: ${this.getLivenessErrorMessage(livenessResult.failureReason)}`);
          }

          await KYCAttempt.create({
            verificationId,
            attemptNumber: verification.attempts + 1,
            step: 'liveness',
            success: livenessResult.isLive,
            metadata: {
              isLive: livenessResult.isLive,
              blinkCount: livenessResult.blinkCount,
              headMovementRange: livenessResult.headMovementRange,
              qualityScore: livenessResult.qualityScore,
              failureReason: livenessResult.failureReason,
              // Requisito 10.2: Almacenar métricas de performance
              performance: livenessResult.performance
            }
          });

          // Limpiar archivo temporal
          await this.deleteTemporaryFile(videoPath);
        } catch (error: any) {
          console.error(`[KYCService] Liveness failed:`, error);
          
          // Manejar errores específicos con códigos
          const errorCode = error.code || error.name;
          
          if (errorCode === 'FFMPEG_NOT_FOUND') {
            errors.push('FFMPEG_NOT_FOUND: Sistema temporalmente no disponible. Por favor, intenta nuevamente más tarde.');
          } else if (errorCode === 'INSUFFICIENT_FRAMES') {
            errors.push('INSUFFICIENT_FRAMES: El video es muy corto o está corrupto. Por favor, graba un video de al menos 3 segundos.');
          } else if (errorCode === 'FACE_NOT_DETECTED') {
            errors.push('FACE_NOT_DETECTED: No pudimos detectar tu rostro. Por favor, asegúrate de que tu cara esté visible y bien iluminada.');
          } else if (errorCode === 'MODELS_NOT_FOUND') {
            errors.push('MODELS_NOT_FOUND: Sistema temporalmente no disponible. Por favor, intenta nuevamente más tarde.');
          } else if (errorCode === 'LIVENESS_FAILED') {
            errors.push(`LIVENESS_FAILED: ${error.message}`);
          } else if (errorCode === 'POOR_QUALITY') {
            errors.push(`POOR_QUALITY: ${error.message}`);
          } else if (errorCode === 'VIDEO_PROCESSING_FAILED') {
            errors.push(`VIDEO_PROCESSING_FAILED: ${error.message}`);
          } else if (errorCode === 'FACE_DETECTION_FAILED') {
            errors.push(`FACE_DETECTION_FAILED: ${error.message}`);
          } else {
            errors.push(`Fallo en la detección de vida: ${error.message || error}`);
          }
          
          await KYCAttempt.create({
            verificationId,
            attemptNumber: verification.attempts + 1,
            step: 'liveness',
            success: false,
            errorMessage: String(error)
          });
        }
      } else {
        console.log(`[KYCService] Skipping liveness (missing document).`);
        errors.push('Falta el video de detección de vida');
      }

      // Si pasó Face Match y Liveness, subir nivel a 4 (Biometría aprobada)
      if (faceMatchScore >= 80 && livenessScore >= 85) {
        console.log(`[KYCService] Biometry passed. Updating level to 4.`);
        await verification.update({ verificationLevel: Math.max(verification.verificationLevel, 4) });
        const user = await User.findByPk(verification.userId);
        if (user) await user.update({ verificationLevel: Math.max(user.verificationLevel || 0, 4) });
      }

      // Calcular documentValidityScore (placeholder: 100 si pasa validaciones)
      const documentValidityScore = errors.filter(e => !e.includes('Faltan')).length === 0 ? 100 : 70;

      console.log(`[KYCService] Finalizing verification update...`);
      // Actualizar verificación con datos extraídos
      // Requirement 4.4: Almacenar metadata de liveness en kyc_verifications
      const updatedOcrData: KYCVerificationMetadata = {
        ...(ocrData || verification.ocrData || {}),
        livenessAnalysis,
        livenessDebug: livenessAnalysis ? {
          blinkTimestamps: [],
          earSequence: [],
          angleSequence: []
        } : undefined
      };

      await verification.update({
        fullName: ocrData?.fullName || verification.fullName,
        documentNumber: ocrData?.documentNumber || verification.documentNumber,
        dateOfBirth: ocrData?.dateOfBirth || verification.dateOfBirth,
        nationality: ocrData?.nationality || verification.nationality,
        ocrData: updatedOcrData,
        faceMatchScore,
        livenessScore,
        documentValidityScore
      });

      // Calcular fraudScore (Requisito 11.1-11.10)
      const fraudScore = this.calculateFraudScore(verification);
      await verification.update({ fraudScore });
      console.log(`[KYCService] Fraud score calculated: ${fraudScore}`);

      // Cambiar status según fraudScore (Requisito 11.7, 11.8, 11.9)
      let newStatus: VerificationStatus;
      
      // Si el fraude es muy alto (> 80) o hay errores críticos, pedir reenvío
      // Si el fraude es medio (30-80), enviar a revisión manual
      // Si el fraude es bajo (< 30), enviar a revisión manual (o auto-aprobar si se desea)
      if (fraudScore > 80) {
        newStatus = 'resubmission_required';
        console.log(`[KYCService] Auto-rejecting (fraudScore > 80).`);
        try {
          await this.notificationService.sendRejectionEmail(
            verification.userId,
            'La verificación automática detectó problemas graves. Por favor, asegúrate de que las fotos sean claras y correspondan a tu identidad.'
          );
        } catch (emailError) {
          console.error(`[KYCService] Failed to send rejection email:`, emailError);
        }
      } else {
        newStatus = 'pending_review';
        console.log(`[KYCService] Moving to pending_review.`);
        try {
          await this.notificationService.sendPendingReviewEmail(verification.userId);
        } catch (emailError) {
          console.error(`[KYCService] Failed to send pending review email:`, emailError);
        }
      }

      // Bug Fix 1.4: Ensure status is ALWAYS updated with explicit fallback
      // If no status was determined, set based on errors
      if (!newStatus) {
        newStatus = errors.length > 0 ? 'resubmission_required' : 'pending_review';
        console.log(`[KYCService] Fallback status applied: ${newStatus} (errors: ${errors.length})`);
      }

      // Bug Fix 1.4: Use transaction to ensure atomic status update
      console.log(`[KYCService] Updating status from '${verification.status}' to '${newStatus}'`);
      await sequelize.transaction(async (t) => {
        await verification.update({ status: newStatus }, { transaction: t });
        console.log(`[KYCService] Status transition completed: ${verification.status} -> ${newStatus}`);
      });

      console.log(`[KYCService] Processing finished successfully. Final status: ${newStatus}`);

      return {
        success: true,
        ocrData,
        faceMatchScore,
        livenessScore,
        documentValidityScore,
        fraudScore,
        status: newStatus,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error: any) {
      console.error(`[KYCService] Process verification failed for ID ${verificationId}:`, error);
      
      // Bug Fix 1.4: Ensure status update even on failure
      try {
        const verification = await this.getVerificationById(verificationId);
        if (verification && verification.status !== 'resubmission_required') {
          console.log(`[KYCService] Exception occurred, updating status to 'resubmission_required'`);
          await sequelize.transaction(async (t) => {
            await verification.update({ status: 'resubmission_required' }, { transaction: t });
            console.log(`[KYCService] Status transition on error: ${verification.status} -> resubmission_required`);
          });
        }
      } catch (updateError) {
        console.error(`[KYCService] Failed to update status on error:`, updateError);
      }
      
      return {
        success: false,
        status: 'resubmission_required',
        errors: [`Processing failed: ${error.message || error}`]
      };
    }
  }

  /**
   * Desencripta un documento
   * 
   * @private
   */
  private async decryptDocument(document: KYCDocument): Promise<Buffer> {
    const encryptedBuffer = await this.storageService.get(document.encryptedUrl);
    
    const iv = Buffer.from(document.metadata?.iv || '', 'hex');
    const authTag = Buffer.from(document.metadata?.authTag || '', 'hex');

    // Registrar acceso a documento encriptado en logs de auditoría (Requisito 32.7)
    // Nota: Este método es privado y se usa internamente, el operatorId se registra en el controlador
    
    return this.encryptionService.decrypt({
      encrypted: encryptedBuffer,
      iv,
      authTag
    });
  }

  /**
   * Guarda un archivo temporal para procesamiento
   * 
   * @private
   */
  private async saveTemporaryFile(buffer: Buffer, filename: string): Promise<string> {
    const fs = require('fs-extra');
    const path = require('path');
    
    const tempDir = path.join(__dirname, '../../temp');
    await fs.ensureDir(tempDir);
    
    const filePath = path.join(tempDir, `${Date.now()}-${filename}`);
    await fs.writeFile(filePath, buffer);
    
    return filePath;
  }

  /**
   * Elimina un archivo temporal
   * 
   * @private
   */
  private async deleteTemporaryFile(filePath: string): Promise<void> {
    const fs = require('fs-extra');
    await fs.remove(filePath);
  }

  /**
   * Calcula edad a partir de fecha de nacimiento
   * 
   * @private
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Obtiene mensaje de error amigable para el usuario según el código de fallo de liveness
   * 
   * @private
   */
  private getLivenessErrorMessage(failureReason?: string): string {
    switch (failureReason) {
      case 'LIVENESS_FAILED':
        return 'No pudimos verificar que eres una persona real. Por favor, graba un nuevo video parpadeando naturalmente.';
      case 'POOR_QUALITY':
        return 'La calidad del video es insuficiente. Por favor, graba en un lugar bien iluminado.';
      case 'INSUFFICIENT_FRAMES':
        return 'El video es muy corto o está corrupto. Por favor, graba un video de al menos 3 segundos.';
      case 'FACE_NOT_DETECTED':
        return 'No pudimos detectar tu rostro. Por favor, asegúrate de que tu cara esté visible y bien iluminada.';
      default:
        return 'La detección de vida no fue exitosa. Por favor, sigue las instrucciones del video.';
    }
  }

  /**
   * Obtiene verificaciones pendientes de revisión con filtros
   * 
   * @param filters - Filtros opcionales
   * @returns Lista de verificaciones pendientes
   * 
   * Requisitos: 13.1-13.16
   */
  async getPendingVerifications(filters?: VerificationFilters): Promise<KYCVerification[]> {
    try {
      console.log('[getPendingVerifications] Starting query with filters:', filters);
      
      const where: any = {};
      
      if (filters?.status) {
        where.status = filters.status;
      }

      // Aplicar filtros opcionales (Requisito 13.16)
      if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt[Op.gte] = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.createdAt[Op.lte] = filters.dateTo;
        }
      }

      if (filters?.fraudScoreMin !== undefined || filters?.fraudScoreMax !== undefined) {
        where.fraudScore = {};
        if (filters.fraudScoreMin !== undefined) {
          where.fraudScore[Op.gte] = filters.fraudScoreMin;
        }
        if (filters.fraudScoreMax !== undefined) {
          where.fraudScore[Op.lte] = filters.fraudScoreMax;
        }
      }

      console.log('[getPendingVerifications] Query where clause:', JSON.stringify(where));

      // Ordenar por createdAt ASC (más antiguas primero) (Requisito 13.3)
      const verifications = await KYCVerification.findAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'cedula']
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      console.log(`[getPendingVerifications] Found ${verifications.length} verifications`);
      
      return verifications;
    } catch (error: any) {
      console.error('[getPendingVerifications] Error fetching pending verifications:', error);
      console.error('[getPendingVerifications] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Aprueba una verificación manualmente
   * 
   * @param verificationId - ID de la verificación
   * @param operatorId - ID del operador que aprueba
   * @param notes - Notas opcionales
   * 
   * Requisitos: 14.1-14.10
   */
  async approveVerification(
    verificationId: number,
    operatorId: number,
    notes?: string
  ): Promise<void> {
    // Validar que operador tenga rol 'operator' o 'admin' (Requisito 14.1)
    const operator = await User.findByPk(operatorId);
    if (!operator || (operator.role !== 'operator' && operator.role !== 'admin')) {
      throw new Error('Only operators or admins can approve verifications');
    }

    // Obtener verificación
    const verification = await this.getVerificationById(verificationId);
    if (!verification) {
      throw new Error(`Verification with id ${verificationId} not found`);
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 365); // 365 días (Requisito 14.4)

    // Actualizar verificación (Requisitos 14.1-14.5)
    await verification.update({
      status: 'approved',
      verifiedAt: now,
      expiresAt,
      reviewedBy: operatorId,
      reviewedAt: now,
      reviewNotes: notes
    });

    // Actualizar verificationLevel a 5, isVerified y accountStatus en tabla users (Requisito 14.2, 14.6)
    await User.update(
      { verificationLevel: 5, isVerified: true, accountStatus: 'active' },
      { where: { id: verification.userId } }
    );

    // Registrar aprobación en logs de auditoría (Requisito 32.5)
    await auditLogger.logVerificationApproved(operatorId, verification.userId);

    // Registrar aprobación en KYCAttempt (Requisito 14.9)
    await KYCAttempt.create({
      verificationId,
      attemptNumber: verification.attempts + 1,
      step: 'manual_review',
      success: true,
      metadata: {
        operatorId,
        action: 'approved',
        notes
      }
    });

    // Enviar email de aprobación (Requisito 14.7)
    try {
      await this.notificationService.sendApprovalEmail(verification.userId);
    } catch (emailError) {
      console.error(`[KYCService] Failed to send approval email:`, emailError);
    }
  }

  /**
   * Rechaza una verificación manualmente
   * 
   * @param verificationId - ID de la verificación
   * @param operatorId - ID del operador que rechaza
   * @param reason - Razón del rechazo (obligatorio)
   * 
   * Requisitos: 15.1-15.10
   */
  async rejectVerification(
    verificationId: number,
    operatorId: number,
    reason: string
  ): Promise<void> {
    // Validar que operador tenga rol 'operator' o 'admin' (Requisito 15.1)
    const operator = await User.findByPk(operatorId);
    if (!operator || (operator.role !== 'operator' && operator.role !== 'admin')) {
      throw new Error('Only operators or admins can reject verifications');
    }

    // Validar que reason sea obligatorio
    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }

    // Obtener verificación
    const verification = await this.getVerificationById(verificationId);
    if (!verification) {
      throw new Error(`Verification with id ${verificationId} not found`);
    }

    const now = new Date();

    // Actualizar verificación (Requisitos 15.1-15.4)
    await verification.update({
      status: 'rejected',
      rejectionReason: reason,
      reviewedBy: operatorId,
      reviewedAt: now
    });

    // Registrar rechazo en logs de auditoría (Requisito 32.6)
    await auditLogger.logVerificationRejected(operatorId, verification.userId, reason);

    // Registrar rechazo en KYCAttempt (Requisito 15.8)
    await KYCAttempt.create({
      verificationId,
      attemptNumber: verification.attempts + 1,
      step: 'manual_review',
      success: false,
      errorMessage: reason,
      metadata: {
        operatorId,
        action: 'rejected'
      }
    });

    // Enviar email de rechazo con razón (Requisito 15.5)
    try {
      await this.notificationService.sendRejectionEmail(verification.userId, reason);
    } catch (emailError) {
      console.error(`[KYCService] Failed to send rejection email:`, emailError);
    }

    // Mantener verificationLevel sin cambios (Requisito 15.9)
  }

  /**
   * Job diario: Verifica y marca verificaciones expiradas
   * 
   * Requisitos: 24.1-24.10
   */
  async checkExpiredVerifications(): Promise<void> {
    const now = new Date();

    // Buscar verificaciones donde expiresAt <= fecha actual y status = 'approved' (Requisito 24.2, 24.3)
    const expiredVerifications = await KYCVerification.findAll({
      where: {
        status: 'approved',
        expiresAt: {
          [Op.lte]: now
        }
      }
    });

    for (const verification of expiredVerifications) {
      // Cambiar status a 'expired' (Requisito 24.3)
      await verification.update({ status: 'expired' });

      // Reducir verificationLevel del usuario a 1 (Requisito 24.4)
      await User.update(
        { verificationLevel: 1 },
        { where: { id: verification.userId } }
      );

      // Enviar email de expiración (Requisito 24.5)
      await this.notificationService.sendExpiredEmail(verification.userId);
    }
  }

  /**
   * Renueva una verificación expirada
   * 
   * @param userId - ID del usuario
   * @returns Nueva verificación creada
   * 
   * Requisitos: 24.6-24.8
   */
  async renewVerification(userId: number): Promise<KYCVerification> {
    // Crear nuevo registro de verificación (Requisito 24.7)
    const newVerification = await this.createVerification(userId);

    // El historial de verificación anterior se mantiene automáticamente (Requisito 24.8)
    
    return newVerification;
  }

  /**
   * Registra acceso a documento encriptado por operador
   * 
   * @param operatorId - ID del operador que accede
   * @param userId - ID del usuario dueño del documento
   * @param documentType - Tipo de documento accedido
   * 
   * Requisitos: 32.7
   */
  async logDocumentAccess(
    operatorId: number,
    userId: number,
    documentType: string
  ): Promise<void> {
    await auditLogger.logDocumentAccess(operatorId, userId, documentType);
  }

  /**
   * Registra eliminación de documentos
   * 
   * @param userId - ID del usuario
   * @param reason - Razón de la eliminación
   * 
   * Requisitos: 32.8
   */
  async logDocumentDeletion(
    userId: number,
    reason: string
  ): Promise<void> {
    await auditLogger.logDocumentDeletion(userId, reason);
  }

  /**
   * Elimina todos los datos de un usuario por solicitud GDPR
   * 
   * Este método:
   * - Elimina todos los documentos físicos inmediatamente
   * - Anonimiza el registro de verificación
   * - Mantiene solo estadísticas agregadas
   * 
   * @param userId - ID del usuario
   * @param reason - Razón de la eliminación
   * 
   * Requisitos: 31.10
   */
  async deleteUserDataByRequest(
    userId: number,
    reason: string
  ): Promise<void> {
    // Obtener verificación del usuario
    const verification = await this.getVerificationByUserId(userId);
    
    if (!verification) {
      // No hay datos para eliminar
      return;
    }

    // 1. Obtener todos los documentos asociados
    const documents = await KYCDocument.findAll({
      where: { verificationId: verification.id }
    });

    // 2. Eliminar todos los archivos físicos inmediatamente (Requisito 31.10)
    for (const doc of documents) {
      try {
        // Eliminar archivo encriptado si existe
        if (doc.encryptedUrl) {
          const exists = await this.storageService.exists(doc.encryptedUrl);
          if (exists) {
            await this.storageService.delete(doc.encryptedUrl);
          }
        }
      } catch (error) {
        console.error(`Error deleting document ${doc.id}:`, error);
        // Continuar con otros documentos aunque uno falle
      }
    }

    // 3. Eliminar registros de documentos de la base de datos
    await KYCDocument.destroy({
      where: { verificationId: verification.id }
    });

    // 4. Anonimizar registro de verificación (Requisito 31.10)
    // Mantener solo estadísticas agregadas: puntuaciones, status, fechas
    await verification.update({
      // Eliminar datos personales
      fullName: undefined,
      documentNumber: undefined,
      dateOfBirth: undefined,
      nationality: undefined,
      address: undefined,
      
      // Eliminar URLs de documentos
      documentFrontUrl: undefined,
      documentBackUrl: undefined,
      selfieUrl: undefined,
      selfieWithDocumentUrl: undefined,
      livenessVideoUrl: undefined,
      proofOfAddressUrl: undefined,
      
      // Eliminar datos OCR (pueden contener información personal)
      ocrData: undefined,
      
      // Eliminar notas de revisión (pueden contener información personal)
      reviewNotes: undefined,
      rejectionReason: undefined,
      
      // Mantener estadísticas agregadas:
      // - status
      // - verificationLevel
      // - faceMatchScore
      // - livenessScore
      // - documentValidityScore
      // - fraudScore
      // - attempts
      // - createdAt, updatedAt, verifiedAt, expiresAt
    });

    // 5. Registrar eliminación en logs de auditoría (Requisito 32.8)
    await this.logDocumentDeletion(userId, reason);
  }

  /**
   * Guarda el progreso de un nivel específico del KYC
   * 
   * @param verificationId - ID de la verificación
   * @param level - Nivel (1, 2 o 3)
   * @param data - Datos del nivel a guardar
   */
  async saveLevelProgress(
    verificationId: number,
    level: number,
    data: Record<string, any>
  ): Promise<void> {
    const verification = await this.getVerificationById(verificationId);
    
    if (!verification) {
      throw new Error('Verification not found');
    }

    // Validar que el nivel sea válido
    if (![1, 2, 3].includes(level)) {
      throw new Error('Invalid level. Must be 1, 2, or 3');
    }

    // Actualizar datos del nivel correspondiente
    const updateData: any = {};
    
    if (level === 1) {
      updateData.level1Data = data;
      updateData.currentLevel = Math.max(verification.currentLevel, 1);
      if (verification.status === 'not_started') {
        updateData.status = 'level_1_in_progress';
      }
    } else if (level === 2) {
      updateData.level2Data = data;
      updateData.currentLevel = Math.max(verification.currentLevel, 2);
      if (!verification.level1CompletedAt) {
        throw new Error('Debes completar el nivel 1 antes de continuar con el nivel 2');
      }
      if (verification.status === 'level_1_completed') {
        updateData.status = 'level_2_in_progress';
      }
    } else if (level === 3) {
      updateData.level3Data = data;
      updateData.currentLevel = Math.max(verification.currentLevel, 3);
      if (!verification.level2CompletedAt) {
        throw new Error('Debes completar el nivel 2 antes de continuar con el nivel 3');
      }
      if (verification.status === 'level_2_completed') {
        updateData.status = 'level_3_in_progress';
      }
    }

    await verification.update(updateData);
  }

  /**
   * Completa un nivel del KYC y lo envía a revisión si es necesario
   * 
   * @param verificationId - ID de la verificación
   * @param level - Nivel a completar (1, 2 o 3)
   * @param data - Datos finales del nivel
   * @returns Resultado con información del nivel completado
   */
  async completeLevel(
    verificationId: number,
    level: number,
    data: Record<string, any>
  ): Promise<{
    message: string;
    status: VerificationStatus;
    currentLevel: number;
    completedAt: Date;
    requiresReview: boolean;
  }> {
    const verification = await this.getVerificationById(verificationId);
    
    if (!verification) {
      throw new Error('Verification not found');
    }

    // Validar que el nivel sea válido
    if (![1, 2, 3].includes(level)) {
      throw new Error('Invalid level. Must be 1, 2, or 3');
    }

    const now = new Date();
    const updateData: any = {};
    let message = '';
    let requiresReview = false;

    if (level === 1) {
      // Completar nivel 1
      updateData.level1Data = data;
      updateData.level1CompletedAt = now;
      updateData.status = 'level_1_completed';
      updateData.currentLevel = 1;
      message = 'Nivel 1 completado exitosamente. Puedes continuar con el nivel 2.';
      
      // Extraer datos básicos del nivel 1
      if (data.fullName) updateData.fullName = data.fullName;
      if (data.documentType) updateData.documentType = data.documentType;
      if (data.documentNumber) updateData.documentNumber = data.documentNumber;
      if (data.dateOfBirth) updateData.dateOfBirth = data.dateOfBirth;
      
    } else if (level === 2) {
      // Validar que nivel 1 esté completado
      if (!verification.level1CompletedAt) {
        throw new Error('Debes completar el nivel 1 antes de completar el nivel 2');
      }
      
      // Completar nivel 2
      updateData.level2Data = data;
      updateData.level2CompletedAt = now;
      updateData.status = 'level_2_completed';
      updateData.currentLevel = 2;
      message = 'Nivel 2 completado exitosamente. Puedes continuar con el nivel 3.';
      
      // Extraer datos adicionales del nivel 2
      if (data.nationality) updateData.nationality = data.nationality;
      if (data.address) updateData.address = data.address;
      
    } else if (level === 3) {
      // Validar que nivel 2 esté completado
      if (!verification.level2CompletedAt) {
        throw new Error('Debes completar el nivel 2 antes de completar el nivel 3');
      }
      
      // Completar nivel 3 - Este nivel requiere revisión del operador
      updateData.level3Data = data;
      updateData.level3CompletedAt = now;
      updateData.status = 'pending_review';
      updateData.currentLevel = 3;
      updateData.lastAttemptAt = now;
      updateData.attempts = verification.attempts + 1;
      message = 'Nivel 3 completado exitosamente. Tu solicitud ha sido enviada al panel de aprobaciones del operador.';
      requiresReview = true;
      
      // Notificar a operadores que hay una nueva verificación pendiente
      await this.notificationService.notifyOperatorsNewKYCPending(verification.userId);
    }

    await verification.update(updateData);

    return {
      message,
      status: updateData.status,
      currentLevel: updateData.currentLevel,
      completedAt: level === 1 ? updateData.level1CompletedAt : 
                   level === 2 ? updateData.level2CompletedAt : 
                   updateData.level3CompletedAt,
      requiresReview
    };
  }
}
