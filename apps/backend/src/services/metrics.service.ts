import KYCVerification, { VerificationStatus } from '../models/KYCVerification';
import KYCAttempt, { AttemptStep } from '../models/KYCAttempt';
import { Op, fn, col, literal } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * MetricsService
 * 
 * Servicio para agregar y calcular métricas del sistema KYC.
 * Proporciona insights sobre rendimiento del sistema, eficiencia de operadores,
 * y tasas de éxito de los diferentes componentes de verificación.
 * 
 * Requisitos: 33.1-33.10
 */

export interface VerificationMetrics {
  averageCompletionTime: number | null; // En horas
  approvalRate: number; // Porcentaje 0-100
  rejectionRate: number; // Porcentaje 0-100
  totalVerifications: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface RejectionReasons {
  reason: string;
  count: number;
  percentage: number;
}

export interface OperatorMetrics {
  operatorId: number;
  averageReviewTime: number | null; // En horas
  totalReviews: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface PendingMetrics {
  pendingCount: number;
  oldestPendingDate: Date | null;
  averageWaitTime: number | null; // En horas
}

export interface ComponentSuccessRates {
  faceMatchSuccessRate: number; // Porcentaje 0-100
  livenessSuccessRate: number; // Porcentaje 0-100
  ocrSuccessRate: number; // Porcentaje 0-100
  totalAttempts: number;
  faceMatchSuccessCount: number;
  livenessSuccessCount: number;
  ocrSuccessCount: number;
}

export interface FraudScoreDistribution {
  range: string; // e.g., "0-10", "10-20", etc.
  count: number;
  percentage: number;
}

export interface LivenessPerformanceMetrics {
  averageProcessingTime: number | null; // En milisegundos
  averageFrameExtractionTime: number | null; // En milisegundos
  averageBlinkDetectionTime: number | null; // En milisegundos
  averageQualityAnalysisTime: number | null; // En milisegundos
  totalAnalyses: number;
  peakMemoryUsage: number | null; // En MB
}

export interface LivenessBusinessMetrics {
  averageBlinkCount: number | null;
  averageHeadMovementRange: number | null;
  averageQualityScore: number | null;
  livenessSuccessRate: number; // Porcentaje 0-100
  livenessFailureRate: number; // Porcentaje 0-100
  totalLivenessAttempts: number;
  successfulLivenessCount: number;
  failedLivenessCount: number;
  failureReasons: {
    reason: string;
    count: number;
    percentage: number;
  }[];
}

export interface AllMetrics {
  verificationMetrics: VerificationMetrics;
  rejectionReasons: RejectionReasons[];
  operatorMetrics: OperatorMetrics[];
  pendingMetrics: PendingMetrics;
  componentSuccessRates: ComponentSuccessRates;
  fraudScoreDistribution: FraudScoreDistribution[];
  livenessPerformanceMetrics?: LivenessPerformanceMetrics;
  livenessBusinessMetrics?: LivenessBusinessMetrics;
  generatedAt: Date;
}

export class MetricsService {
  /**
   * Calcula el tiempo promedio de completar verificación
   * Desde createdAt hasta verifiedAt para verificaciones aprobadas
   * 
   * Requisito: 33.1
   */
  async getAverageCompletionTime(): Promise<number | null> {
    const result = await KYCVerification.findOne({
      attributes: [
        [
          fn('AVG', 
            literal('EXTRACT(EPOCH FROM ("verifiedAt" - "createdAt")) / 3600')
          ),
          'avgHours'
        ]
      ],
      where: literal('"status" = \'approved\' AND "verifiedAt" IS NOT NULL'),
      raw: true
    }) as any;

    return result?.avgHours ? parseFloat(result.avgHours) : null;
  }

