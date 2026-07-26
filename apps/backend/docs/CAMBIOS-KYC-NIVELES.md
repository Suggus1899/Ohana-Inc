# Resumen de Cambios - Sistema KYC por Niveles

## Fecha: 9 de Abril, 2026

## Descripción General

Se ha implementado un sistema de KYC (Know Your Customer) progresivo de 3 niveles que permite a los estudiantes completar el proceso de verificación de identidad paso a paso, guardando su progreso en cada etapa. Cuando un estudiante completa el nivel 3, la solicitud se envía automáticamente al panel de aprobaciones del operador.

## Archivos Modificados

### 1. Modelo de Datos
**Archivo:** `src/models/KYCVerification.ts`

**Cambios:**
- Agregados nuevos estados al enum `VerificationStatus`:
  - `level_1_in_progress`
  - `level_1_completed`
  - `level_2_in_progress`
  - `level_2_completed`
  - `level_3_in_progress`
  - `level_3_completed`

- Agregados nuevos campos al modelo:
  - `currentLevel: number` - Nivel actual del usuario (0-3)
  - `level1Data: Record<string, any>` - Datos guardados del nivel 1
  - `level2Data: Record<string, any>` - Datos guardados del nivel 2
  - `level3Data: Record<string, any>` - Datos guardados del nivel 3
  - `level1CompletedAt: Date` - Fecha de completado del nivel 1
  - `level2CompletedAt: Date` - Fecha de completado del nivel 2
  - `level3CompletedAt: Date` - Fecha de completado del nivel 3

### 2. Controlador KYC
**Archivo:** `src/controllers/kyc.controller.ts`

**Nuevos endpoints agregados:**

1. **`saveLevelProgress`** - `POST /api/kyc/level/save`
   - Guarda el progreso parcial de un nivel
   - Permite al usuario guardar y retomar más tarde
   - No requiere que el nivel esté completo

2. **`completeLevel`** - `POST /api/kyc/level/complete`
   - Completa un nivel específico (1, 2 o 3)
   - Valida que los niveles anteriores estén completados
   - Nivel 3 envía automáticamente a revisión del operador

3. **`getLevelProgress`** - `GET /api/kyc/level/progress`
   - Obtiene el progreso actual del usuario
   - Retorna información de los 3 niveles
   - Indica qué niveles están completados

### 3. Servicio KYC
**Archivo:** `src/services/kyc.service.ts`

**Nuevos métodos agregados:**

1. **`saveLevelProgress(verificationId, level, data)`**
   - Guarda datos parciales de un nivel
   - Actualiza el `currentLevel` si es mayor
   - Cambia el estado a `level_X_in_progress`

2. **`completeLevel(verificationId, level, data)`**
   - Completa un nivel y guarda la fecha de completado
   - Valida prerequisitos (niveles anteriores completados)
   - Nivel 3: cambia estado a `pending_review` y notifica operadores
   - Retorna información del nivel completado

### 4. Servicio de Notificaciones
**Archivo:** `src/services/notification.service.ts`

**Nuevo método agregado:**

1. **`notifyOperatorsNewKYCPending(userId)`**
   - Envía email a todos los operadores
   - Notifica que hay una nueva verificación pendiente
   - Incluye enlace directo al panel de aprobaciones

**Nueva plantilla de email:**
- `getNewKYCPendingTemplate(userName)` - Template para notificación de KYC pendiente

### 5. Rutas
**Archivo:** `src/routes/kyc.routes.ts`

**Nuevas rutas agregadas:**
```typescript
router.post('/level/save', authenticate, saveLevelProgress);
router.post('/level/complete', authenticate, completeLevel);
router.get('/level/progress', authenticate, getLevelProgress);
```

### 6. Migración de Base de Datos
**Archivo:** `src/migrations/20260409-add-kyc-levels.ts`

**Cambios en la base de datos:**
- Agrega nuevos valores al ENUM `enum_kyc_verifications_status`
- Crea columna `currentLevel` (INTEGER)
- Crea columnas `level1Data`, `level2Data`, `level3Data` (JSONB)
- Crea columnas `level1CompletedAt`, `level2CompletedAt`, `level3CompletedAt` (DATE)
- Crea índice `kyc_verifications_current_level_idx`

## Archivos Nuevos Creados

### 1. Documentación del Sistema
**Archivo:** `docs/KYC_LEVELS_SYSTEM.md`

Documentación completa del sistema de niveles incluyendo:
- Descripción de cada nivel
- Flujo del proceso
- Endpoints de la API con ejemplos
- Modelo de datos
- Validaciones
- Instrucciones de migración

### 2. Ejemplo de Integración Frontend
**Archivo:** `docs/KYC_FRONTEND_EXAMPLE.md`

Ejemplo completo de implementación en React incluyendo:
- Componente completo con los 3 niveles
- Auto-guardado de progreso
- Indicador visual de progreso
- Estilos CSS sugeridos
- Manejo de estados y errores

### 3. Resumen de Cambios
**Archivo:** `CAMBIOS-KYC-NIVELES.md` (este archivo)

## Flujo del Sistema

### Flujo del Estudiante

1. **Inicio**: Usuario inicia verificación con `POST /api/kyc/start`
2. **Nivel 1**: Completa información básica
   - Nombre, documento, fecha de nacimiento
   - Estado: `level_1_in_progress` → `level_1_completed`
