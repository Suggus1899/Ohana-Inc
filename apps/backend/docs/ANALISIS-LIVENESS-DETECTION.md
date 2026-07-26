# 🔍 Análisis: Detección de Vida (Liveness Detection)

## Fecha: 9 de Abril, 2026

## 📋 Estado Actual

### ✅ Lo que SÍ está implementado y funcional:

#### 1. **Extracción de Frames del Video**
**Archivo:** `src/services/liveness-detection.service.ts` (línea 91)

```typescript
async extractFrames(videoPath: string, count: number = 5): Promise<Buffer[]>
```

**Funcionalidad:**
- ✅ Usa `ffmpeg` para extraer frames del video
- ✅ Extrae 5 frames equidistantes
- ✅ Calcula timestamps automáticamente
- ✅ Retorna buffers de imágenes

**Estado:** **FUNCIONAL** - Requiere `ffmpeg` instalado en el sistema

---

#### 2. **Análisis de Calidad de Frames**
**Archivo:** `src/services/liveness-detection.service.ts` (línea 195)

```typescript
async calculateBrightness(frameBuffer: Buffer): Promise<number>
async calculateSharpness(frameBuffer: Buffer): Promise<number>
async analyzeFrameQuality(frameBuffer: Buffer): Promise<FrameQuality>
```

**Funcionalidad:**
- ✅ Calcula brillo promedio usando canvas API
- ✅ Calcula nitidez usando operador Laplaciano con sharp
- ✅ Detecta rostro y obtiene confianza usando face-api.js
- ✅ Valida umbrales: brillo > 40, nitidez > 50, confianza > 90

**Estado:** **FUNCIONAL** - Requiere dependencias instaladas

---

#### 3. **Detección Facial**
**Archivo:** `src/services/face-match.service.ts` (línea 73)

```typescript
async detectFace(imageBuffer: Buffer): Promise<FaceDetection | null>
```

**Funcionalidad:**
- ✅ Usa face-api.js con modelos pre-entrenados
- ✅ Detecta rostro con landmarks
- ✅ Extrae descriptor facial de 128 dimensiones
- ✅ Retorna confianza de detección

**Estado:** **FUNCIONAL** - Requiere modelos descargados

---

#### 4. **Comparación Facial**
**Archivo:** `src/services/face-match.service.ts` (línea 99)

```typescript
async compareFaces(image1: Buffer, image2: Buffer): Promise<FaceMatchResult>
```

**Funcionalidad:**
- ✅ Compara dos rostros usando distancia euclidiana
- ✅ Calcula similitud 0-100
- ✅ Umbral de match: 80%
- ✅ Valida que ambos rostros sean detectados

**Estado:** **FUNCIONAL** - Requiere modelos descargados

---

#### 5. **OCR de Documentos**
**Archivo:** `src/services/ocr.service.ts` (línea 38)

```typescript
async extractData(frontImage: Buffer, backImage: Buffer): Promise<OCRData>
```

**Funcionalidad:**
- ✅ Usa Tesseract OCR con idioma español
- ✅ Preprocesa imágenes (escala de grises, normalización, enfoque)
- ✅ Extrae: número de cédula, nombre, fecha de nacimiento, nacionalidad, vencimiento
- ✅ Valida patrones con regex
- ✅ Calcula edad y valida mínimo 18 años

**Estado:** **FUNCIONAL** - Requiere Tesseract instalado

---

### ❌ Lo que NO está implementado (Simulado):

#### **NADA ESTÁ SIMULADO**

Todos los servicios están implementados con librerías reales:
- ✅ `ffmpeg` para extracción de frames
- ✅ `sharp` para procesamiento de imágenes
- ✅ `canvas` para análisis de píxeles
- ✅ `face-api.js` (@vladmandic/face-api) para detección facial
- ✅ `tesseract.js` para OCR

---

## 🚨 Problemas Identificados

### 1. **Detección de Vida NO es Robusta**

**Problema:**
El análisis actual solo verifica:
- Calidad de frames (brillo, nitidez)
- Presencia de rostro
- Confianza de detección

**NO detecta:**
- ❌ Fotos impresas
- ❌ Pantallas de celular/tablet
- ❌ Videos pregrabados
- ❌ Máscaras 3D
- ❌ Deepfakes

**Código actual:**
```typescript
// src/services/liveness-detection.service.ts - línea 327
const isLive = allFramesValid && averageFaceConfidence >= 85;
```

Esto solo valida que haya un rostro con buena calidad, pero NO valida que sea una persona real en vivo.

---

### 2. **Falta Detección de Movimiento**

**Problema:**
No se valida que el usuario realice movimientos específicos (parpadeo, girar cabeza, sonreír).

**Impacto:**
Un atacante puede usar una foto de alta calidad y pasaría la validación.

---

### 3. **Falta Análisis de Textura**