  /**
   * Calcula las tasas de aprobación y rechazo
   * 
   * Requisitos: 33.2, 33.3
   */
  async getVerificationMetrics(): Promise<VerificationMetrics> {
    const totalVerifications = await KYCVerification.count({
      where: {
        status: {
          [Op.in]: ['approved', 'rejected']
        }
      }
    });

    const approvedCount = await KYCVerification.count({
      where: { status: 'approved' }
    });

    const rejectedCount = await KYCVerification.count({
      where: { status: 'rejected' }
    });

    const approvalRate = totalVerifications > 0 
      ? (approvedCount / totalVerifications) * 100 
      : 0;

    const rejectionRate = totalVerifications > 0 
      ? (rejectedCount / totalVerifications) * 100 
      : 0;

    const averageCompletionTime = await this.getAverageCompletionTime();

    return {
      averageCompletionTime,
      approvalRate,
      rejectionRate,
      totalVerifications,
      approvedCount,
      rejectedCount
    };
  }

  /**
   * Obtiene las razones más comunes de rechazo
   * 
   * Requisito: 33.4
   */
  async getRejectionReasons(): Promise<RejectionReasons[]> {
    const totalRejected = await KYCVerification.count({
      where: literal('"status" = \'rejected\' AND "rejectionReason" IS NOT NULL')
    });

    if (totalRejected === 0) {
      return [];
    }

    const results = await KYCVerification.findAll({
      attributes: [
        'rejectionReason',
        [fn('COUNT', col('id')), 'count']
      ],
      where: literal('"status" = \'rejected\' AND "rejectionReason" IS NOT NULL'),
      group: ['rejectionReason'],
      order: [[literal('count'), 'DESC']],
      raw: true
    }) as any[];

    return results.map(result => ({
      reason: result.rejectionReason,
      count: parseInt(result.count),
      percentage: (parseInt(result.count) / totalRejected) * 100
    }));
  }

  /**
   * Calcula el tiempo promedio de revisión por operador
   * Desde que la verificación entra en pending_review hasta reviewedAt
   * 
   * Requisito: 33.5
   */
  async getOperatorMetrics(): Promise<OperatorMetrics[]> {
    const results = await KYCVerification.findAll({
      attributes: [
        'reviewedBy',
        [
          fn('AVG',
            literal('EXTRACT(EPOCH FROM ("reviewedAt" - "updatedAt")) / 3600')
          ),
          'avgReviewHours'
        ],
        [fn('COUNT', col('id')), 'totalReviews'],
        [
          fn('SUM',
            literal('CASE WHEN status = \'approved\' THEN 1 ELSE 0 END')
          ),
          'approvedCount'
        ],
        [
          fn('SUM',
            literal('CASE WHEN status = \'rejected\' THEN 1 ELSE 0 END')
          ),
          'rejectedCount'
        ]
      ],
      where: literal('"reviewedBy" IS NOT NULL AND "reviewedAt" IS NOT NULL AND "status" IN (\'approved\', \'rejected\')'),
      group: ['reviewedBy'],
      raw: true
    }) as any[];

    return results.map(result => ({
      operatorId: result.reviewedBy,
      averageReviewTime: result.avgReviewHours ? parseFloat(result.avgReviewHours) : null,
      totalReviews: parseInt(result.totalReviews),
      approvedCount: parseInt(result.approvedCount || 0),
      rejectedCount: parseInt(result.rejectedCount || 0)
    }));
  }

  /**
   * Obtiene la cantidad de verificaciones pendientes y métricas relacionadas
   * 
   * Requisito: 33.6
   */
  async getPendingMetrics(): Promise<PendingMetrics> {
    const pendingCount = await KYCVerification.count({
      where: {
        status: 'pending_review'
      }
    });

    const oldestPending = await KYCVerification.findOne({
      attributes: ['createdAt'],
      where: {
        status: 'pending_review'
      },
      order: [['createdAt', 'ASC']],
      raw: true
    }) as any;

    let averageWaitTime: number | null = null;
    if (pendingCount > 0) {
      const result = await KYCVerification.findOne({
        attributes: [
          [
            fn('AVG',
              literal('EXTRACT(EPOCH FROM (NOW() - "createdAt")) / 3600')
            ),
            'avgWaitHours'
          ]
        ],
        where: {
          status: 'pending_review'
        },
        raw: true
      }) as any;

      averageWaitTime = result?.avgWaitHours ? parseFloat(result.avgWaitHours) : null;
    }

    return {
      pendingCount,
      oldestPendingDate: oldestPending?.createdAt || null,
      averageWaitTime
    };
  }