3. **Nivel 2**: Completa información adicional
   - Nacionalidad, dirección
   - Estado: `level_2_in_progress` → `level_2_completed`
4. **Nivel 3**: Sube documentos
   - Fotos de documento, selfies, video liveness
   - Estado: `level_3_in_progress` → `level_3_completed` → `pending_review`
5. **Notificación**: Sistema notifica automáticamente a operadores
6. **Espera**: Usuario espera aprobación del operador

### Flujo del Operador

1. **Notificación**: Recibe email cuando hay nueva verificación pendiente
2. **Revisión**: Accede al panel de aprobaciones
3. **Decisión**: Aprueba o rechaza la verificación
4. **Notificación**: Usuario recibe resultado por email

## Características Principales

### 1. Progreso Guardado
- El usuario puede guardar progreso en cualquier momento
- El progreso persiste entre sesiones
- Puede retomar desde donde dejó

### 2. Validación Secuencial
- No se puede saltar niveles
- Cada nivel valida que el anterior esté completado
- Mensajes de error claros si intenta saltar niveles

### 3. Notificaciones Automáticas
- Operadores reciben email cuando se completa nivel 3
- Email incluye información del usuario
- Enlace directo al panel de aprobaciones

### 4. Panel de Operador
- Los endpoints existentes funcionan sin cambios
- Las verificaciones con nivel 3 completado aparecen en `pending_review`
- Operadores pueden aprobar/rechazar normalmente

## Endpoints de la API

### Endpoints del Estudiante

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/kyc/level/save` | Guardar progreso parcial |
| POST | `/api/kyc/level/complete` | Completar un nivel |
| GET | `/api/kyc/level/progress` | Obtener progreso actual |

### Endpoints del Operador (sin cambios)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/kyc/admin/pending` | Lista de verificaciones pendientes |
| GET | `/api/kyc/admin/:verificationId` | Detalles de verificación |
| POST | `/api/kyc/admin/approve/:verificationId` | Aprobar verificación |
| POST | `/api/kyc/admin/reject/:verificationId` | Rechazar verificación |

## Instrucciones de Despliegue

### 1. Aplicar Migración

```bash
cd backend-residencias
npm run migrate
```

Esto ejecutará la migración `20260409-add-kyc-levels.ts` que creará las nuevas columnas y estados.

### 2. Reiniciar Servidor

```bash
npm run dev
# o
npm start
```

### 3. Verificar Funcionamiento

Probar los nuevos endpoints:

```bash
# Obtener progreso
curl -X GET http://localhost:3000/api/kyc/level/progress \
  -H "Authorization: Bearer REDACTED"

# Guardar progreso nivel 1
curl -X POST http://localhost:3000/api/kyc/level/save \
  -H "Authorization: Bearer REDACTED" \
  -H "Content-Type: application/json" \
  -d '{
    "level": 1,
    "data": {
      "fullName": "Juan Pérez",
      "documentType": "cedula",
      "documentNumber": "12345678",
      "dateOfBirth": "1995-05-15"
    }
  }'

# Completar nivel 1
curl -X POST http://localhost:3000/api/kyc/level/complete \
  -H "Authorization: Bearer REDACTED" \
  -H "Content-Type: application/json" \
  -d '{
    "level": 1,
    "data": {
      "fullName": "Juan Pérez",
      "documentType": "cedula",
      "documentNumber": "12345678",
      "dateOfBirth": "1995-05-15"
    }
  }'
```

## Compatibilidad con Sistema Existente

### Endpoints Existentes
Todos los endpoints existentes siguen funcionando sin cambios:
- `POST /api/kyc/start`
- `POST /api/kyc/upload`
- `POST /api/kyc/process/:verificationId`
- `GET /api/kyc/status`
- Endpoints de operador

### Datos Existentes
Las verificaciones existentes en la base de datos:
- Seguirán funcionando normalmente
- Tendrán `currentLevel = 0` por defecto
- No se verán afectadas por los cambios

### Migración Gradual
El sistema permite:
- Usar el flujo antiguo (sin niveles)
- Usar el nuevo flujo (con niveles)
- Ambos pueden coexistir

## Consideraciones de Seguridad

1. **Autenticación**: Todos los endpoints requieren JWT válido
2. **Autorización**: Solo el usuario puede ver/modificar su propio progreso
3. **Validación**: Se valida que los niveles se completen en orden
4. **Encriptación**: Los documentos siguen encriptados con AES-256-GCM
5. **Auditoría**: Todas las acciones se registran en logs

## Próximos Pasos Sugeridos

1. **Frontend**: Implementar interfaz de usuario basada en el ejemplo
2. **Validaciones**: Agregar validaciones específicas por nivel
3. **Recordatorios**: Sistema de recordatorios para niveles incompletos
4. **Métricas**: Agregar métricas de tiempo promedio por nivel
5. **Tests**: Agregar tests unitarios y de integración

## Soporte

Para preguntas o problemas:
1. Revisar documentación en `docs/KYC_LEVELS_SYSTEM.md`
2. Revisar ejemplo de frontend en `docs/KYC_FRONTEND_EXAMPLE.md`
3. Verificar logs del servidor para errores
4. Revisar logs de auditoría para seguimiento de acciones

## Notas Adicionales

- El sistema es retrocompatible con verificaciones existentes
- Los operadores no necesitan cambiar su flujo de trabajo
- Las notificaciones por email requieren configuración SMTP
- Se recomienda probar en ambiente de desarrollo antes de producción
