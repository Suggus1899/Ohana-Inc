# Guía de Optimización de Videos e Imágenes

## Descripción General

Este documento explica la implementación de scripts de optimización de videos e imágenes en el proyecto Ohana. Los scripts están diseñados para reducir el tamaño de archivos multimedia manteniendo calidad aceptable para uso web.

---

## 📹 Optimización de Videos

### Ubicación de Scripts

- **Windows**: `apps/frontend/optimize-video.bat`
- **Linux/macOS**: `apps/frontend/optimize-video.sh`

### Requisitos

**FFmpeg** debe estar instalado en el sistema:

#### Windows
1. Descargar FFmpeg desde: https://ffmpeg.org/download.html
2. Extraer en `C:\ffmpeg\`
3. Editar la variable `FFMPEG_PATH` en el script `.bat` si la ruta es diferente

#### macOS
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt install ffmpeg
```

#### Linux (Fedora)
```bash
sudo dnf install ffmpeg
```

### Uso de los Scripts

#### Método 1: Arrastrar y Soltar (Windows)
1. Arrastra tu archivo de video sobre `optimize-video.bat`
2. Selecciona el modo de optimización
3. Espera a que termine el proceso

#### Método 2: Línea de Comandos

**Windows:**
```cmd
optimize-video.bat "ruta\al\video.mp4"
```

**Linux/macOS:**
```bash
chmod +x optimize-video.sh
./optimize-video.sh "ruta/al/video.mp4"
```

#### Método 3: Modo Automático (Linux/macOS)
```bash
./optimize-video.sh "video.mp4" max
```

### Modos de Optimización

El script ofrece 5 modos de optimización:

#### 1. Básica (basic)
- **Descripción**: Compresión estándar sin cambios de resolución o FPS
- **Codec**: H.264 (libx264)
- **CRF**: 28 (calidad media-alta)
- **Preset**: slow (mejor compresión)
- **Uso**: Videos donde se necesita mantener resolución y FPS originales

**Comando FFmpeg:**
```bash
ffmpeg -i input.mp4 -vcodec libx264 -crf 28 -preset slow -movflags faststart output.mp4
```

#### 2. Sin Audio (no-audio)
- **Descripción**: Compresión + eliminación de audio
- **Ideal para**: Videos decorativos de fondo (hero backgrounds)
- **Reducción adicional**: 10-30% menos que modo básico

**Comando FFmpeg:**
```bash
ffmpeg -i input.mp4 -vcodec libx264 -an -crf 28 -preset slow -movflags faststart output.mp4
```

#### 3. 720p (720p)
- **Descripción**: Reduce resolución a 1280x720
- **Ideal para**: Videos que no necesitan Full HD
- **Reducción**: 40-60% del tamaño original

**Comando FFmpeg:**
```bash
ffmpeg -i input.mp4 -vf scale=1280:720 -vcodec libx264 -crf 28 -movflags faststart output.mp4
```

#### 4. Bajo FPS (low-fps)
- **Descripción**: Reduce frame rate a 24 FPS
- **Ideal para**: Videos cinematográficos o decorativos
- **Reducción**: 20-40% del tamaño original

**Comando FFmpeg:**
```bash
ffmpeg -i input.mp4 -r 24 -vcodec libx264 -crf 28 -movflags faststart output.mp4
```

#### 5. Máxima (max) - **RECOMENDADO**
- **Descripción**: Combina todas las optimizaciones
- **Resolución**: 720p
- **FPS**: 24
- **Audio**: Eliminado
- **Reducción**: 60-80% del tamaño original
- **Ideal para**: Hero backgrounds y videos decorativos

**Comando FFmpeg:**
```bash
ffmpeg -i input.mp4 -vf scale=1280:720 -r 24 -vcodec libx264 -crf 28 -preset slow -an -movflags faststart output.mp4
```

### Parámetros Técnicos Explicados

#### CRF (Constant Rate Factor)
- **Rango**: 0-51
- **Valor usado**: 28
- **Explicación**: 
  - 0 = Sin pérdida (archivos enormes)
  - 18-23 = Calidad muy alta
  - 28 = Calidad media-alta (balance óptimo)
  - 35+ = Calidad baja

