# 🏠 Backend Residencias - API

Backend API para sistema de gestión de residencias con autenticación, KYC biométrico, y transacciones P2P.

## 🚀 Inicio Rápido

### 👉 [START-HERE.md](./START-HERE.md) - Empieza aquí si es tu primera vez

### Desarrollo con Docker (Recomendado)
```bash
# 1. Iniciar servicios
npm run docker:dev

# 2. Ejecutar migraciones (PRIMERA VEZ)
docker-compose -f docker-compose.dev.yml exec backend npm run migrate

# 3. Ejecutar seeds (PRIMERA VEZ - Opcional)
docker-compose -f docker-compose.dev.yml exec backend npm run seed:complete
```

### Desarrollo Local
```bash
npm install
npm run dev
```

---

## 📚 Documentación

### Docker
- 👉 **[DOCKER-INDEX.md](./DOCKER-INDEX.md)** - Índice completo de documentación Docker
- 🚀 [QUICK-START-DEV.md](./QUICK-START-DEV.md) - Inicio rápido (30 segundos)
- 📖 [README-DOCKER.md](./README-DOCKER.md) - Resumen Docker
- 🪟 [INSTRUCCIONES-WINDOWS.md](./INSTRUCCIONES-WINDOWS.md) - Guía Windows
- 📋 [COMANDOS-DOCKER.md](./COMANDOS-DOCKER.md) - Referencia comandos

### Características
- 🔐 [docs/GDPR_ENDPOINTS.md](./docs/GDPR_ENDPOINTS.md) - Endpoints GDPR
- 📊 [docs/METRICS_ENDPOINT.md](./docs/METRICS_ENDPOINT.md) - Métricas
- 👁️ [docs/LIVENESS-DETECTION-DEPLOYMENT.md](./docs/LIVENESS-DETECTION-DEPLOYMENT.md) - Detección de Liveness
- 🔧 [GUIA-DOCKER.md](./GUIA-DOCKER.md) - Guía completa Docker

---

## 🛠️ Stack Tecnológico

- **Runtime**: Node.js 20
- **Framework**: Express + TypeScript
- **Base de Datos**: PostgreSQL 16
- **Cache**: Redis 7
- **ORM**: Sequelize
- **Autenticación**: JWT
- **Biometría**: face-api.js + TensorFlow
- **Liveness Detection**: Eye Aspect Ratio (EAR) + Head Movement Analysis
- **OCR**: Tesseract.js
- **Video Processing**: FFmpeg
- **Containerización**: Docker + Docker Compose

---

## 📋 Requisitos

- Node.js 20+
- Docker Desktop (para desarrollo con Docker)
- PostgreSQL 16 (si no usas Docker)
- Redis 7 (si no usas Docker)
- FFmpeg 4.0+ (para procesamiento de video KYC)

---

## 🔧 Configuración

### 1. Variables de Entorno

Copia `.env.example` a `.env` y configura:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=residencias_db
DB_USER=residencias_user
DB_PASSWORD=tu_password

# JWT
JWT_SECRET=tu_secret_key
JWT_EXPIRES_IN=7d

# Encriptación
ENCRYPTION_KEY=REDACTED

# Redis
REDIS_URL=redis://localhost:6379

# KYC
KYC_MAX_ATTEMPTS=3
KYC_MIN_FACE_MATCH_SCORE=80

