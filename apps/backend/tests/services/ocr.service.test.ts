import { OCRService } from '../../src/services/ocr.service';

/**
 * Unit tests for OCRService
 * 
 * Tests parsing methods with sample text data
 * Requisitos: 5.1-5.13, 20.1-20.13
 */

describe('OCRService', () => {
  let ocrService: OCRService;

  beforeEach(() => {
    ocrService = new OCRService();
  });

  describe('parseDocumentNumber', () => {
    it('should extract Venezuelan document number with hyphen', () => {
      const text = 'REPÚBLICA BOLIVARIANA DE VENEZUELA\nCÉDULA V-12345678\nNOMBRES: JUAN PÉREZ';
      const result = ocrService.parseDocumentNumber(text);
      expect(result).toBe('V12345678');
    });

    it('should extract Venezuelan document number without hyphen', () => {
      const text = 'CÉDULA V12345678';
      const result = ocrService.parseDocumentNumber(text);
      expect(result).toBe('V12345678');
    });

    it('should extract foreign document number', () => {
      const text = 'CÉDULA E-87654321';
      const result = ocrService.parseDocumentNumber(text);
      expect(result).toBe('E87654321');
    });

    it('should handle 7-digit document numbers', () => {
      const text = 'CÉDULA V-1234567';
      const result = ocrService.parseDocumentNumber(text);
      expect(result).toBe('V1234567');
    });

    it('should return null when no document number is found', () => {
      const text = 'SOME TEXT WITHOUT DOCUMENT NUMBER';
      const result = ocrService.parseDocumentNumber(text);
      expect(result).toBeNull();
    });

    it('should be case insensitive', () => {
      const text = 'cédula v-12345678';
      const result = ocrService.parseDocumentNumber(text);
      expect(result).toBe('V12345678');
    });
  });

  describe('parseFullName', () => {
    it('should extract full name with NOMBRES label', () => {
      const text = 'NOMBRES: JUAN CARLOS PÉREZ GONZÁLEZ';
      const result = ocrService.parseFullName(text);
      expect(result).toBe('JUAN CARLOS PÉREZ GONZÁLEZ');
    });

    it('should extract full name with NOMBRE label (singular)', () => {
      const text = 'NOMBRE: MARÍA JOSÉ RODRÍGUEZ';
      const result = ocrService.parseFullName(text);
      expect(result).toBe('MARÍA JOSÉ RODRÍGUEZ');
    });

    it('should extract full name without colon', () => {
      const text = 'NOMBRES PEDRO ANTONIO LÓPEZ';
      const result = ocrService.parseFullName(text);
      expect(result).toBe('PEDRO ANTONIO LÓPEZ');
    });

    it('should handle names with special characters', () => {
      const text = 'NOMBRES: JOSÉ MARÍA ÑOÑO GARCÍA';
      const result = ocrService.parseFullName(text);
      expect(result).toBe('JOSÉ MARÍA ÑOÑO GARCÍA');
    });

    it('should return null when no name is found', () => {
      const text = 'SOME TEXT WITHOUT NAME';
      const result = ocrService.parseFullName(text);
      expect(result).toBeNull();
    });

    it('should trim whitespace', () => {
      const text = 'NOMBRES:   JUAN PÉREZ   ';
      const result = ocrService.parseFullName(text);
      expect(result).toBe('JUAN PÉREZ');
    });
  });

  describe('parseDateOfBirth', () => {
    it('should extract date of birth in DD/MM/YYYY format', () => {
      const text = 'FECHA DE NACIMIENTO: 15/03/1990';
      const result = ocrService.parseDateOfBirth(text);
      expect(result).toEqual(new Date(1990, 2, 15)); // Month is 0-indexed
    });

    it('should extract first date found in text', () => {
      const text = 'NACIMIENTO 25/12/1985 VENCIMIENTO 25/12/2025';
      const result = ocrService.parseDateOfBirth(text);
      expect(result).toEqual(new Date(1985, 11, 25));
    });

    it('should return null when no date is found', () => {
      const text = 'NO DATE HERE';
      const result = ocrService.parseDateOfBirth(text);
      expect(result).toBeNull();
    });

    it('should return null for invalid dates', () => {
      const text = '32/13/2020'; // Invalid date
      const result = ocrService.parseDateOfBirth(text);
      expect(result).toBeNull();
    });

    it('should handle dates with leading zeros', () => {
      const text = '01/01/2000';
      const result = ocrService.parseDateOfBirth(text);
      expect(result).toEqual(new Date(2000, 0, 1));
    });
  });

  describe('parseNationality', () => {
    it('should detect Venezuelan nationality from V- prefix', () => {
      const text = 'CÉDULA V-12345678';
      const result = ocrService.parseNationality(text);
      expect(result).toBe('Venezolana');
    });

    it('should detect Venezuelan nationality from V prefix with space', () => {
      const text = 'CÉDULA V 12345678';
      const result = ocrService.parseNationality(text);
      expect(result).toBe('Venezolana');
    });

    it('should detect Venezuelan nationality from V followed by digit', () => {
      const text = 'CÉDULA V12345678';
      const result = ocrService.parseNationality(text);
      expect(result).toBe('Venezolana');
    });

    it('should detect foreign nationality from E- prefix', () => {
      const text = 'CÉDULA E-87654321';
      const result = ocrService.parseNationality(text);
      expect(result).toBe('Extranjera');
    });

    it('should detect foreign nationality from E prefix with space', () => {
      const text = 'CÉDULA E 87654321';
      const result = ocrService.parseNationality(text);
      expect(result).toBe('Extranjera');
    });

    it('should detect foreign nationality from E followed by digit', () => {
      const text = 'CÉDULA E87654321';
      const result = ocrService.parseNationality(text);
      expect(result).toBe('Extranjera');
    });

    it('should return null when no nationality indicator is found', () => {
      const text = 'NO NATIONALITY HERE';
      const result = ocrService.parseNationality(text);
      expect(result).toBeNull();
    });
  });

  describe('parseExpirationDate', () => {
    it('should extract expiration date with VENCIMIENTO label', () => {
      const text = 'VENCIMIENTO: 15/03/2025';
      const result = ocrService.parseExpirationDate(text);
      expect(result).toEqual(new Date(2025, 2, 15));
    });

    it('should extract expiration date without colon', () => {
      const text = 'VENCIMIENTO 25/12/2030';
      const result = ocrService.parseExpirationDate(text);
      expect(result).toEqual(new Date(2030, 11, 25));
    });

    it('should be case insensitive', () => {
      const text = 'vencimiento: 01/01/2028';
      const result = ocrService.parseExpirationDate(text);
      expect(result).toEqual(new Date(2028, 0, 1));
    });

    it('should return null when no expiration date is found', () => {
      const text = 'NO EXPIRATION DATE';
      const result = ocrService.parseExpirationDate(text);
      expect(result).toBeNull();
    });

    it('should return null for invalid dates', () => {
      const text = 'VENCIMIENTO: 32/13/2025';
      const result = ocrService.parseExpirationDate(text);
      expect(result).toBeNull();
    });
  });

  describe('preprocessImage', () => {
    it('should preprocess image buffer without errors', async () => {
      // Create a minimal valid image buffer (1x1 pixel PNG)
      const minimalPng = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
        0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
        0x42, 0x60, 0x82
      ]);

      const result = await ocrService.preprocessImage(minimalPng);
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