#### Preset
- **Valor usado**: slow
- **Opciones**: ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow
- **Explicación**: 
  - `slow` = Mejor compresión, toma más tiempo
  - `fast` = Compresión rápida, archivos más grandes

#### movflags faststart
- **Propósito**: Permite reproducción progresiva en web
- **Efecto**: Mueve metadata al inicio del archivo
- **Resultado**: El video empieza a reproducirse antes de descargarse completamente

### Salida del Script

Los archivos optimizados se guardan en:
```
carpeta-original/
  └── optimized/
      └── video-original-optimized-max.mp4
```

### Información Mostrada

El script muestra:
- ✅ Tamaño original vs optimizado
- ✅ Porcentaje de reducción
- ✅ Tiempo de procesamiento
- ✅ Recomendaciones según tamaño final
- ✅ Próximos pasos para usar el video

### Recomendaciones de Tamaño

- **< 5 MB**: ✅ Óptimo para web
- **5-10 MB**: ⚠️ Aceptable, considerar optimizar más
- **> 10 MB**: ❌ Demasiado grande, requiere más optimización

### Ejemplo de Uso Completo

```bash
# Linux/macOS
./optimize-video.sh hero-video.mp4

# Seleccionar opción 5 (Máxima)
# Resultado:
#   Original:  45 MB
#   Optimizado: 8 MB
#   Reducción:  82%

# Copiar a proyecto
cp optimized/hero-video-optimized-max.mp4 apps/frontend/public/videos/hero-background.mp4
```

---

## 🖼️ Optimización de Imágenes

### Librería Utilizada: Sharp

El proyecto usa **Sharp** (v0.32.6+) para procesamiento de imágenes de alto rendimiento.

**Documentación oficial**: https://sharp.pixelplumbing.com/

### Instalación

```bash
npm install sharp
```

### Casos de Uso en el Proyecto

#### 1. Preprocesamiento para OCR

**Ubicación**: `apps/backend/src/services/ocr.service.ts`

**Propósito**: Mejorar la precisión del OCR en documentos de identidad

```typescript
import sharp from 'sharp';

private async preprocessImage(imagePath: string): Promise<Buffer> {
  return await sharp(imagePath)
    .greyscale()      // Convertir a escala de grises
    .normalize()      // Ajustar contraste y brillo
    .sharpen()        // Mejorar nitidez del texto
    .toBuffer();
}
```

**Transformaciones aplicadas**:
- **Greyscale**: Elimina color, mejora detección de texto
- **Normalize**: Ajusta contraste automáticamente
- **Sharpen**: Aumenta nitidez de bordes y texto

#### 2. Análisis de Calidad de Frames (Liveness Detection)

**Ubicación**: `apps/backend/src/services/liveness/quality-analyzer.ts`

**Propósito**: Calcular nitidez de frames de video para validar calidad

```typescript
async calculateSharpness(frameBuffer: Buffer): Promise<number> {
  const { data, info } = await sharp(frameBuffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Aplicar operador Laplaciano para detectar bordes
  // Mayor valor = imagen más nítida
  return laplacianVariance;
}
```

**Umbrales de calidad**:
- **Nitidez > 100**: Imagen nítida (configurable en `.env`)
- **Brillo 50-200**: Iluminación adecuada
- **Confianza facial > 90%**: Rostro detectado claramente

#### 3. Optimización de Imágenes de Propiedades

**Ubicación**: `apps/backend/src/services/media-processing.service.ts`

**Propósito**: Crear versiones optimizadas de fotos de propiedades

```typescript
import sharp from 'sharp';

// Versión grande (1920x1080)
await sharp(imagePath)
  .resize(1920, 1080, { fit: 'inside' })
  .jpeg({ quality: 85 })
  .toFile(`${imagePath}-large.jpg`);

// Versión mediana (800x600)
await sharp(imagePath)
  .resize(800, 600, { fit: 'cover' })
  .jpeg({ quality: 80 })
  .toFile(`${imagePath}-medium.jpg`);

// Miniatura (400x300)
await sharp(imagePath)
  .resize(400, 300, { fit: 'cover' })
  .jpeg({ quality: 75 })
  .toFile(`${imagePath}-thumb.jpg`);
```