# Liveness Detection (Opcional - valores por defecto)
BLINK_EAR_THRESHOLD=0.2              # Umbral de detección de parpadeo
MIN_BLINKS_REQUIRED=2                # Mínimo de parpadeos requeridos
HEAD_MOVEMENT_THRESHOLD=15           # Umbral de movimiento de cabeza (grados)
FACE_CONFIDENCE_THRESHOLD=92         # Confianza mínima de detección facial (%)
FACE_MATCH_THRESHOLD=80              # Similitud mínima para match facial (%)
LIVENESS_FRAME_COUNT=30              # Número de frames a analizar
```

Ver [docs/LIVENESS-DETECTION-DEPLOYMENT.md](./docs/LIVENESS-DETECTION-DEPLOYMENT.md) para configuración avanzada de umbrales.

### 2. Generar Clave de Encriptación

```bash
npm run generate:key
```

---

## 🚀 Comandos Disponibles

### Desarrollo
```bash
npm run dev                 # Desarrollo local
npm run docker:dev          # Desarrollo con Docker (hot-reload)
npm run docker:dev:logs     # Ver logs
npm run docker:dev:down     # Detener
```

### Producción
```bash
npm run build               # Compilar TypeScript
npm run start               # Iniciar servidor
npm run docker:up           # Producción con Docker
npm run docker:down         # Detener Docker
```

### Base de Datos
```bash
npm run migrate             # Ejecutar migraciones
npm run migrate:down        # Revertir migraciones
npm run seed                # Seed básico
npm run seed:complete       # Seed completo
npm run sync                # Sincronizar modelos
npm run reset               # Reset completo (sync + seed)
```

### Testing
```bash
npm run test                # Ejecutar tests
npm run test:watch          # Tests en modo watch
npm run test:security       # Tests de seguridad
```

### Utilidades
```bash
npm run download:models     # Descargar modelos face-api
npm run generate:key        # Generar clave de encriptación
npm run check-users         # Verificar usuarios
npm run validate:dependencies # Validar dependencias del sistema (ffmpeg, modelos)
```

---

## 🏗️ Estructura del Proyecto

```
backend-residencias/
├── src/
│   ├── config/           # Configuración (DB, Redis)
│   ├── controllers/      # Controladores de rutas
│   ├── middleware/       # Middlewares (auth, error)
│   ├── models/           # Modelos Sequelize
│   ├── routes/           # Definición de rutas
│   ├── services/         # Lógica de negocio
│   ├── jobs/             # Trabajos programados
│   ├── migrations/       # Migraciones de BD
│   ├── scripts/          # Scripts utilitarios
│   ├── app.ts            # Configuración Express
│   └── index.ts          # Punto de entrada
│
├── storage/              # Almacenamiento KYC
├── logs/                 # Logs de auditoría
├── models/               # Modelos face-api
├── dist/                 # Código compilado
│
├── docker-compose.yml           # Docker producción
├── docker-compose.dev.yml       # Docker desarrollo
├── Dockerfile                   # Build producción
├── Dockerfile.dev               # Build desarrollo
│
└── docs/                 # Documentación adicional
```

---

## 🔐 Características de Seguridad

- ✅ Autenticación JWT
- ✅ Encriptación de datos sensibles
- ✅ Verificación biométrica (KYC)
- ✅ Detección de vida (Liveness Detection)
  - Análisis de parpadeo mediante Eye Aspect Ratio (EAR)
  - Validación de movimiento de cabeza
  - Análisis de calidad de video
  - Prevención de ataques de presentación (fotos, pantallas, videos pregrabados)
- ✅ Rate limiting
- ✅ Validación de entrada
- ✅ Logs de auditoría
- ✅ GDPR compliance
- ✅ Protección CSRF
- ✅ Headers de seguridad

---

## 🎯 Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuario actual

### KYC
- `POST /api/kyc/verify` - Iniciar verificación
- `GET /api/kyc/status` - Estado verificación
- `POST /api/kyc/documents` - Subir documentos

**Flujo de Verificación KYC con Liveness Detection:**

1. Usuario sube documento de identidad (frente y reverso)
2. Sistema extrae datos mediante OCR (Tesseract.js)
3. Usuario graba video de liveness (3-5 segundos)
4. Sistema analiza video:
   - Extrae 30 frames con FFmpeg
   - Detecta parpadeos usando Eye Aspect Ratio (EAR)
   - Valida movimiento natural de cabeza
   - Analiza calidad de frames (brillo, nitidez, confianza facial)
5. Sistema compara rostro del video con documento
6. Verificación aprobada o rechazada con razón específica

**Códigos de Respuesta:**
- `approved` - Verificación exitosa
- `rejected` - Verificación rechazada
  - `LIVENESS_FAILED` - No se detectaron suficientes parpadeos
  - `POOR_QUALITY` - Calidad de video insuficiente
  - `FACE_MISMATCH` - Rostros no coinciden
  - `UNDERAGE` - Usuario menor de 18 años
  - `INSUFFICIENT_FRAMES` - Video muy corto o corrupto

### Propiedades
- `GET /api/properties` - Listar propiedades
- `POST /api/properties` - Crear propiedad
- `GET /api/properties/:id` - Detalle propiedad
- `PUT /api/properties/:id` - Actualizar propiedad

### Transacciones
- `POST /api/transactions` - Crear transacción
- `GET /api/transactions` - Listar transacciones
- `PUT /api/transactions/:id/status` - Actualizar estado

---

---

## 👁️ Detección de Liveness (Liveness Detection)

### ¿Qué es Liveness Detection?

La detección de liveness es un sistema de seguridad biométrica que verifica que un usuario es una persona real presente durante la verificación, no una foto, video pregrabado o pantalla.

### Cómo Funciona

1. **Análisis de Parpadeo (Eye Aspect Ratio)**
   - Detecta landmarks faciales en cada frame
   - Calcula apertura de ojos usando fórmula EAR
   - Identifica transiciones cerrado → abierto
   - Requiere mínimo 2 parpadeos naturales

2. **Validación de Movimiento de Cabeza**
   - Calcula ángulo de rotación en cada frame
   - Detecta movimientos significativos (> 5 grados)
   - Valida rango total de movimiento (> 15 grados)

3. **Análisis de Calidad**
   - Brillo: 50-200 (escala 0-255)
   - Nitidez: > 100 (Laplacian variance)
   - Confianza facial: > 92%
   - Mínimo 80% de frames válidos

### Configuración de Umbrales

Los umbrales son configurables mediante variables de entorno:

```env
# Detección de parpadeo
BLINK_EAR_THRESHOLD=0.2        # Menor = más estricto
MIN_BLINKS_REQUIRED=2          # Mayor = más estricto