  /**
   * Calcula las tasas de éxito de comparación facial, liveness y OCR
   * 
   * Requisitos: 33.7, 33.8, 33.9
   */
  async getComponentSuccessRates(): Promise<ComponentSuccessRates> {
    // Face match success rate
    const faceMatchAttempts = await KYCAttempt.count({
      where: { step: 'face_match' }
    });

    const faceMatchSuccessCount = await KYCAttempt.count({
      where: {
        step: 'face_match',
        success: true
      }
    });

    const faceMatchSuccessRate = faceMatchAttempts > 0
      ? (faceMatchSuccessCount / faceMatchAttempts) * 100
      : 0;

    // Liveness success rate
    const livenessAttempts = await KYCAttempt.count({
      where: { step: 'liveness' }
    });

    const livenessSuccessCount = await KYCAttempt.count({
      where: {
        step: 'liveness',
        success: true
      }
    });

    const livenessSuccessRate = livenessAttempts > 0
      ? (livenessSuccessCount / livenessAttempts) * 100
      : 0;

    // OCR success rate
    const ocrAttempts = await KYCAttempt.count({
      where: { step: 'ocr' }
    });

    const ocrSuccessCount = await KYCAttempt.count({
      where: {
        step: 'ocr',
        success: true
      }
    });

    const ocrSuccessRate = ocrAttempts > 0
      ? (ocrSuccessCount / ocrAttempts) * 100
      : 0;

    const totalAttempts = faceMatchAttempts + livenessAttempts + ocrAttempts;

    return {
      faceMatchSuccessRate,
      livenessSuccessRate,
      ocrSuccessRate,
      totalAttempts,
      faceMatchSuccessCount,
      livenessSuccessCount,
      ocrSuccessCount
    };
  }

  /**
   * Obtiene la distribución de puntuaciones de fraude
   * Agrupa las puntuaciones en rangos de 10 puntos
   * 
   * Requisito: 33.10
   */
  async getFraudScoreDistribution(): Promise<FraudScoreDistribution[]> {
    const totalWithFraudScore = await KYCVerification.count({
      where: literal('"fraudScore" IS NOT NULL')
    });

    if (totalWithFraudScore === 0) {
      return [];
    }

    // Crear rangos de 0-10, 10-20, ..., 90-100
    const ranges = [
      { min: 0, max: 10, label: '0-10' },
      { min: 10, max: 20, label: '10-20' },
      { min: 20, max: 30, label: '20-30' },
      { min: 30, max: 40, label: '30-40' },
      { min: 40, max: 50, label: '40-50' },
      { min: 50, max: 60, label: '50-60' },
      { min: 60, max: 70, label: '60-70' },
      { min: 70, max: 80, label: '70-80' },
      { min: 80, max: 90, label: '80-90' },
      { min: 90, max: 100, label: '90-100' }
    ];

    const distribution: FraudScoreDistribution[] = [];

    for (const range of ranges) {
      const count = await KYCVerification.count({
        where: {
          fraudScore: {
            [Op.gte]: range.min,
            [Op.lt]: range.max === 100 ? 101 : range.max // Incluir 100 en el último rango
          }
        }
      });

      distribution.push({
        range: range.label,
        count,
        percentage: (count / totalWithFraudScore) * 100
      });
    }

    return distribution;
  }

