# Sistema de KYC por Niveles

## Descripción General

El sistema KYC (Know Your Customer) ha sido implementado con un enfoque progresivo de 3 niveles, permitiendo a los estudiantes completar el proceso de verificación de identidad paso a paso, guardando su progreso en cada etapa.

## Niveles del KYC

### Nivel 1: Información Básica
**Objetivo:** Recopilar datos personales básicos del estudiante

**Datos requeridos:**
- Nombre completo
- Tipo de documento (cédula, pasaporte, etc.)
- Número de documento
- Fecha de nacimiento

**Estado:** `level_1_in_progress` → `level_1_completed`

**Características:**
- No requiere revisión del operador
- Se completa automáticamente al enviar los datos
- Permite continuar al Nivel 2

### Nivel 2: Información Adicional
**Objetivo:** Recopilar información complementaria del estudiante

**Datos requeridos:**
- Nacionalidad
- Dirección completa
- Información de contacto adicional

**Prerequisito:** Nivel 1 completado

**Estado:** `level_2_in_progress` → `level_2_completed`

**Características:**
- No requiere revisión del operador
- Se completa automáticamente al enviar los datos
- Permite continuar al Nivel 3

### Nivel 3: Documentos y Verificación
**Objetivo:** Subir documentos de identidad y realizar verificación biométrica

**Datos requeridos:**
- Foto del documento de identidad (frente)
- Foto del documento de identidad (reverso)
- Selfie del estudiante
- Selfie con documento
- Video de liveness (prueba de vida)
- Comprobante de domicilio

**Prerequisito:** Nivel 2 completado

**Estado:** `level_3_in_progress` → `level_3_completed` → `pending_review`

**Características:**
- **Requiere revisión del operador**
- Al completarse, se envía automáticamente al panel de aprobaciones
- Los operadores reciben notificación por email
- El estudiante debe esperar la aprobación/rechazo del operador

## Flujo del Proceso

```
not_started
    ↓
level_1_in_progress → level_1_completed
    ↓
level_2_in_progress → level_2_completed
    ↓
level_3_in_progress → level_3_completed → pending_review
    ↓
under_review → approved / rejected
```

## Endpoints de la API

### 1. Guardar Progreso del Nivel
```
POST /api/kyc/level/save
```

**Autenticación:** JWT requerido

**Body:**
```json
{
  "level": 1,
  "data": {
    "fullName": "Juan Pérez",
    "documentType": "cedula",
    "documentNumber": "12345678",
    "dateOfBirth": "1995-05-15"
  }
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "message": "Progreso del nivel 1 guardado exitosamente",
    "level": 1,
    "savedAt": "2026-04-09T10:30:00.000Z"
  }
}
```

### 2. Completar Nivel
```
POST /api/kyc/level/complete
```

**Autenticación:** JWT requerido

**Body:**
```json
{
  "level": 1,
  "data": {
    "fullName": "Juan Pérez",
    "documentType": "cedula",
    "documentNumber": "12345678",
    "dateOfBirth": "1995-05-15"
  }
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "message": "Nivel 1 completado exitosamente. Puedes continuar con el nivel 2.",
    "level": 1,
    "status": "level_1_completed",
    "currentLevel": 1,
    "completedAt": "2026-04-09T10:30:00.000Z",
    "requiresReview": false
  }
}
```

**Respuesta Nivel 3:**
```json
{
  "success": true,
  "data": {
    "message": "Nivel 3 completado exitosamente. Tu solicitud ha sido enviada al panel de aprobaciones del operador.",
    "level": 3,
    "status": "pending_review",
    "currentLevel": 3,
    "completedAt": "2026-04-09T10:30:00.000Z",
    "requiresReview": true
  }
}
```

### 3. Obtener Progreso Actual
```
GET /api/kyc/level/progress
```