**Problema:**
No se analiza la textura de la piel para detectar pantallas o fotos impresas.

**Impacto:**
Una foto en una pantalla de alta resolución podría pasar la validación.

---

### 4. **Falta Análisis de Profundidad**

**Problema:**
No se usa información de profundidad para detectar si es una cara 3D real o una imagen 2D.

**Impacto:**
Fotos planas no se distinguen de rostros reales.

---

## 🛠️ Soluciones Recomendadas

### Opción 1: **Mejorar Detección con Desafíos de Movimiento** (Recomendado)

**Implementación:**

1. **Frontend: Solicitar acciones específicas**
   ```typescript
   // Ejemplo de flujo en frontend
   const challenges = [
     { action: 'blink', instruction: 'Parpadea 2 veces' },
     { action: 'turn_left', instruction: 'Gira tu cabeza a la izquierda' },
     { action: 'turn_right', instruction: 'Gira tu cabeza a la derecha' },
     { action: 'smile', instruction: 'Sonríe' }
   ];
   ```

2. **Backend: Validar que se cumplieron las acciones**
   ```typescript
   // Nuevo método en liveness-detection.service.ts
   async validateChallenges(
     videoPath: string, 
     challenges: Challenge[]
   ): Promise<ChallengeResult> {
     // Extraer frames en momentos específicos
     // Detectar landmarks faciales
     // Validar que se cumplieron las acciones
   }
   ```

**Ventajas:**
- ✅ Dificulta uso de fotos/videos pregrabados
- ✅ No requiere hardware especial
- ✅ Funciona con cámara web estándar

**Desventajas:**
- ⚠️ Puede ser incómodo para usuarios
- ⚠️ Requiere buena iluminación

---

### Opción 2: **Integrar Servicio de Liveness Profesional** (Más Robusto)

**Servicios recomendados:**

#### A. **AWS Rekognition Face Liveness**
```typescript
import { RekognitionClient, DetectFacesCommand } from "@aws-sdk/client-rekognition";

async analyzeLivenessWithAWS(videoBuffer: Buffer): Promise<LivenessResult> {
  const client = new RekognitionClient({ region: "us-east-1" });
  
  const command = new DetectFacesCommand({
    Image: { Bytes: videoBuffer },
    Attributes: ["ALL"]
  });
  
  const response = await client.send(command);
  // Procesar respuesta
}
```

**Ventajas:**
- ✅ Detección de liveness muy robusta
- ✅ Detecta fotos, pantallas, máscaras
- ✅ Mantenido por AWS

**Desventajas:**
- ❌ Costo por uso (~$0.001 por imagen)
- ❌ Dependencia de servicio externo
- ❌ Requiere cuenta AWS

---

#### B. **FaceTec ZoOm**
```typescript
import { FaceTecSDK } from 'facetec-sdk';

async analyzeLivenessWithFaceTec(sessionData: any): Promise<LivenessResult> {
  const result = await FaceTecSDK.verifyLiveness(sessionData);
  return {
    isLive: result.isLive,
    confidence: result.confidence,
    // ...
  };
}
```

**Ventajas:**
- ✅ Liveness 3D muy avanzado
- ✅ Certificado por iBeta Level 1 & 2
- ✅ SDK para web y móvil

**Desventajas:**
- ❌ Costo de licencia
- ❌ Integración más compleja

---

#### C. **Onfido**
```typescript
import { Onfido } from 'onfido';

async analyzeLivenessWithOnfido(applicantId: string): Promise<LivenessResult> {
  const onfido = new Onfido({ apiToken: process.env.ONFIDO_API_TOKEN });
  
  const check = await onfido.check.create({
    applicantId,
    reportNames: ['facial_similarity_video']
  });
  
  // Procesar resultado
}
```

**Ventajas:**
- ✅ Solución completa de KYC
- ✅ Liveness + verificación de documentos
- ✅ Cumple regulaciones internacionales

**Desventajas:**
- ❌ Costo alto
- ❌ Overkill si solo necesitas liveness

---

### Opción 3: **Implementar Detección de Parpadeo** (Solución Intermedia)

**Implementación:**