  /**
   * Obtiene métricas de performance de liveness detection
   * Calcula tiempos promedio de procesamiento y uso de memoria
   * 
   * Requisito: 10.2
   */
  async getLivenessPerformanceMetrics(): Promise<LivenessPerformanceMetrics> {
    // Obtener todos los intentos de liveness con metadata de performance
    const livenessAttempts = await KYCAttempt.findAll({
      attributes: ['metadata'],
      where: {
        step: 'liveness',
        metadata: {
          [Op.ne]: null as any
        }
      },
      raw: true
    }) as any[];

    if (livenessAttempts.length === 0) {
      return {
        averageProcessingTime: null,
        averageFrameExtractionTime: null,
        averageBlinkDetectionTime: null,
        averageQualityAnalysisTime: null,
        totalAnalyses: 0,
        peakMemoryUsage: null
      };
    }

    // Extraer métricas de performance de metadata
    let totalProcessingTime = 0;
    let totalFrameExtractionTime = 0;
    let totalBlinkDetectionTime = 0;
    let totalQualityAnalysisTime = 0;
    let maxMemoryUsage = 0;
    let countWithTiming = 0;

    for (const attempt of livenessAttempts) {
      const metadata = attempt.metadata;
      
      if (metadata?.performance) {
        const perf = metadata.performance;
        
        if (perf.totalProcessingTime) {
          totalProcessingTime += perf.totalProcessingTime;
          countWithTiming++;
        }
        
        if (perf.frameExtractionTime) {
          totalFrameExtractionTime += perf.frameExtractionTime;
        }
        
        if (perf.blinkDetectionTime) {
          totalBlinkDetectionTime += perf.blinkDetectionTime;
        }
        
        if (perf.qualityAnalysisTime) {
          totalQualityAnalysisTime += perf.qualityAnalysisTime;
        }
        
        if (perf.memoryUsageMB && perf.memoryUsageMB > maxMemoryUsage) {
          maxMemoryUsage = perf.memoryUsageMB;
        }
      }
    }

    return {
      averageProcessingTime: countWithTiming > 0 ? totalProcessingTime / countWithTiming : null,
      averageFrameExtractionTime: countWithTiming > 0 ? totalFrameExtractionTime / countWithTiming : null,
      averageBlinkDetectionTime: countWithTiming > 0 ? totalBlinkDetectionTime / countWithTiming : null,
      averageQualityAnalysisTime: countWithTiming > 0 ? totalQualityAnalysisTime / countWithTiming : null,
      totalAnalyses: livenessAttempts.length,
      peakMemoryUsage: maxMemoryUsage > 0 ? maxMemoryUsage : null
    };
  }

