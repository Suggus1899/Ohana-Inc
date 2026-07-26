/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests for ImageQualityValidator
 * 
 * Requirements: 29.1-29.11
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ImageQualityValidator, ValidationResult } from '../ImageQualityValidator';

describe('ImageQualityValidator', () => {
  // Mock canvas and image for testing
  let mockCanvas: any;
  let mockContext: any;
  let mockImage: any;

  beforeEach(() => {
    // Mock canvas context
    mockContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: '',
    };

    // Mock canvas
    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockContext),
      toDataURL: vi.fn(() => 'data:image/jpeg;base64,mockdata'),
    };

    // Mock document.createElement for canvas
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas as any;
      }
      return originalCreateElement(tagName);
    });

    // Mock Image constructor
    mockImage = {
      width: 0,
      height: 0,
      src: '',
      onload: null as any,
      onerror: null as any,
    };

    global.Image = class {
      width = 0;
      height = 0;
      src = '';
      onload: any = null;
      onerror: any = null;

      constructor() {
        return mockImage;
      }
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper function to simulate image load
  const simulateImageLoad = (width: number, height: number, brightness: number = 128) => {
    mockImage.width = width;
    mockImage.height = height;
    mockCanvas.width = width;
    mockCanvas.height = height;

    // Create mock image data with specified brightness
    const pixelCount = width * height;
    const dataLength = pixelCount * 4; // RGBA
    const data = new Uint8ClampedArray(dataLength);

    for (let i = 0; i < dataLength; i += 4) {
      data[i] = brightness;     // R
      data[i + 1] = brightness; // G
      data[i + 2] = brightness; // B
      data[i + 3] = 255;        // A
    }

    mockContext.getImageData.mockReturnValue({ data, width, height });

    // Trigger onload after a short delay
    setTimeout(() => {
      if (mockImage.onload) {
        mockImage.onload();
      }
    }, 0);
  };

  // Helper function to simulate image error
  const simulateImageError = () => {
    setTimeout(() => {
      if (mockImage.onerror) {
        mockImage.onerror();
      }
    }, 0);
  };

  describe('validateResolution', () => {
    it('should accept image with resolution 800x600', async () => {
      simulateImageLoad(800, 600);
      const result = await ImageQualityValidator.validateResolution('data:image/jpeg;base64,test');
      
      expect(result.isValid).toBe(true);
      expect(result.message).toContain('800x600');
      expect(result.value).toBe(800 * 600);
    });

    it('should accept image with resolution greater than 800x600', async () => {
      simulateImageLoad(1920, 1080);
      const result = await ImageQualityValidator.validateResolution('data:image/jpeg;base64,test');
      
      expect(result.isValid).toBe(true);
      expect(result.message).toContain('1920x1080');
      expect(result.value).toBe(1920 * 1080);
    });

    it('should reject image with resolution 640x480', async () => {
      simulateImageLoad(640, 480);
      const result = await ImageQualityValidator.validateResolution('data:image/jpeg;base64,test');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('640x480');
      expect(result.message).toContain('too low');
      expect(result.value).toBe(640 * 480);
    });

    it('should reject image with width below minimum', async () => {
      simulateImageLoad(700, 600);
      const result = await ImageQualityValidator.validateResolution('data:image/jpeg;base64,test');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('700x600');
    });

    it('should reject image with height below minimum', async () => {
      simulateImageLoad(800, 500);
      const result = await ImageQualityValidator.validateResolution('data:image/jpeg;base64,test');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('800x500');
    });

    it('should handle invalid image data', async () => {
      simulateImageError();
      const result = await ImageQualityValidator.validateResolution('invalid-data');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Error');
      expect(result.value).toBe(0);
    });
  });

  describe('validateBrightness', () => {
    it('should accept image with brightness 100', async () => {
      simulateImageLoad(800, 600, 100);
      const result = await ImageQualityValidator.validateBrightness('data:image/jpeg;base64,test');
      
      expect(result.isValid).toBe(true);
      expect(result.message).toContain('valid');
      expect(result.value).toBeGreaterThanOrEqual(50);
      expect(result.value).toBeLessThanOrEqual(200);
    });

    it('should accept image with brightness at minimum threshold (50)', async () => {
      simulateImageLoad(800, 600, 50);
      const result = await ImageQualityValidator.validateBrightness('data:image/jpeg;base64,test');
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBeGreaterThanOrEqual(50);
    });

    it('should accept image with brightness at maximum threshold (200)', async () => {
      simulateImageLoad(800, 600, 200);
      const result = await ImageQualityValidator.validateBrightness('data:image/jpeg;base64,test');
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBeLessThanOrEqual(200);
    });

    it('should reject image with brightness 30 (too dark)', async () => {
      simulateImageLoad(800, 600, 30);
      const result = await ImageQualityValidator.validateBrightness('data:image/jpeg;base64,test');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('too dark');
      expect(result.value).toBeLessThan(50);
    });

    it('should reject image with brightness 220 (too bright)', async () => {
      simulateImageLoad(800, 600, 220);
      const result = await ImageQualityValidator.validateBrightness('data:image/jpeg;base64,test');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('too bright');
      expect(result.value).toBeGreaterThan(200);
    });

    it('should handle invalid image data', async () => {
      simulateImageError();
      const result = await ImageQualityValidator.validateBrightness('invalid-data');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Error');
      expect(result.value).toBe(0);
    });
  });

  describe('calculateBrightness', () => {
    it('should calculate brightness correctly for gray image', async () => {
      simulateImageLoad(800, 600, 128);
      const brightness = await ImageQualityValidator.calculateBrightness('data:image/jpeg;base64,test');
      
      // Should be close to 128 (allowing for floating point precision)
      expect(brightness).toBeCloseTo(128, 1);
    });

    it('should calculate low brightness for dark image', async () => {
      simulateImageLoad(800, 600, 30);
      const brightness = await ImageQualityValidator.calculateBrightness('data:image/jpeg;base64,test');
      
      expect(brightness).toBe(30);
    });

    it('should calculate high brightness for bright image', async () => {
      simulateImageLoad(800, 600, 220);
      const brightness = await ImageQualityValidator.calculateBrightness('data:image/jpeg;base64,test');
      
      expect(brightness).toBe(220);
    });

    it('should reject invalid image data', async () => {
      simulateImageError();
      
      await expect(
        ImageQualityValidator.calculateBrightness('invalid-data')
      ).rejects.toThrow();
    });
  });

  describe('getImageDimensions', () => {
    it('should return correct dimensions for 800x600 image', async () => {
      simulateImageLoad(800, 600);
      const dimensions = await ImageQualityValidator.getImageDimensions('data:image/jpeg;base64,test');
      
      expect(dimensions.width).toBe(800);
      expect(dimensions.height).toBe(600);
    });

    it('should return correct dimensions for 1920x1080 image', async () => {
      simulateImageLoad(1920, 1080);
      const dimensions = await ImageQualityValidator.getImageDimensions('data:image/jpeg;base64,test');
      
      expect(dimensions.width).toBe(1920);
      expect(dimensions.height).toBe(1080);
    });

    it('should reject invalid image data', async () => {
      simulateImageError();
      
      await expect(
        ImageQualityValidator.getImageDimensions('invalid-data')
      ).rejects.toThrow('Failed to load image');
    });
  });

  describe('validateAll', () => {
    it('should return all validations passed for valid image', async () => {
      // validateAll calls validateResolution and validateBrightness
      // Each creates a new Image, so we need to simulate load twice
      const callCount = 0;
      const originalImage = global.Image;
      
      global.Image = class {
        width = 0;
        height = 0;
        src = '';
        onload: any = null;
        onerror: any = null;

        constructor() {
          const img = {
            width: 800,
            height: 600,
            src: '',
            onload: null as any,
            onerror: null as any,
          };
          
          setTimeout(() => {
            if (img.onload) {
              mockImage.width = 800;
              mockImage.height = 600;
              mockCanvas.width = 800;
              mockCanvas.height = 600;
              
              const pixelCount = 800 * 600;
              const dataLength = pixelCount * 4;
              const data = new Uint8ClampedArray(dataLength);
              for (let i = 0; i < dataLength; i += 4) {
                data[i] = 100; data[i + 1] = 100; data[i + 2] = 100; data[i + 3] = 255;
              }
              mockContext.getImageData.mockReturnValue({ data, width: 800, height: 600 });
              
              img.onload();
            }
          }, 0);
          
          return img as any;
        }
      } as any;
      
      const results = await ImageQualityValidator.validateAll('data:image/jpeg;base64,test');
      
      global.Image = originalImage;
      
      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(true); // resolution
      expect(results[1].isValid).toBe(true); // brightness
    });

    it('should return failed resolution validation for small image', async () => {
      const originalImage = global.Image;
      
      global.Image = class {
        width = 0;
        height = 0;
        src = '';
        onload: any = null;
        onerror: any = null;

        constructor() {
          const img = {
            width: 640,
            height: 480,
            src: '',
            onload: null as any,
            onerror: null as any,
          };
          
          setTimeout(() => {
            if (img.onload) {
              mockImage.width = 640;
              mockImage.height = 480;
              mockCanvas.width = 640;
              mockCanvas.height = 480;
              
              const pixelCount = 640 * 480;
              const dataLength = pixelCount * 4;
              const data = new Uint8ClampedArray(dataLength);
              for (let i = 0; i < dataLength; i += 4) {
                data[i] = 100; data[i + 1] = 100; data[i + 2] = 100; data[i + 3] = 255;
              }
              mockContext.getImageData.mockReturnValue({ data, width: 640, height: 480 });
              
              img.onload();
            }
          }, 0);
          
          return img as any;
        }
      } as any;
      
      const results = await ImageQualityValidator.validateAll('data:image/jpeg;base64,test');
      
      global.Image = originalImage;
      
      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(false); // resolution
      expect(results[1].isValid).toBe(true);  // brightness
    });

    it('should return failed brightness validation for dark image', async () => {
      const originalImage = global.Image;
      
      global.Image = class {
        width = 0;
        height = 0;
        src = '';
        onload: any = null;
        onerror: any = null;

        constructor() {
          const img = {
            width: 800,
            height: 600,
            src: '',
            onload: null as any,
            onerror: null as any,
          };
          
          setTimeout(() => {
            if (img.onload) {
              mockImage.width = 800;
              mockImage.height = 600;
              mockCanvas.width = 800;
              mockCanvas.height = 600;
              
              const pixelCount = 800 * 600;
              const dataLength = pixelCount * 4;
              const data = new Uint8ClampedArray(dataLength);
              for (let i = 0; i < dataLength; i += 4) {
                data[i] = 30; data[i + 1] = 30; data[i + 2] = 30; data[i + 3] = 255;
              }
              mockContext.getImageData.mockReturnValue({ data, width: 800, height: 600 });
              
              img.onload();
            }
          }, 0);
          
          return img as any;
        }
      } as any;
      
      const results = await ImageQualityValidator.validateAll('data:image/jpeg;base64,test');
      
      global.Image = originalImage;
      
      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(true);  // resolution
      expect(results[1].isValid).toBe(false); // brightness
    });

    it('should return all validations failed for invalid image', async () => {
      const originalImage = global.Image;
      
      global.Image = class {
        width = 0;
        height = 0;
        src = '';
        onload: any = null;
        onerror: any = null;

        constructor() {
          const img = {
            width: 640,
            height: 480,
            src: '',
            onload: null as any,
            onerror: null as any,
          };
          
          setTimeout(() => {
            if (img.onload) {
              mockImage.width = 640;
              mockImage.height = 480;
              mockCanvas.width = 640;
              mockCanvas.height = 480;
              
              const pixelCount = 640 * 480;
              const dataLength = pixelCount * 4;
              const data = new Uint8ClampedArray(dataLength);
              for (let i = 0; i < dataLength; i += 4) {
                data[i] = 30; data[i + 1] = 30; data[i + 2] = 30; data[i + 3] = 255;
              }
              mockContext.getImageData.mockReturnValue({ data, width: 640, height: 480 });
              
              img.onload();
            }
          }, 0);
          
          return img as any;
        }
      } as any;
      
      const results = await ImageQualityValidator.validateAll('data:image/jpeg;base64,test');
      
      global.Image = originalImage;
      
      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(false); // resolution
      expect(results[1].isValid).toBe(false); // brightness
    });
  });

  describe('allValidationsPassed', () => {
    it('should return true when all validations pass', () => {
      const results: ValidationResult[] = [
        { isValid: true, message: 'Resolution valid', value: 480000 },
        { isValid: true, message: 'Brightness valid', value: 100 }
      ];
      
      expect(ImageQualityValidator.allValidationsPassed(results)).toBe(true);
    });

    it('should return false when one validation fails', () => {
      const results: ValidationResult[] = [
        { isValid: true, message: 'Resolution valid', value: 480000 },
        { isValid: false, message: 'Brightness too low', value: 30 }
      ];
      
      expect(ImageQualityValidator.allValidationsPassed(results)).toBe(false);
    });

    it('should return false when all validations fail', () => {
      const results: ValidationResult[] = [
        { isValid: false, message: 'Resolution too low', value: 307200 },
        { isValid: false, message: 'Brightness too low', value: 30 }
      ];
      
      expect(ImageQualityValidator.allValidationsPassed(results)).toBe(false);
    });
  });

  describe('getErrorMessages', () => {
    it('should return empty array when all validations pass', () => {
      const results: ValidationResult[] = [
        { isValid: true, message: 'Resolution valid', value: 480000 },
        { isValid: true, message: 'Brightness valid', value: 100 }
      ];
      
      const errors = ImageQualityValidator.getErrorMessages(results);
      expect(errors).toHaveLength(0);
    });

    it('should return error messages for failed validations', () => {
      const results: ValidationResult[] = [
        { isValid: false, message: 'Resolution too low', value: 307200 },
        { isValid: false, message: 'Brightness too low', value: 30 }
      ];
      
      const errors = ImageQualityValidator.getErrorMessages(results);
      expect(errors).toHaveLength(2);
      expect(errors[0]).toBe('Resolution too low');
      expect(errors[1]).toBe('Brightness too low');
    });

    it('should return only failed validation messages', () => {
      const results: ValidationResult[] = [
        { isValid: true, message: 'Resolution valid', value: 480000 },
        { isValid: false, message: 'Brightness too low', value: 30 }
      ];
      
      const errors = ImageQualityValidator.getErrorMessages(results);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBe('Brightness too low');
    });
  });
});
