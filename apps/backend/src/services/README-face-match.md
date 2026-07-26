# FaceMatchService - Servicio de Comparación Facial

## Descripción

Servicio de comparación facial usando face-api.js (librería open source) para el sistema KYC de verificación de identidad.

## Implementación

El servicio implementa los siguientes métodos:

### `loadModels(): Promise<void>`
Carga los modelos pre-entrenados de face-api.js desde `./models/face-api`:
- **ssdMobilenetv1**: Detección de rostros
- **faceLandmark68Net**: Detección de landmarks faciales (68 puntos)
- **faceRecognitionNet**: Extracción de descriptores de 128 dimensiones

### `detectFace(imageBuffer: Buffer): Promise<FaceDetection | null>`
Detecta un rostro en una imagen y extrae:
- Bounding box del rostro
- Nivel de confianza de la detección
- Landmarks faciales
- Descriptor facial de 128 dimensiones

Retorna `null` si no se detecta ningún rostro.

### `compareFaces(image1: Buffer, image2: Buffer): Promise<FaceMatchResult>`
Compara dos rostros y retorna:
- `match`: boolean - true si similitud >= 80%
- `score`: number - Puntuación de similitud 0-100
- `distance`: number - Distancia euclidiana entre descriptores
- `confidence1`: number - Confianza de detección imagen 1
- `confidence2`: number - Confianza de detección imagen 2

**Fórmula de similitud**: `Math.max(0, 100 - distance * 100)`

**Umbral de match**: 80% (Requisito 9.7)

## Requisitos Validados

- **Requisito 9.1-9.14**: Comparación Facial con Librerías Open Source
- **Requisito 19.1-19.13**: Integración con Librerías de Reconocimiento Facial Open Source

## Dependencias

### Requeridas
- `@vladmandic/face-api`: ^1.7.15 (versión mejorada para Node.js)
- `canvas`: ^3.2.3 (para procesamiento de imágenes en Node.js)
- `@tensorflow/tfjs-node`: ^4.x (backend de TensorFlow para Node.js)

### Instalación de @tensorflow/tfjs-node

**IMPORTANTE**: En Windows, la instalación de `@tensorflow/tfjs-node` requiere:
- Visual Studio Build Tools 2022 o superior
- Desktop development with C++ workload

#### Instalación en Windows:
```bash
# 1. Instalar Visual Studio Build Tools
# Descargar desde: https://visualstudio.microsoft.com/downloads/
# Seleccionar: "Desktop development with C++"

# 2. Instalar dependencia
npm install @tensorflow/tfjs-node
```

#### Instalación en Linux/Mac:
```bash
npm install @tensorflow/tfjs-node
```

## Uso

```typescript
import { FaceMatchService } from './services/face-match.service';
import fs from 'fs';

const service = new FaceMatchService();

// Cargar modelos (solo una vez al iniciar)
await service.loadModels();

// Detectar rostro en una imagen
const imageBuffer = fs.readFileSync('photo.jpg');
const face = await service.detectFace(imageBuffer);

if (face) {
  console.log('Rostro detectado con confianza:', face.confidence);
}

// Comparar dos rostros
const documentPhoto = fs.readFileSync('document.jpg');
const selfie = fs.readFileSync('selfie.jpg');

const result = await service.compareFaces(documentPhoto, selfie);

console.log('Match:', result.match);
console.log('Similitud:', result.score.toFixed(2) + '%');
console.log('Distancia:', result.distance);
```

## Testing

Los tests unitarios validan:
- Estructura del servicio
- Lógica de cálculo de similitud
- Umbral de match (80%)
- Estructura de resultados

**Nota**: Los tests de integración completos requieren `@tensorflow/tfjs-node` instalado correctamente.

```bash
npm test -- --testPathPattern=face-match
```

## Modelos Pre-entrenados

Los modelos están ubicados en `backend-residencias/models/face-api/`:
- `ssd_mobilenetv1_model-*` (detección)
- `face_landmark_68_model-*` (landmarks)
- `face_recognition_model-*` (descriptores)

Para descargar los modelos:
```bash
npm run download:models
```

## Configuración de Canvas para Node.js

El servicio configura automáticamente canvas para Node.js:

```typescript
import { Canvas, Image, ImageData } from 'canvas';
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
```

Esto permite que face-api.js funcione correctamente en entorno Node.js sin navegador.

## Troubleshooting

### Error: Cannot find module '@tensorflow/tfjs-node'
**Solución**: Instalar Visual Studio Build Tools en Windows o seguir las instrucciones de instalación para tu sistema operativo.

### Error: Failed to load models
**Solución**: Verificar que los modelos existen en `./models/face-api/` ejecutando `npm run download:models`.

### Error: No face detected
**Solución**: Verificar que la imagen contiene un rostro visible y con buena iluminación. La imagen debe tener resolución mínima de 800x600 píxeles.

## Referencias

- [face-api.js GitHub](https://github.com/justadudewhohacks/face-api.js)
- [@vladmandic/face-api](https://github.com/vladmandic/face-api) (versión mejorada)
- [TensorFlow.js Node](https://www.tensorflow.org/js/guide/nodejs)