```typescript
// Nuevo método en liveness-detection.service.ts
async detectBlinks(videoPath: string): Promise<BlinkResult> {
  const frames = await this.extractFrames(videoPath, 30); // Más frames
  
  let blinkCount = 0;
  let previousEyesClosed = false;
  
  for (const frame of frames) {
    const face = await this.faceMatchService.detectFace(frame);
    
    if (face && face.landmarks) {
      // Calcular Eye Aspect Ratio (EAR)
      const leftEAR = this.calculateEAR(face.landmarks.getLeftEye());
      const rightEAR = this.calculateEAR(face.landmarks.getRightEye());
      const avgEAR = (leftEAR + rightEAR) / 2;
      
      // EAR < 0.2 indica ojos cerrados
      const eyesClosed = avgEAR < 0.2;
      
      // Detectar transición cerrado -> abierto (parpadeo)
      if (previousEyesClosed && !eyesClosed) {
        blinkCount++;
      }
      
      previousEyesClosed = eyesClosed;
    }
  }
  
  return {
    blinkCount,
    isLive: blinkCount >= 2 // Al menos 2 parpadeos
  };
}

private calculateEAR(eyeLandmarks: any[]): number {
  // Eye Aspect Ratio formula
  // EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
  const p1 = eyeLandmarks[0];
  const p2 = eyeLandmarks[1];
  const p3 = eyeLandmarks[2];
  const p4 = eyeLandmarks[3];
  const p5 = eyeLandmarks[4];
  const p6 = eyeLandmarks[5];
  
  const vertical1 = this.distance(p2, p6);
  const vertical2 = this.distance(p3, p5);
  const horizontal = this.distance(p1, p4);
  
  return (vertical1 + vertical2) / (2 * horizontal);
}

private distance(p1: any, p2: any): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}
```

**Ventajas:**
- ✅ Mejora significativa sin costo adicional
- ✅ Usa librerías existentes
- ✅ Detecta fotos estáticas

**Desventajas:**
- ⚠️ No detecta videos pregrabados con parpadeos
- ⚠️ Puede fallar con mala iluminación

---

## 📊 Comparación de Opciones

| Característica | Actual | Desafíos | AWS Rekognition | FaceTec | Onfido | Detección Parpadeo |
|----------------|--------|----------|-----------------|---------|--------|-------------------|
| **Costo** | Gratis | Gratis | ~$0.001/img | Licencia | Alto | Gratis |
| **Robustez** | Baja | Media | Alta | Muy Alta | Muy Alta | Media |
| **Complejidad** | Baja | Media | Baja | Alta | Media | Media |
| **Detecta fotos** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Detecta videos** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Detecta máscaras** | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Tiempo impl.** | - | 2-3 días | 1 día | 1 semana | 3 días | 2 días |

---

## 🎯 Recomendación Final

### **Enfoque Híbrido (Recomendado):**

1. **Corto plazo (1-2 semanas):**
   - Implementar detección de parpadeo
   - Agregar validación de movimiento de cabeza
   - Mejorar umbrales de calidad

2. **Mediano plazo (1-2 meses):**
   - Integrar AWS Rekognition Face Liveness
   - Mantener detección local como fallback
   - Implementar sistema de scoring combinado

3. **Largo plazo (3-6 meses):**
   - Evaluar FaceTec o Onfido si el volumen lo justifica
   - Implementar machine learning propio para detección

---

## 🔧 Dependencias Requeridas

### Actuales (Ya instaladas):
```json
{
  "@vladmandic/face-api": "^1.7.12",
  "@tensorflow/tfjs-node": "^4.11.0",
  "canvas": "^2.11.2",
  "fluent-ffmpeg": "^2.1.2",
  "sharp": "^0.32.6",
  "tesseract.js": "^5.0.0"
}
```

### Adicionales para Mejoras:
```json
{
  // Para AWS Rekognition
  "@aws-sdk/client-rekognition": "^3.400.0",
  
  // Para FaceTec (si se elige)
  "facetec-sdk": "^9.6.0",
  
  // Para Onfido (si se elige)
  "onfido": "^3.0.0"
}
```

### Sistema:
- ✅ `ffmpeg` instalado
- ✅ Modelos de face-api.js descargados en `models/face-api/`
- ✅ Tesseract OCR instalado (viene con tesseract.js)

---

## 📝 Próximos Pasos

### Paso 1: Validar Dependencias
```bash
# Verificar ffmpeg
ffmpeg -version

# Verificar modelos face-api
ls backend-residencias/models/face-api/

# Debería mostrar:
# - ssd_mobilenetv1_model-*
# - face_landmark_68_model-*
# - face_recognition_model-*
```

### Paso 2: Implementar Detección de Parpadeo
- Crear método `detectBlinks()` en `liveness-detection.service.ts`
- Agregar cálculo de Eye Aspect Ratio (EAR)
- Integrar en flujo de `analyzeLiveness()`

### Paso 3: Mejorar Frontend
- Agregar instrucciones claras para el usuario
- Mostrar feedback en tiempo real
- Validar calidad del video antes de subir

### Paso 4: Testing
- Probar con fotos impresas (debe fallar)
- Probar con pantallas (debe fallar)
- Probar con personas reales (debe pasar)

---

## ✅ Conclusión

**El sistema actual NO está simulado**, pero **NO es suficientemente robusto** para producción.

**Recomendación inmediata:**
1. Implementar detección de parpadeo (2 días)
2. Agregar validación de movimiento de cabeza (1 día)
3. Evaluar AWS Rekognition para casos críticos (1 día)

**Esto mejorará significativamente la seguridad sin costos adicionales.**