**Estrategia de optimización**:
- **Large**: Para vista detallada, calidad alta (85%)
- **Medium**: Para listados, calidad media (80%)
- **Thumbnail**: Para previews, calidad aceptable (75%)

### Opciones de Resize

#### fit: 'inside'
- Mantiene aspect ratio
- La imagen cabe completamente dentro de las dimensiones
- Puede quedar espacio vacío

#### fit: 'cover'
- Mantiene aspect ratio
- Llena completamente las dimensiones
- Puede recortar partes de la imagen

#### fit: 'fill'
- NO mantiene aspect ratio
- Estira la imagen para llenar dimensiones
- Puede distorsionar

### Formatos de Salida

#### JPEG
```typescript
.jpeg({ 
  quality: 85,           // 0-100
  progressive: true,     // Carga progresiva
  mozjpeg: true         // Mejor compresión
})
```

#### PNG
```typescript
.png({ 
  compressionLevel: 9,   // 0-9
  progressive: true 
})
```

#### WebP (Recomendado para web)
```typescript
.webp({ 
  quality: 80,
  lossless: false 
})
```

### Ejemplo Completo: Pipeline de Optimización

```typescript
import sharp from 'sharp';
import path from 'path';

async function optimizeImage(inputPath: string, outputDir: string) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  
  // 1. Versión original optimizada
  await sharp(inputPath)
    .rotate() // Auto-rotar según EXIF
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true })
    .toFile(path.join(outputDir, `${filename}-original.jpg`));
  
  // 2. Versión WebP (mejor compresión)
  await sharp(inputPath)
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(outputDir, `${filename}-original.webp`));
  
  // 3. Thumbnail
  await sharp(inputPath)
    .resize(400, 300, { fit: 'cover' })
    .jpeg({ quality: 75 })
    .toFile(path.join(outputDir, `${filename}-thumb.jpg`));
  
  // 4. Obtener metadata
  const metadata = await sharp(inputPath).metadata();
  
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: metadata.size
  };
}
```

### Operaciones Comunes

#### Redimensionar
```typescript
.resize(width, height, options)
```

#### Recortar
```typescript
.extract({ left: 0, top: 0, width: 100, height: 100 })
```

#### Rotar
```typescript
.rotate(90) // Grados
.rotate()   // Auto según EXIF
```

#### Voltear
```typescript
.flip()  // Vertical
.flop()  // Horizontal
```

#### Filtros
```typescript
.blur(5)           // Desenfoque
.sharpen()         // Nitidez
.greyscale()       // Escala de grises
.normalize()       // Auto-contraste
.negate()          // Invertir colores
```

#### Ajustes de Color
```typescript
.tint({ r: 255, g: 0, b: 0 })  // Tinte rojo
.gamma(2.2)                      // Corrección gamma
.linear(a, b)                    // Transformación lineal
```

---

## 🔧 Variables de Entorno

### Backend (.env)

```env
# Umbrales de calidad de imagen
BRIGHTNESS_THRESHOLD=50
SHARPNESS_THRESHOLD=100
FACE_CONFIDENCE_THRESHOLD=90

# Rutas de almacenamiento
STORAGE_PATH=./uploads
TEMP_PATH=./temp

# FFmpeg
FFMPEG_PATH=/usr/bin/ffmpeg
```

---

## 📊 Comparación de Rendimiento

### Videos

| Modo | Tamaño Original | Tamaño Final | Reducción | Calidad Visual |
|------|----------------|--------------|-----------|----------------|
| Básica | 50 MB | 25 MB | 50% | Excelente |
| Sin Audio | 50 MB | 20 MB | 60% | Excelente |
| 720p | 50 MB | 15 MB | 70% | Muy Buena |
| Bajo FPS | 50 MB | 18 MB | 64% | Muy Buena |
| **Máxima** | **50 MB** | **8 MB** | **84%** | **Buena** |

### Imágenes (Sharp)

| Formato | Tamaño Original | Optimizado | Reducción | Calidad |
|---------|----------------|------------|-----------|---------|
| PNG | 5 MB | 2 MB (JPEG 85%) | 60% | Excelente |
| JPEG | 3 MB | 1.5 MB (JPEG 85%) | 50% | Excelente |
| WebP | 3 MB | 800 KB (WebP 80%) | 73% | Excelente |

