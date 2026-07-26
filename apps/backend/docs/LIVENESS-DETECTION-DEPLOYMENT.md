# 🔐 Guía de Deployment - Detección de Liveness KYC

Esta guía documenta los requisitos y pasos necesarios para desplegar el sistema de detección de liveness (detección de vida) en el flujo KYC.

---

## 📋 Tabla de Contenidos

- [Requisitos del Sistema](#requisitos-del-sistema)
- [Variables de Entorno](#variables-de-entorno)
- [Instalación de Dependencias](#instalación-de-dependencias)
- [Validación Pre-Deployment](#validación-pre-deployment)
- [Checklist de Deployment](#checklist-de-deployment)
- [Configuración de Umbrales](#configuración-de-umbrales)
- [Troubleshooting](#troubleshooting)

---

## 🖥️ Requisitos del Sistema

### 1. FFmpeg

**Versión requerida**: 4.0 o superior

**Propósito**: Extracción de frames de videos para análisis de liveness

**Instalación**:

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Linux (CentOS/RHEL)
```bash
sudo yum install epel-release
sudo yum install ffmpeg
```

#### macOS
```bash
brew install ffmpeg
```

#### Windows
1. Descargar desde [ffmpeg.org](https://ffmpeg.org/download.html)
2. Extraer a `C:\ffmpeg`
3. Agregar `C:\ffmpeg\bin` al PATH del sistema

#### Docker
FFmpeg ya está incluido en la imagen Docker. No requiere instalación adicional.

**Verificación**:
```bash
ffmpeg -version
```

Debe mostrar la versión instalada (ej: `ffmpeg version 4.4.2`).

---

### 2. Modelos de Face-API.js

**Ubicación requerida**: `apps/backend/models/face-api/`

**Modelos necesarios**:
- `ssd_mobilenetv1_model-*` - Detección de rostros
- `face_landmark_68_model-*` - Detección de 68 landmarks faciales
- `face_recognition_model-*` - Extracción de descriptores faciales

**Descarga automática**:
```bash
npm run download:models
```

**Descarga manual**:
```bash
cd apps/backend/models
mkdir -p face-api
cd face-api

# Descargar modelos desde GitHub
wget https://raw.githubusercontent.com/vladmandic/face-api/master/model/ssd_mobilenetv1_model-weights_manifest.json
wget https://raw.githubusercontent.com/vladmandic/face-api/master/model/ssd_mobilenetv1_model-shard1
wget https://raw.githubusercontent.com/vladmandic/face-api/master/model/ssd_mobilenetv1_model-shard2

wget https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_landmark_68_model-weights_manifest.json
wget https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_landmark_68_model-shard1

wget https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_recognition_model-weights_manifest.json
wget https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_recognition_model-shard1
wget https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_recognition_model-shard2
```

**Verificación**:
```bash
ls -la apps/backend/models/face-api/
```

Debe mostrar al menos 8 archivos (3 manifests + 5 shards).

---

### 3. Tesseract.js

**Versión requerida**: 4.0 o superior (incluido en dependencias npm)

**Propósito**: OCR para extracción de datos de documentos de identidad

**Instalación**: Automática con `npm install`

**Verificación**: El sistema validará Tesseract.js al iniciar.

---

### 4. Recursos del Sistema

**Mínimos recomendados**:
- **CPU**: 2 cores
- **RAM**: 2 GB (4 GB recomendado)
- **Disco**: 500 MB para modelos + espacio para videos temporales
- **Node.js**: 20.x o superior

**Estimaciones de uso por verificación**:
- Memoria: ~30-40 MB
- CPU: ~5-10 segundos de procesamiento
- Disco temporal: ~10-15 MB (se limpia automáticamente)

---

## 🔧 Variables de Entorno

### Variables de Liveness Detection

Agregar al archivo `.env`:

```env
# ============================================
# LIVENESS DETECTION CONFIGURATION
# ============================================

# Umbrales de Eye Aspect Ratio (EAR)
# Valor por defecto: 0.2
# Rango válido: 0.0 - 1.0
# Menor valor = más estricto (detecta ojos más cerrados)
BLINK_EAR_THRESHOLD=0.2

# Mínimo de parpadeos requeridos
# Valor por defecto: 2
# Rango válido: >= 1
# Mayor valor = más estricto (requiere más parpadeos)
MIN_BLINKS_REQUIRED=2

# Umbral de movimiento de cabeza (grados)
# Valor por defecto: 15
# Rango válido: > 0
# Mayor valor = menos estricto (permite menos movimiento)
HEAD_MOVEMENT_THRESHOLD=15

# Umbral de movimiento significativo (grados)
# Valor por defecto: 5
# Rango válido: > 0
# Detecta cambios de ángulo entre frames
SIGNIFICANT_MOVEMENT_THRESHOLD=5

# Umbrales de calidad de imagen
# Brillo mínimo (escala 0-255)
MIN_BRIGHTNESS=50

# Brillo máximo (escala 0-255)
MAX_BRIGHTNESS=200

# Umbral de nitidez (Laplacian variance)
# Valor por defecto: 100
# Mayor valor = más estricto (requiere más nitidez)
SHARPNESS_THRESHOLD=100

# Umbral de confianza facial (%)
# Valor por defecto: 92
# Rango válido: 0 - 100
# Mayor valor = más estricto
FACE_CONFIDENCE_THRESHOLD=92

# Umbral de similitud facial (%)
# Valor por defecto: 80
# Rango válido: 0 - 100
# Mayor valor = más estricto (requiere mayor similitud)
FACE_MATCH_THRESHOLD=80

# Configuración de frames
# Número de frames a extraer del video
# Valor por defecto: 30
# Rango válido: >= 20
LIVENESS_FRAME_COUNT=30

# Tasa mínima de frames válidos
# Valor por defecto: 0.8 (80%)
# Rango válido: 0.0 - 1.0
MIN_VALID_FRAME_RATE=0.8
```

### Variables Existentes de KYC

Asegúrate de tener configuradas:

```env
# KYC Configuration
KYC_MAX_ATTEMPTS=3
KYC_MIN_FACE_MATCH_SCORE=80
KYC_STORAGE_PATH=./storage/kyc
```

---

## 📦 Instalación de Dependencias

### 1. Dependencias de Node.js

```bash
cd apps/backend
npm install
```

### 2. Modelos de Face-API

```bash
npm run download:models
```

### 3. Verificar FFmpeg

```bash
ffmpeg -version
```

Si no está instalado, seguir las instrucciones en [Requisitos del Sistema](#requisitos-del-sistema).

---

## ✅ Validación Pre-Deployment

### Script de Validación Automática

```bash
cd apps/backend
npm run validate:dependencies
```

Este script valida:
- ✅ FFmpeg instalado y accesible
- ✅ Modelos de face-api.js presentes
- ✅ Tesseract.js funcional
- ✅ Variables de entorno configuradas
- ✅ Directorios de almacenamiento creados

### Validación Manual

#### 1. Validar FFmpeg
```bash
ffmpeg -version
```

#### 2. Validar Modelos
```bash
ls -la models/face-api/ | grep -E "(ssd_mobilenetv1|face_landmark_68|face_recognition)"
```

Debe mostrar 8 archivos.

#### 3. Validar Variables de Entorno
```bash
node -e "require('dotenv').config(); console.log('BLINK_EAR_THRESHOLD:', process.env.BLINK_EAR_THRESHOLD || '0.2 (default)');"
```

#### 4. Test de Integración
```bash
npm run test -- liveness
```

---

## 📝 Checklist de Deployment

### Pre-Deployment

- [ ] **Requisitos del Sistema**
  - [ ] FFmpeg instalado y en PATH
  - [ ] Node.js 20.x instalado
  - [ ] Recursos suficientes (2GB RAM, 2 CPU cores)

- [ ] **Modelos y Dependencias**
  - [ ] Modelos face-api.js descargados
  - [ ] Dependencias npm instaladas
  - [ ] Tesseract.js funcional

- [ ] **Configuración**
  - [ ] Variables de entorno configuradas en `.env`
  - [ ] Umbrales ajustados según necesidades
  - [ ] Directorios de almacenamiento creados

- [ ] **Validación**
  - [ ] Script de validación ejecutado exitosamente
  - [ ] Tests de liveness pasando
  - [ ] Tests de integración KYC pasando

### Deployment

- [ ] **Build**
  - [ ] Código compilado: `npm run build`
  - [ ] Sin errores de TypeScript
  - [ ] Modelos copiados a `dist/models/`

- [ ] **Base de Datos**
  - [ ] Migraciones ejecutadas
  - [ ] Tabla `kyc_verifications` actualizada
  - [ ] Índices creados

- [ ] **Servicios**
  - [ ] Servidor iniciado correctamente
  - [ ] Logs sin errores críticos
  - [ ] Health check respondiendo

### Post-Deployment

- [ ] **Verificación Funcional**
  - [ ] Endpoint `/api/health` responde
  - [ ] Endpoint `/api/kyc/verify` funcional
  - [ ] Análisis de liveness ejecutándose

- [ ] **Monitoreo**
  - [ ] Logs de auditoría funcionando
  - [ ] Métricas de performance registrándose
  - [ ] Alertas configuradas

- [ ] **Testing en Producción**
  - [ ] Verificación KYC completa exitosa
  - [ ] Detección de liveness funcionando
  - [ ] Comparación facial funcionando
  - [ ] OCR extrayendo datos correctamente

---

## ⚙️ Configuración de Umbrales

### Perfiles Recomendados

#### Perfil Estricto (Alta Seguridad)
```env
BLINK_EAR_THRESHOLD=0.18
MIN_BLINKS_REQUIRED=3
HEAD_MOVEMENT_THRESHOLD=20
FACE_CONFIDENCE_THRESHOLD=95
FACE_MATCH_THRESHOLD=85
MIN_VALID_FRAME_RATE=0.85
```

**Uso**: Aplicaciones financieras, transacciones de alto valor

#### Perfil Balanceado (Recomendado)
```env
BLINK_EAR_THRESHOLD=0.2
MIN_BLINKS_REQUIRED=2
HEAD_MOVEMENT_THRESHOLD=15
FACE_CONFIDENCE_THRESHOLD=92
FACE_MATCH_THRESHOLD=80
MIN_VALID_FRAME_RATE=0.8
```

**Uso**: Verificación KYC estándar

#### Perfil Permisivo (Alta Usabilidad)
```env
BLINK_EAR_THRESHOLD=0.22
MIN_BLINKS_REQUIRED=1
HEAD_MOVEMENT_THRESHOLD=10
FACE_CONFIDENCE_THRESHOLD=88
FACE_MATCH_THRESHOLD=75
MIN_VALID_FRAME_RATE=0.75
```

**Uso**: Onboarding rápido, menor riesgo

### Ajuste de Umbrales

**Monitorear métricas**:
- Tasa de rechazo por liveness
- Tasa de falsos positivos
- Tiempo promedio de verificación
- Satisfacción del usuario

**Ajustar gradualmente**:
1. Iniciar con perfil balanceado
2. Monitorear por 1-2 semanas
3. Ajustar umbrales según métricas
4. Validar cambios en staging antes de producción

---

## 🐛 Troubleshooting

### Error: "FFMPEG_NOT_FOUND"

**Causa**: FFmpeg no está instalado o no está en PATH

**Solución**:
```bash
# Verificar instalación
ffmpeg -version

# Si no está instalado, instalar según OS
# Linux: sudo apt install ffmpeg
# macOS: brew install ffmpeg
# Windows: Agregar ffmpeg/bin al PATH
```

### Error: "MODELS_NOT_FOUND"

**Causa**: Modelos de face-api.js no están en la ubicación correcta

**Solución**:
```bash
# Descargar modelos
npm run download:models

# Verificar ubicación
ls -la models/face-api/
```

### Error: "OCR_INITIALIZATION_FAILED"

**Causa**: Tesseract.js no puede inicializarse

**Solución**:
```bash
# Reinstalar dependencias
npm install tesseract.js --force

# Verificar versión
npm list tesseract.js
```

### Error: "INSUFFICIENT_FRAMES"

**Causa**: Video muy corto o corrupto

**Solución**:
- Instruir al usuario a grabar video de al menos 3-5 segundos
- Verificar formato de video soportado (mp4, webm)
- Reducir `LIVENESS_FRAME_COUNT` si es necesario

### Error: "LIVENESS_FAILED"

**Causa**: No se detectaron suficientes parpadeos

**Solución**:
- Verificar que `MIN_BLINKS_REQUIRED` no sea muy alto
- Instruir al usuario a parpadear naturalmente
- Revisar logs para ver conteo de parpadeos detectados

### Error: "POOR_QUALITY"

**Causa**: Calidad de video insuficiente

**Solución**:
- Instruir al usuario a grabar en lugar bien iluminado
- Ajustar umbrales de calidad si son muy estrictos
- Verificar que cámara tenga resolución adecuada

### Performance Lento

**Causa**: Recursos insuficientes o configuración subóptima

**Solución**:
```bash
# Reducir número de frames
LIVENESS_FRAME_COUNT=20

# Aumentar recursos del servidor
# CPU: 4 cores
# RAM: 4 GB

# Optimizar Node.js
NODE_OPTIONS="--max-old-space-size=2048"
```

### Logs de Debugging

```bash
# Ver logs de liveness
tail -f logs/audit.log | grep liveness

# Ver logs de errores
tail -f logs/error.log

# Modo debug
NODE_ENV=development npm run dev
```

---

## 📊 Monitoreo Post-Deployment

### Métricas Clave

1. **Tasa de Éxito de Liveness**
   - Objetivo: > 85%
   - Monitorear: `isLive=true` / total verificaciones

2. **Tiempo de Procesamiento**
   - Objetivo: < 10 segundos
   - Monitorear: Tiempo desde upload hasta resultado

3. **Tasa de Rechazo por Calidad**
   - Objetivo: < 15%
   - Monitorear: `POOR_QUALITY` / total verificaciones

4. **Conteo Promedio de Parpadeos**
   - Objetivo: 2-4 parpadeos
   - Monitorear: `blinkCount` promedio

### Endpoints de Monitoreo

```bash
# Health check
curl http://localhost:3001/api/health

# Métricas
curl http://localhost:3001/api/metrics

# Estado de dependencias
curl http://localhost:3001/api/system/dependencies
```

---

## 🔄 Rollback

Si es necesario revertir el deployment:

1. **Detener servidor**
   ```bash
   npm run docker:down
   ```

2. **Revertir código**
   ```bash
   git revert <commit-hash>
   ```

3. **Revertir migraciones** (si aplica)
   ```bash
   npm run migrate:down
   ```

4. **Reiniciar servidor**
   ```bash
   npm run docker:up
   ```

---

## 📞 Soporte

Para problemas durante el deployment:

1. Revisar logs: `tail -f logs/audit.log`
2. Ejecutar validación: `npm run validate:dependencies`
3. Consultar esta guía de troubleshooting
4. Revisar documentación de [face-api.js](https://github.com/vladmandic/face-api)

---

## 📚 Referencias

- [Documentación FFmpeg](https://ffmpeg.org/documentation.html)
- [Face-API.js GitHub](https://github.com/vladmandic/face-api)
- [Tesseract.js Docs](https://tesseract.projectnaptha.com/)
- [Documento de Diseño](../.kiro/specs/blink-detection-kyc-enhancement/design.md)
- [Documento de Requisitos](../.kiro/specs/blink-detection-kyc-enhancement/requirements.md)

---

**Última actualización**: 2026-04-11
**Versión**: 1.0.0
