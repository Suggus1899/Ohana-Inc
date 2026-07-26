/**
 * Task 8 Verification Tests
 * 
 * Tests to verify that OCR and Face Match services properly handle error codes
 */

import { OCRService } from '../ocr.service';
import { FaceMatchService } from '../face-match.service';

describe('Task 8: OCR and Face Match Error Handling', () => {
  describe('OCR Service - UNDERAGE Error', () => {
    it('should throw error with UNDERAGE code when age < 18', async () => {
      const ocrService = new OCRService();
      
      // Mock a date of birth that results in age < 18
      const today = new Date();
      const underageDate = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
      
      // Mock the parseDateOfBirth to return underage date
      jest.spyOn(ocrService as any, 'parseDateOfBirth').mockReturnValue(underageDate);
      jest.spyOn(ocrService as any, 'parseDocumentNumber').mockReturnValue('V12345678');
      jest.spyOn(ocrService as any, 'parseFullName').mockReturnValue('Test User');
      jest.spyOn(ocrService as any, 'parseNationality').mockReturnValue('Venezolana');
      jest.spyOn(ocrService as any, 'parseExpirationDate').mockReturnValue(new Date(2030, 0, 1));
      jest.spyOn(ocrService as any, 'preprocessImage').mockResolvedValue(Buffer.from('test'));
      
      // Mock Tesseract
      const mockTesseract = {
        recognize: jest.fn().mockResolvedValue({
          data: {
            text: 'V-12345678\nNOMBRES: TEST USER\n01/01/2007',
            confidence: 85
          }
        })
      };
      jest.mock('tesseract.js', () => mockTesseract);
      
      try {
        await ocrService.extractData(Buffer.from('front'), Buffer.from('back'));
        fail('Should have thrown UNDERAGE error');
      } catch (error: any) {
        expect(error.code).toBe('UNDERAGE');
        expect(error.message).toContain('mayor de 18 años');
      }
    });
  });

  describe('Face Match Service - MODELS_NOT_FOUND Error', () => {
    it('should throw error with MODELS_NOT_FOUND code when models cannot be loaded', async () => {
      const faceMatchService = new FaceMatchService();
      
      // Force model loading to fail by using invalid path
      (faceMatchService as any).MODEL_PATH = '/invalid/path/to/models';
      
      try {
        await faceMatchService.loadModels();
        fail('Should have thrown MODELS_NOT_FOUND error');
      } catch (error: any) {
        expect(error.code).toBe('MODELS_NOT_FOUND');
        expect(error.message).toContain('Failed to load face-api.js models');
      }
    });
  });
});
