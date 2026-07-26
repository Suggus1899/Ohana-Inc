/**
 * ImageQualityValidator
 * 
 * Utility class for validating image quality in the KYC verification process.
 * Validates resolution and brightness to ensure captured images meet minimum requirements.
 * 
 * Requirements: 4.3-4.6, 29.1-29.11
 */

export interface ValidationResult {
  isValid: boolean;
  message: string;
  value?: number;
}

export class ImageQualityValidator {
  // Minimum resolution requirements
  private static readonly MIN_WIDTH = 800;
  private static readonly MIN_HEIGHT = 600;
  
  // Brightness range (0-255 scale)
  private static readonly MIN_BRIGHTNESS = 50;
  private static readonly MAX_BRIGHTNESS = 200;

  /**
   * Validates that image resolution meets minimum requirements (>= 800x600)
   * Requirement 4.3: Validate minimum resolution
   * 
   * @param imageData - Base64 encoded image data or data URL
   * @returns ValidationResult with isValid, message, and dimensions
   */
  static async validateResolution(imageData: string): Promise<ValidationResult> {
    try {
      const dimensions = await this.getImageDimensions(imageData);
      
      if (dimensions.width >= this.MIN_WIDTH && dimensions.height >= this.MIN_HEIGHT) {
        return {
          isValid: true,
          message: `Resolution is valid: ${dimensions.width}x${dimensions.height}`,
          value: dimensions.width * dimensions.height
        };
      }
      
      return {
        isValid: false,
        message: `Resolution too low: ${dimensions.width}x${dimensions.height}. Minimum required: ${this.MIN_WIDTH}x${this.MIN_HEIGHT}`,
        value: dimensions.width * dimensions.height
      };
    } catch (error) {
      return {
        isValid: false,
        message: `Error validating resolution: ${error instanceof Error ? error.message : 'Unknown error'}`,
        value: 0
      };
    }
  }

  /**
   * Validates that image brightness is within acceptable range [50, 200]
   * Requirement 4.5: Validate brightness range
   * 
   * @param imageData - Base64 encoded image data or data URL
   * @returns ValidationResult with isValid, message, and brightness value
   */
  static async validateBrightness(imageData: string): Promise<ValidationResult> {
    try {
      const brightness = await this.calculateBrightness(imageData);
      
      if (brightness < this.MIN_BRIGHTNESS) {
        return {
          isValid: false,
          message: `Image is too dark: brightness ${brightness.toFixed(1)}. Minimum required: ${this.MIN_BRIGHTNESS}`,
          value: brightness
        };
      }
      
      if (brightness > this.MAX_BRIGHTNESS) {
        return {
          isValid: false,
          message: `Image is too bright: brightness ${brightness.toFixed(1)}. Maximum allowed: ${this.MAX_BRIGHTNESS}`,
          value: brightness
        };
      }
      
      return {
        isValid: true,
        message: `Brightness is valid: ${brightness.toFixed(1)}`,
        value: brightness
      };
    } catch (error) {
      return {
        isValid: false,
        message: `Error validating brightness: ${error instanceof Error ? error.message : 'Unknown error'}`,
        value: 0
      };
    }
  }

  /**
   * Calculates average brightness of an image using canvas API
   * Requirement 4.5: Calculate brightness using canvas API
   * 
   * @param imageData - Base64 encoded image data or data URL
   * @returns Average brightness value (0-255)
   */
  static async calculateBrightness(imageData: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Create canvas and get 2D context
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas 2D context'));
            return;
          }
          
          // Set canvas dimensions to match image
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image on canvas
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageDataObj.data;
          
          // Calculate average brightness
          // data array contains [r, g, b, a, r, g, b, a, ...]
          let totalBrightness = 0;
          const pixelCount = data.length / 4;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Calculate perceived brightness using luminance formula
            // https://en.wikipedia.org/wiki/Relative_luminance
            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
            totalBrightness += brightness;
          }
          
          const averageBrightness = totalBrightness / pixelCount;
          resolve(averageBrightness);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Set image source
      img.src = imageData;
    });
  }

  /**
   * Gets image dimensions (width and height)
   * Requirement 4.3: Get image dimensions for validation
   * 
   * @param imageData - Base64 encoded image data or data URL
   * @returns Object with width and height properties
   */
  static async getImageDimensions(imageData: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        });
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = imageData;
    });
  }

  /**
   * Validates all quality checks (resolution and brightness)
   * Requirement 4.3-4.6: Execute all validations
   * 
   * @param imageData - Base64 encoded image data or data URL
   * @returns Array of ValidationResult for each check
   */
  static async validateAll(imageData: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    // Validate resolution
    const resolutionResult = await this.validateResolution(imageData);
    results.push(resolutionResult);
    
    // Validate brightness
    const brightnessResult = await this.validateBrightness(imageData);
    results.push(brightnessResult);
    
    return results;
  }

  /**
   * Helper method to check if all validations passed
   * 
   * @param results - Array of ValidationResult from validateAll
   * @returns true if all validations passed, false otherwise
   */
  static allValidationsPassed(results: ValidationResult[]): boolean {
    return results.every(result => result.isValid);
  }

  /**
   * Helper method to get all error messages from failed validations
   * 
   * @param results - Array of ValidationResult from validateAll
   * @returns Array of error messages
   */
  static getErrorMessages(results: ValidationResult[]): string[] {
    return results
      .filter(result => !result.isValid)
      .map(result => result.message);
  }
}
