# OCRService - Servicio de Extracción de Texto

## Descripción

El `OCRService` es un servicio de extracción de texto usando Tesseract OCR para documentos de identidad venezolanos. Implementa preprocesamiento de imágenes con sharp y parsing de campos específicos con regex.

## Requisitos Implementados

- **Requisitos 5.1-5.13**: Extracción de Datos con OCR
- **Requisitos 20.1-20.13**: Integración con Tesseract OCR

## Características

### Preprocesamiento de Imágenes

El servicio preprocesa imágenes antes de aplicar OCR para mejorar la calidad de extracción:

- **Escala de grises**: Convierte la imagen a blanco y negro
- **Normalización**: Ajusta el contraste y brillo
- **Enfoque (sharpen)**: Mejora la nitidez del texto

### Extracción de Campos

El servicio extrae los siguientes campos de documentos de identidad venezolanos:

1. **Número de Cédula**: Formato V-XXXXXXXX o E-XXXXXXXX (7-8 dígitos)
2. **Nombre Completo**: Extrae el nombre del titular
3. **Fecha de Nacimiento**: Formato DD/MM/YYYY
4. **Nacionalidad**: Venezolana (V) o Extranjera (E)
5. **Fecha de Vencimiento**: Del reverso del documento

### Validaciones

El servicio realiza las siguientes validaciones:

- ✅ Formato de número de cédula: `^[VE]\d{7,8}$`
- ✅ Edad mínima de 18 años
- ✅ Detección de campos faltantes
- ✅ Validación de fechas

## Uso

```typescript
import { OCRService } from './services/ocr.service';

const ocrService = new OCRService();

// Preprocesar imagen
const preprocessedImage = await ocrService.preprocessImage(imageBuffer);

// Extraer datos de documento
const ocrData = await ocrService.extractData(frontImageBuffer, backImageBuffer);

console.log(ocrData);
// {
//   documentNumber: 'V12345678',
//   fullName: 'JUAN CARLOS PÉREZ',
//   dateOfBirth: Date(1990-03-15),
//   nationality: 'Venezolana',
//   expirationDate: Date(2025-03-15),
//   rawText: '...',
//   confidence: 87.5,
//   validationIssues: []
// }
```

## Métodos Públicos

### `preprocessImage(imageBuffer: Buffer): Promise<Buffer>`

Preprocesa una imagen para mejorar la calidad de OCR.

**Parámetros:**
- `imageBuffer`: Buffer de imagen a preprocesar

**Retorna:** Buffer de imagen preprocesada

### `extractData(frontImage: Buffer, backImage: Buffer): Promise<OCRData>`

Extrae datos de documentos de identidad (frente y reverso).

**Parámetros:**
- `frontImage`: Buffer de imagen del frente del documento
- `backImage`: Buffer de imagen del reverso del documento

**Retorna:** Objeto `OCRData` con datos extraídos

### `parseDocumentNumber(text: string): string | null`

Parsea número de cédula del texto extraído.

**Formato:** V-XXXXXXXX o E-XXXXXXXX (con o sin guión)

### `parseFullName(text: string): string | null`

Parsea nombre completo del texto extraído.

**Patrón:** NOMBRE(S): [NOMBRE EN MAYÚSCULAS]

### `parseDateOfBirth(text: string): Date | null`

Parsea fecha de nacimiento del texto extraído.

**Formato:** DD/MM/YYYY

### `parseNationality(text: string): 'Venezolana' | 'Extranjera' | null`

Parsea nacionalidad del texto extraído.

**Detecta:** Prefijo V (Venezolana) o E (Extranjera)

### `parseExpirationDate(text: string): Date | null`

Parsea fecha de vencimiento del texto extraído.

**Patrón:** VENCIMIENTO: DD/MM/YYYY

## Interfaz OCRData

```typescript
interface OCRData {
  documentNumber: string;           // Número de cédula normalizado (sin guión)
  fullName: string;                 // Nombre completo del titular
  dateOfBirth: Date | null;         // Fecha de nacimiento
  nationality: 'Venezolana' | 'Extranjera' | null;  // Nacionalidad
  expirationDate: Date | null;      // Fecha de vencimiento
  rawText: string;                  // Texto completo extraído
  confidence: number;               // Confianza promedio (0-100)
  validationIssues: string[];       // Lista de problemas detectados
}
```

## Validación de Issues

El campo `validationIssues` puede contener los siguientes mensajes:

- `no_detectado: número de cédula` - No se pudo extraer el número de cédula
- `formato_invalido: número de cédula no cumple patrón ^[VE]\\d{7,8}$` - Formato inválido
- `no_detectado: nombre completo` - No se pudo extraer el nombre
- `no_detectado: fecha de nacimiento` - No se pudo extraer la fecha de nacimiento
- `edad_minima: usuario menor de 18 años` - El usuario es menor de edad
- `no_detectado: nacionalidad` - No se pudo determinar la nacionalidad
- `no_detectado: fecha de vencimiento` - No se pudo extraer la fecha de vencimiento

## Manejo de Errores

El servicio lanza errores descriptivos cuando:

- Tesseract falla al procesar la imagen
- La imagen tiene un formato no soportado
- Ocurre un error durante el preprocesamiento

```typescript
try {
  const ocrData = await ocrService.extractData(frontImage, backImage);
} catch (error) {
  console.error('OCR extraction failed:', error.message);
  // Error: OCR extraction failed: Input buffer contains unsupported image format
}
```

## Dependencias

- **tesseract.js**: Librería OCR open source
- **sharp**: Procesamiento de imágenes de alto rendimiento

## Tests

Los tests unitarios se encuentran en `tests/services/ocr.service.test.ts` y cubren:

- ✅ Extracción de números de cédula (V y E, con/sin guión, 7-8 dígitos)
- ✅ Extracción de nombres completos
- ✅ Parsing de fechas (nacimiento y vencimiento)
- ✅ Detección de nacionalidad
- ✅ Validación de fechas inválidas
- ✅ Preprocesamiento de imágenes

Para ejecutar los tests:

```bash
npm test -- ocr.service.test.ts
```

## Notas de Implementación

1. **Idioma**: El servicio usa el idioma español ('spa') para Tesseract
2. **Normalización**: Los números de cédula se normalizan a mayúsculas sin guión
3. **Validación de Fechas**: Se valida que las fechas sean válidas y coincidan con los valores parseados
4. **Edad Mínima**: Se calcula la edad considerando mes y día de nacimiento
5. **Confianza**: Se calcula como promedio de confianza del frente y reverso

## Próximos Pasos

- [ ] Implementar property tests para validación de formato de documento (Task 8.2)
- [ ] Implementar property tests para validación de edad mínima (Task 8.3)
- [ ] Integrar con KYCService para procesamiento completo
