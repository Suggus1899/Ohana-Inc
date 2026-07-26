# Migración: kyc_verifications

## Descripción

Migración que crea la tabla `kyc_verifications` para el sistema KYC (Know Your Customer) de verificación de identidad.

## Archivo

`20260405-create-kyc-verifications.ts`

## Requisitos Implementados

Requisitos 16.1-16.15 del documento de requisitos KYC:

- ✅ 16.1: Tabla con campos obligatorios (id, userId, status, verificationLevel)
- ✅ 16.2: userId como UNIQUE con FK a users(id)
- ✅ 16.3: ENUM status con 9 valores
- ✅ 16.4: verificationLevel como INTEGER (0-5)
- ✅ 16.5: Campos de información personal
- ✅ 16.6: Campos de URLs de documentos
- ✅ 16.7: Campos de puntuaciones DECIMAL(5,2)
- ✅ 16.8: Campo ocrData como JSONB
- ✅ 16.9: Campos de revisión manual
- ✅ 16.10: Campos de metadata
- ✅ 16.11: Timestamps automáticos (createdAt, updatedAt)
- ✅ 16.12: Índices en userId, status, verificationLevel, documentNumber, createdAt, reviewedBy
- ✅ 16.13: Valor por defecto 'not_started' para status
- ✅ 16.14: Valor por defecto 0 para verificationLevel
- ✅ 16.15: Valor por defecto 0 para attempts

## Estructura de la Tabla

### Campos Principales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | Primary key, autoincremental |
| userId | INTEGER | FK a users(id), UNIQUE |
| status | ENUM | Estado de la verificación (9 valores) |
| verificationLevel | INTEGER | Nivel de verificación (0-5) |

### Información Personal

| Campo | Tipo | Descripción |
|-------|------|-------------|
| fullName | VARCHAR(255) | Nombre completo |
| documentNumber | VARCHAR(50) | Número de documento |
| documentType | VARCHAR(50) | Tipo de documento |
| dateOfBirth | DATE | Fecha de nacimiento |
| nationality | VARCHAR(50) | Nacionalidad |
| address | TEXT | Dirección |

### URLs de Documentos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| documentFrontUrl | TEXT | URL documento frente |
| documentBackUrl | TEXT | URL documento reverso |
| selfieUrl | TEXT | URL selfie |
| selfieWithDocumentUrl | TEXT | URL selfie con documento |
| livenessVideoUrl | TEXT | URL video liveness |
| proofOfAddressUrl | TEXT | URL comprobante domicilio |

### Puntuaciones

| Campo | Tipo | Descripción |
|-------|------|-------------|
| faceMatchScore | DECIMAL(5,2) | Puntuación coincidencia facial (0-100) |
| livenessScore | DECIMAL(5,2) | Puntuación detección de vida (0-100) |
| documentValidityScore | DECIMAL(5,2) | Puntuación validez documento (0-100) |
| fraudScore | DECIMAL(5,2) | Puntuación riesgo de fraude (0-100) |

### Datos OCR y Revisión

| Campo | Tipo | Descripción |
|-------|------|-------------|
| ocrData | JSONB | Datos extraídos por OCR |
| reviewedBy | INTEGER | FK a users(id) - operador revisor |
| reviewedAt | TIMESTAMP | Fecha/hora de revisión |
| reviewNotes | TEXT | Notas del operador |
| rejectionReason | TEXT | Razón del rechazo |

### Metadata

| Campo | Tipo | Descripción |
|-------|------|-------------|
| attempts | INTEGER | Número de intentos (default: 0) |
| lastAttemptAt | TIMESTAMP | Fecha/hora último intento |
| verifiedAt | TIMESTAMP | Fecha/hora de aprobación |
| expiresAt | TIMESTAMP | Fecha de expiración |
| createdAt | TIMESTAMP | Fecha de creación |
| updatedAt | TIMESTAMP | Fecha de actualización |

## ENUM: status

Valores del ENUM `enum_kyc_verifications_status`:

1. `not_started` - Sin iniciar
2. `in_progress` - En progreso
3. `documents_uploaded` - Documentos subidos
4. `pending_review` - Pendiente de revisión
5. `under_review` - En revisión
6. `approved` - Aprobado
7. `rejected` - Rechazado
8. `expired` - Expirado
9. `resubmission_required` - Requiere reenvío

## Índices Creados

1. `kyc_verifications_pkey` - Primary key en id
2. `kyc_verifications_userId_key` - UNIQUE constraint en userId
3. `kyc_verifications_user_id` - Índice UNIQUE en userId
4. `kyc_verifications_status_idx` - Índice en status
5. `kyc_verifications_verification_level_idx` - Índice en verificationLevel
6. `kyc_verifications_document_number_idx` - Índice en documentNumber
7. `kyc_verifications_created_at_idx` - Índice en createdAt
8. `kyc_verifications_reviewed_by_idx` - Índice en reviewedBy

## Foreign Keys

1. `userId` → `users(id)` (CASCADE on DELETE/UPDATE)
2. `reviewedBy` → `users(id)` (SET NULL on DELETE, CASCADE on UPDATE)

## Ejecución

### Aplicar migración

```bash
npx ts-node src/scripts/run-kyc-migration.ts up
```

### Revertir migración

```bash
npx ts-node src/scripts/run-kyc-migration.ts down
```

### Verificar tabla

```bash
npx ts-node src/scripts/verify-kyc-table.ts
```

## Resultado de la Verificación

```
✅ Tabla kyc_verifications existe
📋 Total de columnas: 31
📋 Valores del ENUM status: 9
📋 Total de índices: 8
📋 Foreign Keys: 2
```

## Notas

- La tabla usa JSONB para `ocrData` permitiendo almacenar datos estructurados flexibles
- Los campos DECIMAL(5,2) permiten valores de 0.00 a 999.99 para las puntuaciones
- El campo `userId` es UNIQUE garantizando una sola verificación activa por usuario
- Los timestamps se manejan automáticamente por Sequelize
- Todos los comentarios de columnas están en español para consistencia con el proyecto