  /**
   * Obtiene métricas de negocio de liveness detection
   * Calcula promedios de parpadeos, movimiento, calidad y tasas de éxito
   * 
   * Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5
   */
  async getLivenessBusinessMetrics(): Promise<LivenessBusinessMetrics> {
    // Obtener todos los intentos de liveness
    const totalLivenessAttempts = await KYCAttempt.count({
      where: { step: 'liveness' }
    });

    const successfulLivenessCount = await KYCAttempt.count({
      where: {
        step: 'liveness',
        success: true
      }
    });

    const failedLivenessCount = totalLivenessAttempts - successfulLivenessCount;

    const livenessSuccessRate = totalLivenessAttempts > 0
      ? (successfulLivenessCount / totalLivenessAttempts) * 100
      : 0;

    const livenessFailureRate = totalLivenessAttempts > 0
      ? (failedLivenessCount / totalLivenessAttempts) * 100
      : 0;

    // Obtener intentos exitosos con metadata para calcular promedios
    const successfulAttempts = await KYCAttempt.findAll({
      attributes: ['metadata'],
      where: {
        step: 'liveness',
        success: true,
        metadata: {
          [Op.ne]: null as any
        }
      },
      raw: true
    }) as any[];

    let totalBlinkCount = 0;
    let totalHeadMovementRange = 0;
    let totalQualityScore = 0;
    let countWithMetrics = 0;

    for (const attempt of successfulAttempts) {
      const metadata = attempt.metadata;
      
      if (metadata?.blinkCount !== undefined) {
        totalBlinkCount += metadata.blinkCount;
        countWithMetrics++;
      }
      
      if (metadata?.headMovementRange !== undefined) {
        totalHeadMovementRange += metadata.headMovementRange;
      }
      
      if (metadata?.qualityScore !== undefined) {
        totalQualityScore += metadata.qualityScore;
      }
    }

    // Obtener razones de fallo
    const failedAttempts = await KYCAttempt.findAll({
      attributes: ['errorMessage'],
      where: {
        step: 'liveness',
        success: false,
        errorMessage: {
          [Op.ne]: null as any
        }
      },
      raw: true
    }) as any[];

    const failureReasonMap = new Map<string, number>();
    
    for (const attempt of failedAttempts) {
      const reason = attempt.errorMessage || 'Unknown';
      failureReasonMap.set(reason, (failureReasonMap.get(reason) || 0) + 1);
    }

    const failureReasons = Array.from(failureReasonMap.entries())
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: failedLivenessCount > 0 ? (count / failedLivenessCount) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    return {
      averageBlinkCount: countWithMetrics > 0 ? totalBlinkCount / countWithMetrics : null,
      averageHeadMovementRange: countWithMetrics > 0 ? totalHeadMovementRange / countWithMetrics : null,
      averageQualityScore: countWithMetrics > 0 ? totalQualityScore / countWithMetrics : null,
      livenessSuccessRate,
      livenessFailureRate,
      totalLivenessAttempts,
      successfulLivenessCount,
      failedLivenessCount,
      failureReasons
    };
  }

  /**
   * Obtiene todas las métricas del sistema en un solo objeto
   * Útil para dashboards y reportes completos
   */
  async getAllMetrics(): Promise<AllMetrics> {
    const [
      verificationMetrics,
      rejectionReasons,
      operatorMetrics,
      pendingMetrics,
      componentSuccessRates,
      fraudScoreDistribution,
      livenessPerformanceMetrics,
      livenessBusinessMetrics
    ] = await Promise.all([
      this.getVerificationMetrics(),
      this.getRejectionReasons(),
      this.getOperatorMetrics(),
      this.getPendingMetrics(),
      this.getComponentSuccessRates(),
      this.getFraudScoreDistribution(),
      this.getLivenessPerformanceMetrics(),
      this.getLivenessBusinessMetrics()
    ]);

    return {
      verificationMetrics,
      rejectionReasons,
      operatorMetrics,
      pendingMetrics,
      componentSuccessRates,
      fraudScoreDistribution,
      livenessPerformanceMetrics,
      livenessBusinessMetrics,
      generatedAt: new Date()
    };
  }

  /**
   * Verifica si se debe enviar alerta por cola de revisión excesiva
   * 
   * Requisito: 33.12
   */
  async shouldAlertPendingQueue(): Promise<boolean> {
    const { pendingCount } = await this.getPendingMetrics();
    return pendingCount > 100;
  }

  /**
   * Verifica si se debe enviar alerta por tasa de rechazo alta
   * Calcula la tasa de rechazo del día actual
   * 
   * Requisito: 33.13
   */
  async shouldAlertRejectionRate(): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalToday = await KYCVerification.count({
      where: {
        reviewedAt: {
          [Op.gte]: today
        },
        status: {
          [Op.in]: ['approved', 'rejected']
        }
      }
    });

    if (totalToday === 0) {
      return false;
    }

    const rejectedToday = await KYCVerification.count({
      where: {
        reviewedAt: {
          [Op.gte]: today
        },
        status: 'rejected'
      }
    });

    const rejectionRate = (rejectedToday / totalToday) * 100;
    return rejectionRate > 30;
  }
}