**Autenticación:** JWT requerido

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "hasVerification": true,
    "verificationId": 123,
    "currentLevel": 2,
    "status": "level_2_completed",
    "verificationLevel": 0,
    "levels": {
      "level1": {
        "completed": true,
        "completedAt": "2026-04-09T10:30:00.000Z",
        "data": {
          "fullName": "Juan Pérez",
          "documentType": "cedula",
          "documentNumber": "12345678",
          "dateOfBirth": "1995-05-15"
        }
      },
      "level2": {
        "completed": true,
        "completedAt": "2026-04-09T11:00:00.000Z",
        "data": {
          "nationality": "Colombiana",
          "address": "Calle Principal #123"
        }
      },
      "level3": {
        "completed": false,
        "completedAt": null,
        "data": null
      }
    },
    "createdAt": "2026-04-09T10:00:00.000Z",
    "updatedAt": "2026-04-09T11:00:00.000Z"
  }
}
```

## Panel de Operador

### Notificaciones Automáticas

Cuando un estudiante completa el Nivel 3, el sistema:

1. Cambia el estado a `pending_review`
2. Envía notificación por email a todos los operadores
3. La verificación aparece en el panel de aprobaciones (`/api/kyc/admin/pending`)

### Endpoints de Operador

Los endpoints existentes funcionan sin cambios:

- `GET /api/kyc/admin/pending` - Lista de verificaciones pendientes
- `GET /api/kyc/admin/:verificationId` - Detalles de una verificación
- `POST /api/kyc/admin/approve/:verificationId` - Aprobar verificación
- `POST /api/kyc/admin/reject/:verificationId` - Rechazar verificación

## Modelo de Datos

### Nuevos Campos en `kyc_verifications`

```typescript
{
  currentLevel: number;           // Nivel actual (0-3)
  level1Data: Record<string, any>; // Datos del nivel 1
  level2Data: Record<string, any>; // Datos del nivel 2
  level3Data: Record<string, any>; // Datos del nivel 3
  level1CompletedAt: Date;        // Fecha de completado nivel 1
  level2CompletedAt: Date;        // Fecha de completado nivel 2
  level3CompletedAt: Date;        // Fecha de completado nivel 3
}
```

### Nuevos Estados

- `level_1_in_progress`
- `level_1_completed`
- `level_2_in_progress`
- `level_2_completed`
- `level_3_in_progress`
- `level_3_completed`

## Validaciones

### Progreso Secuencial

El sistema valida que los niveles se completen en orden:

- No se puede completar Nivel 2 sin haber completado Nivel 1
- No se puede completar Nivel 3 sin haber completado Nivel 2

### Guardado de Progreso

- Se puede guardar progreso parcial en cualquier momento con `/level/save`
- El progreso se mantiene incluso si el usuario cierra la sesión
- El usuario puede retomar desde donde dejó

## Migración

Para aplicar los cambios a la base de datos:

```bash
npm run migrate
```

Esto ejecutará la migración `20260409-add-kyc-levels.ts` que:
- Agrega los nuevos estados al ENUM
- Crea las nuevas columnas
- Crea índices necesarios

## Ejemplo de Uso Completo

### 1. Iniciar Verificación
```bash
POST /api/kyc/start
```

### 2. Completar Nivel 1
```bash
POST /api/kyc/level/complete
Body: { level: 1, data: {...} }
```

### 3. Completar Nivel 2
```bash
POST /api/kyc/level/complete
Body: { level: 2, data: {...} }
```

### 4. Subir Documentos (Nivel 3)
```bash
POST /api/kyc/upload
Body: { verificationId, documentType: "id_front", file }

POST /api/kyc/upload
Body: { verificationId, documentType: "id_back", file }

POST /api/kyc/upload
Body: { verificationId, documentType: "selfie", file }

# ... otros documentos
```

### 5. Completar Nivel 3
```bash
POST /api/kyc/level/complete
Body: { level: 3, data: {...} }
```

**Resultado:** La solicitud se envía automáticamente al panel de operador

### 6. Operador Revisa y Aprueba
```bash
POST /api/kyc/admin/approve/:verificationId
Body: { notes: "Documentos verificados correctamente" }
```

## Consideraciones de Seguridad

- Todos los endpoints requieren autenticación JWT
- Los datos sensibles se almacenan encriptados
- Los documentos se almacenan con encriptación AES-256-GCM
- Los operadores reciben notificaciones solo por email configurado
- Se registran todas las acciones en logs de auditoría

## Próximos Pasos

1. Implementar frontend para el flujo de niveles
2. Agregar validaciones adicionales por nivel
3. Implementar sistema de recordatorios para niveles incompletos
4. Agregar métricas de tiempo promedio por nivel
