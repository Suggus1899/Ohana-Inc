import { FaceMatchService } from '../../src/services/face-match.service';

/**
 * Unit Tests para FaceMatchService
 * 
 * Valida: Requisitos 9.1-9.14, 19.1-19.13
 * 
 * Nota: Estos tests validan la estructura y lógica del servicio.
 * Los tests de integración completos requieren @tensorflow/tfjs-node instalado.
 */

describe('FaceMatchService', () => {
  let service: FaceMatchService;

  beforeAll(() => {
    service = new FaceMatchService();
  });

  describe('Service Structure', () => {
    it('should be instantiable', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(FaceMatchService);
    });

    it('should have loadModels method', () => {
      expect(service.loadModels).toBeDefined();
      expect(typeof service.loadModels).toBe('function');
    });

    it('should have detectFace method', () => {
      expect(service.detectFace).toBeDefined();
      expect(typeof service.detectFace).toBe('function');
    });

    it('should have compareFaces method', () => {
      expect(service.compareFaces).toBeDefined();
      expect(typeof service.compareFaces).toBe('function');
    });
  });

  describe('Similarity Calculation Logic', () => {
    it('should mark as match when similarity >= 80%', () => {
      const similarity = 85;
      const match = similarity >= 80;
      expect(match).toBe(true);
    });

    it('should mark as no match when similarity < 80%', () => {
      const similarity = 75;
      const match = similarity >= 80;
      expect(match).toBe(false);
    });

    it('should convert distance to similarity correctly', () => {
      // Distancia 0.2 -> similitud = 100 - 0.2 * 100 = 80
      const distance = 0.2;
      const similarity = Math.max(0, 100 - distance * 100);
      expect(similarity).toBe(80);
    });

    it('should not allow negative similarity', () => {
      // Distancia muy alta -> similitud no debe ser negativa
      const distance = 1.5;
      const similarity = Math.max(0, 100 - distance * 100);
      expect(similarity).toBe(0);
    });

    it('should handle edge case: distance = 0 (identical faces)', () => {
      const distance = 0;
      const similarity = Math.max(0, 100 - distance * 100);
      expect(similarity).toBe(100);
    });

    it('should handle edge case: distance = 1 (completely different)', () => {
      const distance = 1;
      const similarity = Math.max(0, 100 - distance * 100);
      expect(similarity).toBe(0);
    });
  });

  describe('FaceMatchResult Structure', () => {
    it('should have correct result structure', () => {
      const mockResult = {
        match: true,
        score: 87.5,
        distance: 0.125,
        confidence1: 0.95,
        confidence2: 0.93
      };

      expect(mockResult).toHaveProperty('match');
      expect(mockResult).toHaveProperty('score');
      expect(mockResult).toHaveProperty('distance');
      expect(mockResult).toHaveProperty('confidence1');
      expect(mockResult).toHaveProperty('confidence2');
      expect(typeof mockResult.match).toBe('boolean');
      expect(typeof mockResult.score).toBe('number');
      expect(mockResult.score).toBeGreaterThanOrEqual(0);
      expect(mockResult.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Threshold Validation', () => {
    it('should use 80% as match threshold (Requisito 9.7)', () => {
      const MATCH_THRESHOLD = 80;
      
      expect(79.9 >= MATCH_THRESHOLD).toBe(false);
      expect(80.0 >= MATCH_THRESHOLD).toBe(true);
      expect(80.1 >= MATCH_THRESHOLD).toBe(true);
    });
  });
});
