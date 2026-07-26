import { MetricsService } from '../../src/services/metrics.service';
import KYCVerification from '../../src/models/KYCVerification';
import KYCAttempt from '../../src/models/KYCAttempt';

// Mock the models
jest.mock('../../src/models/KYCVerification');
jest.mock('../../src/models/KYCAttempt');

describe('MetricsService', () => {
  let metricsService: MetricsService;

  beforeEach(() => {
    metricsService = new MetricsService();
    jest.clearAllMocks();
  });

  describe('getAverageCompletionTime', () => {
    it('should return average completion time in hours', async () => {
      const mockResult = { avgHours: '24.5' };
      (KYCVerification.findOne as jest.Mock).mockResolvedValue(mockResult);

      const result = await metricsService.getAverageCompletionTime();

      expect(result).toBe(24.5);
      expect(KYCVerification.findOne).toHaveBeenCalled();
    });

    it('should return null when no approved verifications exist', async () => {
      (KYCVerification.findOne as jest.Mock).mockResolvedValue(null);

      const result = await metricsService.getAverageCompletionTime();

      expect(result).toBeNull();
    });
  });

  describe('getVerificationMetrics', () => {
    it('should calculate approval and rejection rates correctly', async () => {
      (KYCVerification.count as jest.Mock)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(70)  // approved
        .mockResolvedValueOnce(30); // rejected

      (KYCVerification.findOne as jest.Mock).mockResolvedValue({ avgHours: '12.0' });

      const result = await metricsService.getVerificationMetrics();

      expect(result.totalVerifications).toBe(100);
      expect(result.approvedCount).toBe(70);
      expect(result.rejectedCount).toBe(30);
      expect(result.approvalRate).toBe(70);
      expect(result.rejectionRate).toBe(30);
      expect(result.averageCompletionTime).toBe(12.0);
    });

    it('should handle zero verifications', async () => {
      (KYCVerification.count as jest.Mock).mockResolvedValue(0);
      (KYCVerification.findOne as jest.Mock).mockResolvedValue(null);

      const result = await metricsService.getVerificationMetrics();

      expect(result.totalVerifications).toBe(0);
      expect(result.approvalRate).toBe(0);
      expect(result.rejectionRate).toBe(0);
    });
  });

  describe('getRejectionReasons', () => {
    it('should return rejection reasons with counts and percentages', async () => {
      (KYCVerification.count as jest.Mock).mockResolvedValue(100);
      (KYCVerification.findAll as jest.Mock).mockResolvedValue([
        { rejectionReason: 'Documento ilegible', count: '40' },
        { rejectionReason: 'Foto borrosa', count: '35' },
        { rejectionReason: 'Documento vencido', count: '25' }
      ]);

      const result = await metricsService.getRejectionReasons();

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        reason: 'Documento ilegible',
        count: 40,
        percentage: 40
      });
      expect(result[1]).toEqual({
        reason: 'Foto borrosa',
        count: 35,
        percentage: 35
      });
    });

    it('should return empty array when no rejections exist', async () => {
      (KYCVerification.count as jest.Mock).mockResolvedValue(0);

      const result = await metricsService.getRejectionReasons();

      expect(result).toEqual([]);
    });
  });

  describe('getPendingMetrics', () => {
    it('should return pending count and oldest pending date', async () => {
      const oldDate = new Date('2024-01-01');
      (KYCVerification.count as jest.Mock).mockResolvedValue(50);
      (KYCVerification.findOne as jest.Mock)
        .mockResolvedValueOnce({ createdAt: oldDate })
        .mockResolvedValueOnce({ avgWaitHours: '48.5' });

      const result = await metricsService.getPendingMetrics();

      expect(result.pendingCount).toBe(50);
      expect(result.oldestPendingDate).toEqual(oldDate);
      expect(result.averageWaitTime).toBe(48.5);
    });

    it('should handle no pending verifications', async () => {
      (KYCVerification.count as jest.Mock).mockResolvedValue(0);
      (KYCVerification.findOne as jest.Mock).mockResolvedValue(null);

      const result = await metricsService.getPendingMetrics();

      expect(result.pendingCount).toBe(0);
      expect(result.oldestPendingDate).toBeNull();
      expect(result.averageWaitTime).toBeNull();
    });
  });

  describe('getComponentSuccessRates', () => {
    it('should calculate success rates for all components', async () => {
      // Mock face match attempts
      (KYCAttempt.count as jest.Mock)
        .mockResolvedValueOnce(100) // face_match total
        .mockResolvedValueOnce(85)  // face_match success
        .mockResolvedValueOnce(100) // liveness total
        .mockResolvedValueOnce(90)  // liveness success
        .mockResolvedValueOnce(100) // ocr total
        .mockResolvedValueOnce(95); // ocr success

      const result = await metricsService.getComponentSuccessRates();

      expect(result.faceMatchSuccessRate).toBe(85);
      expect(result.livenessSuccessRate).toBe(90);
      expect(result.ocrSuccessRate).toBe(95);
      expect(result.totalAttempts).toBe(300);
      expect(result.faceMatchSuccessCount).toBe(85);
      expect(result.livenessSuccessCount).toBe(90);
      expect(result.ocrSuccessCount).toBe(95);
    });

    it('should handle zero attempts', async () => {
      (KYCAttempt.count as jest.Mock).mockResolvedValue(0);

      const result = await metricsService.getComponentSuccessRates();

      expect(result.faceMatchSuccessRate).toBe(0);
      expect(result.livenessSuccessRate).toBe(0);
      expect(result.ocrSuccessRate).toBe(0);
      expect(result.totalAttempts).toBe(0);
    });
  });

  describe('getFraudScoreDistribution', () => {
    it('should return distribution across score ranges', async () => {
      (KYCVerification.count as jest.Mock)
        .mockResolvedValueOnce(100) // total with fraud score
        .mockResolvedValueOnce(10)  // 0-10
        .mockResolvedValueOnce(15)  // 10-20
        .mockResolvedValueOnce(20)  // 20-30
        .mockResolvedValueOnce(25)  // 30-40
        .mockResolvedValueOnce(15)  // 40-50
        .mockResolvedValueOnce(10)  // 50-60
        .mockResolvedValueOnce(3)   // 60-70
        .mockResolvedValueOnce(1)   // 70-80
        .mockResolvedValueOnce(1)   // 80-90
        .mockResolvedValueOnce(0);  // 90-100

      const result = await metricsService.getFraudScoreDistribution();

      expect(result).toHaveLength(10);
      expect(result[0]).toEqual({
        range: '0-10',
        count: 10,
        percentage: 10
      });
      expect(result[3]).toEqual({
        range: '30-40',
        count: 25,
        percentage: 25
      });
    });

    it('should return empty array when no fraud scores exist', async () => {
      (KYCVerification.count as jest.Mock).mockResolvedValue(0);

      const result = await metricsService.getFraudScoreDistribution();

      expect(result).toEqual([]);
    });
  });

  describe('shouldAlertPendingQueue', () => {
    it('should return true when pending count exceeds 100', async () => {
      (KYCVerification.count as jest.Mock).mockResolvedValue(150);
      (KYCVerification.findOne as jest.Mock).mockResolvedValue(null);

      const result = await metricsService.shouldAlertPendingQueue();

      expect(result).toBe(true);
    });

    it('should return false when pending count is 100 or less', async () => {
      (KYCVerification.count as jest.Mock).mockResolvedValue(100);
      (KYCVerification.findOne as jest.Mock).mockResolvedValue(null);

      const result = await metricsService.shouldAlertPendingQueue();

      expect(result).toBe(false);
    });
  });

  describe('shouldAlertRejectionRate', () => {
    it('should return true when rejection rate exceeds 30%', async () => {
      (KYCVerification.count as jest.Mock)
        .mockResolvedValueOnce(100) // total today
        .mockResolvedValueOnce(35); // rejected today

      const result = await metricsService.shouldAlertRejectionRate();

      expect(result).toBe(true);
    });

    it('should return false when rejection rate is 30% or less', async () => {
      (KYCVerification.count as jest.Mock)
        .mockResolvedValueOnce(100) // total today
        .mockResolvedValueOnce(30); // rejected today

      const result = await metricsService.shouldAlertRejectionRate();

      expect(result).toBe(false);
    });

    it('should return false when no verifications today', async () => {
      (KYCVerification.count as jest.Mock).mockResolvedValue(0);

      const result = await metricsService.shouldAlertRejectionRate();

      expect(result).toBe(false);
    });
  });

  describe('getAllMetrics', () => {
    it('should return all metrics in a single object', async () => {
      // Mock all the individual metric methods
      (KYCVerification.count as jest.Mock).mockResolvedValue(100);
      (KYCVerification.findOne as jest.Mock).mockResolvedValue({ avgHours: '24.0' });
      (KYCVerification.findAll as jest.Mock).mockResolvedValue([]);
      (KYCAttempt.count as jest.Mock).mockResolvedValue(0);

      const result = await metricsService.getAllMetrics();

      expect(result).toHaveProperty('verificationMetrics');
      expect(result).toHaveProperty('rejectionReasons');
      expect(result).toHaveProperty('operatorMetrics');
      expect(result).toHaveProperty('pendingMetrics');
      expect(result).toHaveProperty('componentSuccessRates');
      expect(result).toHaveProperty('fraudScoreDistribution');
      expect(result).toHaveProperty('generatedAt');
      expect(result.generatedAt).toBeInstanceOf(Date);
    });
  });
});