---

## 🚀 Mejores Prácticas

### Videos

1. **Usa modo "Máxima" para hero backgrounds**: Reduce hasta 84% sin pérdida notable
2. **Mantén videos cortos**: 10-15 segundos máximo para backgrounds
3. **Elimina audio en videos decorativos**: Ahorra 10-30% adicional
4. **Usa 720p para web**: Full HD (1080p) es innecesario en la mayoría de casos
5. **Aplica movflags faststart**: Permite reproducción progresiva

### Imágenes

1. **Usa WebP cuando sea posible**: 30% más compresión que JPEG
2. **Crea múltiples versiones**: Original, medium, thumbnail
3. **Optimiza antes de subir**: No optimices en tiempo real
4. **Usa lazy loading**: Carga imágenes solo cuando sean visibles
5. **Implementa responsive images**: Sirve tamaño apropiado según dispositivo

### General

1. **Automatiza el proceso**: Integra optimización en pipeline de CI/CD
2. **Monitorea tamaños**: Alerta si archivos exceden límites
3. **Usa CDN**: Sirve archivos optimizados desde CDN
4. **Implementa caching**: Cachea archivos optimizados
5. **Mide performance**: Usa Lighthouse para validar mejoras

---

## 🐛 Troubleshooting

### FFmpeg no encontrado (Windows)

**Error**: `FFmpeg no encontrado en: C:\ffmpeg\...`

**Solución**:
1. Verifica que FFmpeg esté instalado
2. Edita `FFMPEG_PATH` en `optimize-video.bat`
3. Usa ruta completa al ejecutable

### FFmpeg no encontrado (Linux/macOS)

**Error**: `FFmpeg no está instalado`

**Solución**:
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Fedora
sudo dnf install ffmpeg
```

### Sharp no compila (Windows)

**Error**: `Error: Cannot find module 'sharp'`

**Solución**:
```bash
# Reinstalar con rebuild
npm uninstall sharp
npm install --platform=win32 --arch=x64 sharp
```

### Sharp no compila (Linux)

**Error**: `Error building sharp`

**Solución**:
```bash
# Instalar dependencias
sudo apt install build-essential libvips-dev

# Reinstalar
npm install sharp
```

### Video muy grande después de optimizar

**Problema**: El video optimizado sigue siendo > 10 MB

**Soluciones**:
1. Usa modo "Máxima" si no lo hiciste
2. Reduce duración del video (< 15 segundos)
3. Aumenta CRF a 30-32 (edita script)
4. Reduce resolución a 480p (edita script)

### Imagen borrosa después de optimizar

**Problema**: La imagen pierde demasiada calidad

**Soluciones**:
1. Aumenta quality de 75 a 85-90
2. Usa formato PNG para imágenes con texto
3. No redimensiones más de lo necesario
4. Usa `fit: 'inside'` en lugar de `fit: 'cover'`

---

## 📚 Referencias

### FFmpeg
- Documentación oficial: https://ffmpeg.org/documentation.html
- Guía de codecs: https://trac.ffmpeg.org/wiki/Encode/H.264
- Optimización web: https://gist.github.com/jaydenseric/220c785d6289bcfd7366

### Sharp
- Documentación oficial: https://sharp.pixelplumbing.com/
- API Reference: https://sharp.pixelplumbing.com/api-constructor
- Performance tips: https://sharp.pixelplumbing.com/performance

### Optimización Web
- Google Web Fundamentals: https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/image-optimization
- WebP: https://developers.google.com/speed/webp
- Lighthouse: https://developers.google.com/web/tools/lighthouse

---

## 📝 Changelog

### Versión 1.0 (2026-04-13)
- ✅ Scripts de optimización de videos (Windows y Linux/macOS)
- ✅ 5 modos de optimización
- ✅ Integración de Sharp para imágenes
- ✅ Preprocesamiento para OCR
- ✅ Análisis de calidad de frames
- ✅ Optimización de imágenes de propiedades

---

**Documento creado**: 2026-04-13  
**Versión**: 1.0  
**Autor**: Sistema de Documentación Ohana
