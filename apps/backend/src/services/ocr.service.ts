import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { auditLogger } from './audit-logger.service';
import { DependencyError, LivenessValidationError, LivenessProcessingError } from '../errors/liveness-errors';

/**
 * OCRService
 *
 * Servicio de extracción de texto usando Tesseract OCR para documentos de identidad colombianos.
 * Implementa preprocesamiento de imágenes con sharp y parsing de campos específicos con regex.
 *
 * Requisitos: 5.1-5.13, 20.1-20.13
 */

export interface OCRData {
  documentNumber: string;
  fullName: string;
  dateOfBirth: Date | null;
  nationality: 'Colombiana' | 'Extranjera' | null;
  expirationDate: Date | null;
  rawText: string;
  confidence: number;
  validationIssues: string[];
}

export class OCRService {
  /**
   * Preprocesa imagen para mejorar calidad de OCR
   * Aplica: escala de grises, normalización y enfoque
   * 
   * @param imageBuffer - Buffer de imagen a preprocesar
   * @returns Buffer de imagen preprocesada
   * 
   * Requisitos: 5.2, 20.3
   */
  async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    return sharp(imageBuffer)
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();
  }

  /**
   * Extrae datos de documentos de identidad (frente y reverso)
   * Usa Tesseract OCR con idioma español y parsea campos específicos
   * 
   * @param frontImage - Buffer de imagen del frente del documento
   * @param backImage - Buffer de imagen del reverso del documento
   * @returns Objeto OCRData con datos extraídos
   * 
   * Requisitos: 5.1-5.13, 20.1-20.12
   */
  async extractData(frontImage: Buffer, backImage: Buffer): Promise<OCRData> {
    try {
      // Preprocesar imágenes (Requisito 5.2, 20.3)
      const preprocessedFront = await this.preprocessImage(frontImage);
      const preprocessedBack = await this.preprocessImage(backImage);

      // Aplicar Tesseract.recognize con idioma español (Requisito 20.1, 20.2, 20.4, 7.2)
      let frontResult, backResult;
      try {
        [frontResult, backResult] = await Promise.all([
          Tesseract.recognize(preprocessedFront, 'spa', {
            logger: (m) => console.log('[OCR Front]', m)
          }),
          Tesseract.recognize(preprocessedBack, 'spa', {
            logger: (m) => console.log('[OCR Back]', m)
          })
        ]);
      } catch (tesseractError) {
        // Lanzar error con código OCR_INITIALIZATION_FAILED (Requisito 7.2)
        throw DependencyError.ocrInitializationFailed(
          tesseractError instanceof Error ? tesseractError : undefined
        );
      }

      const frontText = frontResult.data.text;
      const backText = backResult.data.text;
      const combinedText = `${frontText}\n${backText}`;

      // Parsear campos específicos con regex (Requisitos 5.3-5.7, 20.7-20.9)
      const documentNumber = this.parseDocumentNumber(combinedText);
      const fullName = this.parseFullName(frontText);
      const dateOfBirth = this.parseDateOfBirth(frontText);
      const nationality = this.parseNationality(combinedText);
      const expirationDate = this.parseExpirationDate(backText);

      // Validar campos extraídos y registrar issues (Requisito 5.8, 20.11)
      const validationIssues: string[] = [];
      
      if (!documentNumber) {
        validationIssues.push('no_detectado: número de cédula');
      } else {
        // Validar patrón de número de cédula colombiana (CC: 6-10 dígitos, CE: CE + dígitos)
        const documentPattern = /^(CC|CE)?\d{6,10}$/i;
        if (!documentPattern.test(documentNumber)) {
          validationIssues.push('formato_invalido: número de cédula no cumple patrón ^(CC|CE)?\\d{6,10}$');
        }
      }

      if (!fullName) {
        validationIssues.push('no_detectado: nombre completo');
      }

      if (!dateOfBirth) {
        validationIssues.push('no_detectado: fecha de nacimiento');
      } else {
        // Validar edad mínima de 18 años (Requisito 5.12, 7.5, 7.6)
        const age = this.calculateAge(dateOfBirth);
        if (age < 18) {
          // Lanzar error con código UNDERAGE (Requisito 7.6)
          throw LivenessValidationError.underage(age);
        }
      }

      if (!nationality) {
        validationIssues.push('no_detectado: nacionalidad');
      }

      if (!expirationDate) {
        validationIssues.push('no_detectado: fecha de vencimiento');
      }

      // Calcular confianza promedio
      const confidence = (frontResult.data.confidence + backResult.data.confidence) / 2;

      return {
        documentNumber: documentNumber || '',
        fullName: fullName || '',
        dateOfBirth,
        nationality,
        expirationDate,
        rawText: combinedText,
        confidence,
        validationIssues
      };
    } catch (error) {
      // Si es un error conocido (LivenessValidationError, DependencyError), propagarlo
      if (error instanceof LivenessValidationError || error instanceof DependencyError) {
        throw error;
      }
      
      // Capturar errores de Tesseract y lanzar mensaje descriptivo (Requisito 20.12)
      throw LivenessProcessingError.ocrExtraction({
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Parsea número de cédula del texto extraído
   * Formato Colombia: CC-XXXXXXXXXX, CE-XXXXXXXXXX, o número solo (6-10 dígitos)
   *
   * @param text - Texto extraído por OCR
   * @returns Número de cédula normalizado (sin guión) o null si no se detecta
   *
   * Requisitos: 5.3, 20.7
   */
  parseDocumentNumber(text: string): string | null {
    // Primero intentar con prefijo CC/CE
    const regexWithPrefix = /(?:CC|CE)-?\d{6,10}/i;
    const matchWithPrefix = text.match(regexWithPrefix);
    if (matchWithPrefix) {
      return matchWithPrefix[0].toUpperCase().replace('-', '');
    }

    // Si no encuentra con prefijo, buscar número solo de 6-10 dígitos
    const regexNumberOnly = /\b\d{6,10}\b/;
    const matchNumberOnly = text.match(regexNumberOnly);
    if (matchNumberOnly) {
      return matchNumberOnly[0];
    }

    return null;
  }

  /**
   * Parsea nombre completo del texto extraído
   * Busca patrón: NOMBRE(S): [NOMBRE EN MAYÚSCULAS]
   * 
   * @param text - Texto extraído por OCR
   * @returns Nombre completo o null si no se detecta
   * 
   * Requisitos: 5.4, 20.8
   */
  parseFullName(text: string): string | null {
    const regex = /NOMBRES?\s*:?\s*([A-ZÁÉÍÓÚÑ\s]+)/i;
    const match = text.match(regex);
    
    if (!match) {
      return null;
    }

    return match[1].trim();
  }

  /**
   * Parsea fecha de nacimiento del texto extraído
   * Formato esperado: DD/MM/YYYY
   * 
   * @param text - Texto extraído por OCR
   * @returns Objeto Date o null si no se detecta
   * 
   * Requisitos: 5.5, 20.9, 20.10
   */
  parseDateOfBirth(text: string): Date | null {
    const regex = /(\d{2}\/\d{2}\/\d{4})/;
    const match = text.match(regex);
    
    if (!match) {
      return null;
    }

    // Parsear fecha en formato DD/MM/YYYY (Requisito 20.10)
    const [day, month, year] = match[1].split('/').map(Number);
    
    // Validar rangos antes de crear Date
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }
    
    const date = new Date(year, month - 1, day);

    // Validar que la fecha sea válida y coincida con los valores ingresados
    if (isNaN(date.getTime()) || 
        date.getDate() !== day || 
        date.getMonth() !== month - 1 || 
        date.getFullYear() !== year) {
      return null;
    }

    return date;
  }

  /**
   * Parsea nacionalidad del texto extraído
   * Detecta prefijo CC (Cédula de Ciudadanía = Colombiana) o CE (Cédula de Extranjería = Extranjera)
   *
   * @param text - Texto extraído por OCR
   * @returns 'Colombiana' o 'Extranjera' o null si no se detecta
   *
   * Requisitos: 5.6
   */
  parseNationality(text: string): 'Colombiana' | 'Extranjera' | null {
    if (text.includes('CC-') || text.includes('CC ') || /\bCC\d/i.test(text)) {
      return 'Colombiana';
    }

    if (text.includes('CE-') || text.includes('CE ') || /\bCE\d/i.test(text)) {
      return 'Extranjera';
    }

    return null;
  }

  /**
   * Parsea fecha de vencimiento del texto extraído
   * Busca patrón: VENCIMIENTO: DD/MM/YYYY
   * 
   * @param text - Texto extraído por OCR del reverso del documento
   * @returns Objeto Date o null si no se detecta
   * 
   * Requisitos: 5.7, 20.9, 20.10
   */
  parseExpirationDate(text: string): Date | null {
    const regex = /VENCIMIENTO\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i;
    const match = text.match(regex);
    
    if (!match) {
      return null;
    }

    // Parsear fecha en formato DD/MM/YYYY (Requisito 20.10)
    const [day, month, year] = match[1].split('/').map(Number);
    
    // Validar rangos antes de crear Date
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }
    
    const date = new Date(year, month - 1, day);

    // Validar que la fecha sea válida y coincida con los valores ingresados
    if (isNaN(date.getTime()) || 
        date.getDate() !== day || 
        date.getMonth() !== month - 1 || 
        date.getFullYear() !== year) {
      return null;
    }

    return date;
  }

  /**
   * Calcula edad a partir de fecha de nacimiento
   * 
   * @param dateOfBirth - Fecha de nacimiento
   * @returns Edad en años
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
}