# Movimiento de cabeza
HEAD_MOVEMENT_THRESHOLD=15     # Mayor = menos estricto

# Calidad de imagen
FACE_CONFIDENCE_THRESHOLD=92   # Mayor = más estricto
FACE_MATCH_THRESHOLD=80        # Mayor = más estricto
```

### Perfiles de Configuración

**Alta Seguridad** (aplicaciones financieras):
```env
BLINK_EAR_THRESHOLD=0.18
MIN_BLINKS_REQUIRED=3
FACE_CONFIDENCE_THRESHOLD=95
FACE_MATCH_THRESHOLD=85
```

**Balanceado** (recomendado):
```env
BLINK_EAR_THRESHOLD=0.2
MIN_BLINKS_REQUIRED=2
FACE_CONFIDENCE_THRESHOLD=92
FACE_MATCH_THRESHOLD=80
```

**Alta Usabilidad** (onboarding rápido):
```env
BLINK_EAR_THRESHOLD=0.22
MIN_BLINKS_REQUIRED=1
FACE_CONFIDENCE_THRESHOLD=88
FACE_MATCH_THRESHOLD=75
```

### Ejemplo de Uso

```typescript
// El análisis de liveness se ejecuta automáticamente
// al subir un video en el flujo KYC

const response = await fetch('/api/kyc/documents', {
  method: 'POST',
  body: formData // Incluye video de liveness
});

const result = await response.json();

if (result.success) {
  console.log('Verificación exitosa');
  console.log('Parpadeos detectados:', result.metadata.blinkCount);
  console.log('Movimiento de cabeza:', result.metadata.headMovementRange);
} else {
  console.error('Verificación rechazada:', result.error.code);
  // Códigos posibles:
  // - LIVENESS_FAILED: No se detectaron suficientes parpadeos
  // - POOR_QUALITY: Calidad de video insuficiente
  // - FACE_MISMATCH: Rostros no coinciden
}
```

### Requisitos del Sistema

- **FFmpeg 4.0+**: Para extracción de frames
- **Modelos face-api.js**: Para detección facial y landmarks
- **Recursos**: 2GB RAM, 2 CPU cores mínimo

Ver [docs/LIVENESS-DETECTION-DEPLOYMENT.md](./docs/LIVENESS-DETECTION-DEPLOYMENT.md) para guía completa de deployment.

---

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm run test

# Tests con coverage
npm run test -- --coverage

# Tests específicos
npm run test -- kyc

# Tests en modo watch
npm run test:watch
```

---

## 🐳 Docker

### Modo Desarrollo (Hot-Reload)
```bash
# Iniciar
npm run docker:dev

# Ver logs
npm run docker:dev:logs

# Detener
npm run docker:dev:down
```

### Modo Producción
```bash
# Iniciar
npm run docker:up

# Ver logs
npm run docker:logs

# Detener
npm run docker:down
```

Ver [DOCKER-INDEX.md](./DOCKER-INDEX.md) para documentación completa.

---

## 📊 Monitoreo

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Métricas
```bash
curl http://localhost:3001/api/metrics
```

---

## 🔄 Workflow de Desarrollo

1. **Inicia el entorno**
   ```bash
   npm run docker:dev
   ```

2. **Ejecuta migraciones** (primera vez)
   ```bash
   docker-compose -f docker-compose.dev.yml exec backend npm run migrate
   ```

3. **Ejecuta seeds** (primera vez)
   ```bash
   docker-compose -f docker-compose.dev.yml exec backend npm run seed:complete
   ```

4. **Desarrolla**
   - Edita código en `src/`
   - Los cambios se reflejan automáticamente
   - Revisa logs en la terminal

5. **Prueba**
   ```bash
   npm run test
   ```

6. **Detén el entorno**
   ```bash
   npm run docker:dev:down
   ```

---

## 🐛 Troubleshooting

### Puerto ocupado
```bash
# Ver qué usa el puerto
netstat -ano | findstr :3001

# Detener contenedores
npm run docker:down
```

### Cambios no se reflejan
```bash
# En desarrollo
docker-compose -f docker-compose.dev.yml restart backend

# En producción
npm run docker:up
```

### Error de base de datos
```bash
# Limpiar y reiniciar
npm run docker:dev:clean
npm run docker:dev
```

Ver más en [GUIA-DOCKER.md](./GUIA-DOCKER.md#troubleshooting)

---

## 📝 Licencia

Privado - Todos los derechos reservados

---

## 👥 Equipo

Backend desarrollado para sistema de gestión de residencias.

---

## 📞 Soporte

Para problemas o preguntas:
1. Revisa la [documentación Docker](./DOCKER-INDEX.md)
2. Consulta [GUIA-DOCKER.md](./GUIA-DOCKER.md)
3. Revisa los logs: `npm run docker:dev:logs`
