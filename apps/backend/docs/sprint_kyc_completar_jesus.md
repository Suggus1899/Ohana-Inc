# Instrucciones para Completar la Implementación del Sistema KYC

## Análisis del Estado Actual

### ✅ Componentes Implementados (Backend - 95% completo)

El backend del sistema KYC está prácticamente completo:

1. **Modelos de Base de Datos**
   - `KYCVerification`: Modelo completo con todos los campos necesarios
   - `KYCDocument`: Gestión de documentos encriptados
   - `KYCAttempt`: Registro de intentos y pasos del proceso
   - `User`: Campo `verificationLevel` (0-5) ya implementado

2. **Servicios Backend**
   - `KYCService`: Servicio completo con todos los métodos necesarios
   - `EncryptionService`: Encriptación AES-256-GCM de documentos
   - `StorageService`: Almacenamiento seguro de archivos
   - `OCRService`: Extracción de datos de documentos
   - `FaceMatchService`: Comparación facial con face-api.js
   - `LivenessDetectionService`: Detección de vida con análisis de parpadeo y movimiento
   - `NotificationService`: Sistema completo de emails (aprobación, rechazo, expiración, alertas)
   - `AuditLoggerService`: Logs de auditoría para cumplimiento

3. **Controlador KYC**
   - Endpoints completos para todo el flujo (1565 líneas)
   - Subida de documentos
   - Procesamiento automático
   - Aprobación/rechazo manual por operadores
   - Consulta de estado
   - Filtros avanzados para operadores

4. **Sistema de Niveles KYC**
   - Nivel 0: Sin verificación
   - Nivel 1: Datos básicos completados
   - Nivel 2: Documentos de identidad subidos
   - Nivel 3: Documentos aprobados por OCR
   - Nivel 4: Biometría aprobada (face match + liveness)
   - Nivel 5: Aprobación manual del operador (verificación completa)

5. **Sistema de Notificaciones**
   - Emails de confirmación de recepción de documentos
   - Emails de revisión pendiente
   - Emails de aprobación con felicitación
   - Emails de rechazo con razón y pasos para reintentar
   - Emails de recordatorio de expiración (30 días antes)
   - Emails de expiración
   - Alertas a operadores (cola excesiva, tasa de rechazo alta)
   - Notificación a operadores cuando hay nueva verificación pendiente

### ⚠️ Componentes Parcialmente Implementados (Frontend - 60% completo)

1. **Panel de Operador - KYCSection.tsx**
   - ✅ Interfaz visual completa con estadísticas
   - ✅ Lista de verificaciones con filtros de búsqueda
   - ✅ Badges de estado (pendiente, aprobado, rechazado)
   - ❌ **PROBLEMA**: Usa datos mock (`mockKYCVerifications`)
   - ❌ **FALTA**: Conexión con API real del backend
   - ❌ **FALTA**: Funcionalidad de botones "Ver Documentos", "Aprobar", "Rechazar"

2. **Panel de Revisión - KYCReviewPanel.tsx**
   - ✅ Interfaz completa con filtros avanzados
   - ✅ Vista de lista de verificaciones pendientes
   - ✅ Vista de detalles con información personal
   - ✅ Grid 2x2 para mostrar documentos
   - ✅ Tarjetas de puntuaciones con colores distintivos (azul, verde, morado, rojo)
   - ✅ Botones de aprobar/rechazar con modales de confirmación
   - ✅ Conexión con API real (`api.getPendingKYCVerifications`, `api.approveKYCVerification`, `api.rejectKYCVerification`)
   - ❌ **PROBLEMA**: Imágenes de documentos son placeholders
   - ❌ **FALTA**: Endpoint para descargar/visualizar documentos encriptados
   - ❌ **FALTA**: Implementar visualización real de documentos

3. **Flujo del Estudiante - KYCFlow.tsx**
   - ✅ Componente de flujo KYC para estudiantes
   - ✅ Captura de documentos y selfies
   - ✅ Grabación de video de liveness
   - ⚠️ **PARCIAL**: Conexión con backend (necesita verificación)

### ❌ Componentes Faltantes (0% implementado)

1. **Badge de Verificación en Perfil de Usuario**
   - No existe implementación de badge verificado en avatar/perfil
   - No hay indicador visual de verificación en ningún componente
   - El campo `verificationLevel` existe en User pero no se muestra visualmente

2. **Integración Panel Operador con Backend**
   - KYCSection.tsx usa datos mock en lugar de API real
   - Falta implementar llamadas a endpoints del backend

3. **Visualización de Documentos Encriptados**
   - Falta endpoint para descargar documentos desencriptados temporalmente
   - Falta componente para visualizar documentos en modal

---

## 📋 Tareas para Completar el Sistema KYC (100%)

### FASE 1: Endpoint de Visualización de Documentos (Backend)

**Tiempo estimado: 2-3 horas**

#### Tarea 1.1: Crear endpoint para descargar documento desencriptado

**Archivo**: `backend-residencias/src/controllers/kyc.controller.ts`

**Instrucciones**:
1. Agregar nuevo endpoint GET `/api/kyc/verifications/:verificationId/documents/:documentId/view`
2. Este endpoint debe:
   - Validar que el usuario sea operador (role === 'operator')
   - Obtener el documento por ID
   - Verificar que el documento pertenece a la verificación especificada
   - Desencriptar el documento usando `KYCService.decryptDocument()`
   - Registrar el acceso en audit log usando `KYCService.logDocumentAccess()`
   - Devolver el archivo desencriptado con el Content-Type correcto
   - Agregar headers de seguridad: `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`
3. El archivo debe enviarse como stream para optimizar memoria
4. Implementar rate limiting: máximo 50 requests por minuto por operador

**Consideraciones de seguridad**:
- Solo operadores pueden acceder
- Registrar cada acceso en audit log
- No cachear documentos en el navegador
- Validar que el documento existe y pertenece a la verificación

#### Tarea 1.2: Agregar método en KYCService para desencriptar documento

**Archivo**: `backend-residencias/src/services/kyc.service.ts`

**Instrucciones**:
1. El método privado `decryptDocument()` ya existe
2. Crear método público `getDecryptedDocument(documentId: number, operatorId: number): Promise<Buffer>`
3. Este método debe:
   - Obtener el documento por ID
   - Validar que existe
   - Llamar al método privado `decryptDocument()`
   - Registrar acceso con `logDocumentAccess()`
   - Devolver el buffer desencriptado

---

### FASE 2: Integración Frontend - Panel de Operador

**Tiempo estimado: 4-5 horas**

#### Tarea 2.1: Conectar KYCSection.tsx con API real

**Archivo**: `frontend-residencias/src/components/dashboard/admin/KYCSection.tsx`

**Instrucciones**:
1. Eliminar import de `mockKYCVerifications`
2. Eliminar componente `<MockDataIndicator />`
3. Agregar estado para cargar verificaciones:
   ```typescript
   const [verifications, setVerifications] = useState([]);
   const [isLoading, setIsLoading] = useState(true);
   ```
4. Agregar `useEffect` para cargar verificaciones al montar:
   - Llamar a `api.getPendingKYCVerifications()` (ya existe en api.ts)
   - Actualizar estado con las verificaciones recibidas
   - Manejar errores con toast
5. Reemplazar `mockKYCVerifications` con `verifications` en el map
6. Agregar indicador de carga mientras `isLoading === true`
7. Implementar funcionalidad del botón "Ver Documentos":
   - Al hacer click, navegar a `/operator/kyc/review/${kyc.id}`
   - O abrir modal con componente KYCReviewPanel
8. Los botones "Aprobar" y "Rechazar" deben:
   - Abrir modal de confirmación
   - Llamar a `api.approveKYCVerification()` o `api.rejectKYCVerification()`
   - Recargar lista después de la acción
   - Mostrar toast de éxito/error

#### Tarea 2.2: Implementar visualización de documentos en KYCReviewPanel.tsx

**Archivo**: `frontend-residencias/src/components/kyc/KYCReviewPanel.tsx`

**Instrucciones**:
1. Agregar estado para documentos:
   ```typescript
   const [documents, setDocuments] = useState<KYCDocument[]>([]);
   ```
2. Cuando se selecciona una verificación, cargar sus documentos:
   - Llamar a endpoint GET `/api/kyc/verifications/${verificationId}/documents`
   - Guardar documentos en estado
3. Reemplazar los placeholders de imágenes con URLs reales:
   - URL debe ser: `/api/kyc/verifications/${verificationId}/documents/${documentId}/view`
   - Agregar token de autenticación en headers
4. Implementar componente de imagen con manejo de errores:
   - Mostrar spinner mientras carga
   - Mostrar mensaje de error si falla
   - Permitir zoom en modal al hacer click
5. Agregar botón "Descargar" para cada documento
6. Los documentos deben mostrarse en este orden:
   - Cédula Frente (id_front)
   - Cédula Reverso (id_back)
   - Selfie (selfie)
   - Selfie con Documento (selfie_with_doc)

#### Tarea 2.3: Agregar método en api.ts para obtener documentos

**Archivo**: `frontend-residencias/src/services/api.ts`

**Instrucciones**:
1. Agregar método `getKYCDocuments(verificationId: number)`:
   - Endpoint: GET `/api/kyc/verifications/${verificationId}/documents`
   - Devolver lista de documentos con sus IDs y tipos
2. Agregar método `getKYCDocumentUrl(verificationId: number, documentId: number)`:
   - Devolver URL completa con token: `/api/kyc/verifications/${verificationId}/documents/${documentId}/view?token=${authToken}`
3. Agregar método `downloadKYCDocument(verificationId: number, documentId: number)`:
   - Descargar documento como blob
   - Crear URL temporal y disparar descarga automática

---

### FASE 3: Badge de Verificación en Perfil de Usuario

**Tiempo estimado: 3-4 horas**

#### Tarea 3.1: Crear componente VerifiedBadge

**Archivo nuevo**: `frontend-residencias/src/components/ui/VerifiedBadge.tsx`

**Instrucciones**:
1. Crear componente que reciba props:
   ```typescript
   interface VerifiedBadgeProps {
     verificationLevel: number;
     size?: 'sm' | 'md' | 'lg';
     showTooltip?: boolean;
   }
   ```
2. El badge debe mostrar:
   - Nivel 0-1: Sin badge
   - Nivel 2-4: Badge amarillo con icono de reloj (en proceso)
   - Nivel 5: Badge verde con checkmark (verificado)
3. Usar icono de Lucide React: `<ShieldCheck />` para verificado, `<Clock />` para en proceso
4. Tamaños:
   - sm: 16x16px
   - md: 20x20px
   - lg: 24x24px
5. Si `showTooltip === true`, mostrar tooltip con:
   - Nivel 5: "Usuario Verificado"
   - Nivel 2-4: "Verificación en Proceso"
6. Estilos:
   - Badge verde: `bg-green-500 text-white`
   - Badge amarillo: `bg-yellow-500 text-white`
   - Posición absoluta para superponerse en avatar: `absolute bottom-0 right-0`

#### Tarea 3.2: Integrar VerifiedBadge en Avatar de Usuario

**Archivos a modificar**:
- `frontend-residencias/src/components/dashboard/student/StudentDashboard.tsx`
- `frontend-residencias/src/components/dashboard/operator/OperatorDashboard.tsx`
- `frontend-residencias/src/components/dashboard/admin/AdminDashboard.tsx`
- Cualquier otro componente que muestre avatar de usuario

**Instrucciones**:
1. Importar componente `VerifiedBadge`
2. Envolver el `<Avatar>` en un contenedor con `position: relative`
3. Agregar `<VerifiedBadge>` después del `<Avatar>`:
   ```tsx
   <div className="relative">
     <Avatar className="h-12 w-12">
       <AvatarFallback>{initials}</AvatarFallback>
     </Avatar>
     <VerifiedBadge 
       verificationLevel={user.verificationLevel} 
       size="md" 
       showTooltip={true}
     />
   </div>
   ```
4. Asegurarse de que `user.verificationLevel` esté disponible en el contexto
5. Si no está disponible, agregarlo al estado del usuario

#### Tarea 3.3: Mostrar badge en lista de usuarios

**Archivos a modificar**:
- `frontend-residencias/src/components/dashboard/operator/UserReportsSection.tsx`
- Cualquier lista que muestre usuarios

**Instrucciones**:
1. En cada fila de usuario, agregar badge junto al nombre
2. Usar tamaño `sm` para listas
3. Ejemplo:
   ```tsx
   <div className="flex items-center gap-2">
     <span>{user.name}</span>
     <VerifiedBadge verificationLevel={user.verificationLevel} size="sm" />
   </div>
   ```

---

### FASE 4: Sistema de Notificaciones para Administrador

**Tiempo estimado: 3-4 horas**

#### Tarea 4.1: Crear modelo de Notificaciones

**Archivo nuevo**: `backend-residencias/src/models/Notification.ts`

**Instrucciones**:
1. Crear modelo `Notification` con los siguientes campos:
   - `id`: INTEGER, primary key, autoincrement
   - `userId`: INTEGER, foreign key a users (el administrador que recibirá la notificación)
   - `type`: ENUM('kyc_document_retention', 'kyc_pending_review', 'system_alert')
   - `title`: STRING(255), título de la notificación
   - `message`: TEXT, mensaje descriptivo
   - `metadata`: JSON, datos adicionales (ej: verificationId, userId del estudiante, documentCount)
   - `isRead`: BOOLEAN, default false
   - `readAt`: DATE, nullable
   - `createdAt`: DATE
   - `updatedAt`: DATE
2. Agregar índices:
   - `userId` + `isRead` (para consultas rápidas de notificaciones no leídas)
   - `type` (para filtrar por tipo)
   - `createdAt` (para ordenar por fecha)

#### Tarea 4.2: Crear servicio de Notificaciones

**Archivo nuevo**: `backend-residencias/src/services/notification-bell.service.ts`

**Instrucciones**:
1. Crear clase `NotificationBellService` con métodos:
   - `createNotification(userId, type, title, message, metadata)`: Crear nueva notificación
   - `getUnreadNotifications(userId)`: Obtener notificaciones no leídas
   - `getAllNotifications(userId, limit, offset)`: Obtener todas las notificaciones paginadas
   - `markAsRead(notificationId, userId)`: Marcar como leída
   - `markAllAsRead(userId)`: Marcar todas como leídas
   - `deleteNotification(notificationId, userId)`: Eliminar notificación
   - `getUnreadCount(userId)`: Obtener contador de no leídas
2. Método especial `notifyAdminDocumentRetention(verificationId, userId, documentCount, daysOld)`:
   - Obtener todos los usuarios con role === 'admin'
   - Para cada admin, crear notificación tipo 'kyc_document_retention'
   - Título: "Documentos KYC pendientes de revisión"
   - Mensaje: "Hay {documentCount} documentos KYC del usuario {userName} con {daysOld} días de antigüedad. Revisa si deben ser eliminados."
   - Metadata: { verificationId, studentUserId, documentCount, daysOld, createdAt }

#### Tarea 4.3: Crear job para notificar retención de documentos

**Archivo nuevo**: `backend-residencias/src/jobs/kyc-document-retention.job.ts`

**Instrucciones**:
1. Crear job que se ejecute diariamente (usar cron o scheduler)
2. El job debe:
   - Buscar todas las verificaciones con status 'approved' o 'rejected'
   - Filtrar las que tengan más de 90 días desde `verifiedAt` o `rejectedAt`
   - Para cada verificación encontrada:
     - Contar documentos asociados
     - Llamar a `NotificationBellService.notifyAdminDocumentRetention()`
3. Registrar en logs cuántas notificaciones se crearon
4. **IMPORTANTE**: Este job NO borra documentos, solo notifica al administrador

#### Tarea 4.4: Crear endpoints de notificaciones

**Archivo**: `backend-residencias/src/controllers/notification.controller.ts`

**Instrucciones**:
1. Crear controlador con endpoints:
   - GET `/api/notifications`: Obtener todas las notificaciones del usuario autenticado (paginado)
   - GET `/api/notifications/unread`: Obtener notificaciones no leídas
   - GET `/api/notifications/count`: Obtener contador de no leídas
   - PUT `/api/notifications/:id/read`: Marcar como leída
   - PUT `/api/notifications/read-all`: Marcar todas como leídas
   - DELETE `/api/notifications/:id`: Eliminar notificación
2. Todos los endpoints deben:
   - Validar autenticación (JWT)
   - Validar que el usuario solo acceda a sus propias notificaciones
3. Agregar rutas en `backend-residencias/src/routes/index.ts`

#### Tarea 4.5: Crear endpoint para eliminar documentos KYC (solo admin)

**Archivo**: `backend-residencias/src/controllers/kyc.controller.ts`

**Instrucciones**:
1. Agregar endpoint DELETE `/api/kyc/verifications/:verificationId/documents`
2. Este endpoint debe:
   - Validar que el usuario sea administrador (role === 'admin')
   - Obtener la verificación por ID
   - Obtener todos los documentos asociados
   - Para cada documento:
     - Eliminar archivo físico encriptado del storage
     - Eliminar registro de la base de datos
   - Registrar eliminación en audit log con `KYCService.logDocumentDeletion()`
   - Actualizar verificación: agregar campo `documentsDeletedAt` y `documentsDeletedBy`
   - Devolver respuesta de éxito con cantidad de documentos eliminados
3. Agregar validación: No permitir eliminar documentos de verificaciones activas (status 'in_progress', 'pending_review', 'under_review')

---

### FASE 5: Notificaciones al Estudiante

**Tiempo estimado: 2-3 horas**

#### Tarea 5.1: Crear componente de notificaciones en dashboard del estudiante

**Archivo**: `frontend-residencias/src/components/dashboard/student/KYCNotifications.tsx`

**Instrucciones**:
1. Crear componente que muestre el estado actual del KYC del estudiante
2. Debe mostrar diferentes mensajes según `verificationLevel`:
   - Nivel 0: "Completa tu verificación KYC para acceder a todas las funcionalidades"
   - Nivel 1-2: "Tu verificación está en proceso. Hemos recibido tus documentos."
   - Nivel 3-4: "Tu verificación está siendo procesada automáticamente."
   - Nivel 5: "¡Tu cuenta está verificada! Tienes acceso completo."
3. Usar componente `<Alert>` de shadcn/ui
4. Colores según nivel:
   - 0: Azul (info)
   - 1-4: Amarillo (warning)
   - 5: Verde (success)
5. Agregar botón "Iniciar Verificación" si nivel === 0
6. Agregar botón "Ver Estado" si nivel > 0

#### Tarea 5.2: Integrar notificaciones en StudentDashboard

**Archivo**: `frontend-residencias/src/components/dashboard/student/StudentDashboard.tsx`

**Instrucciones**:
1. Importar componente `KYCNotifications`
2. Agregar al inicio del dashboard, antes de las tarjetas principales
3. Solo mostrar si `user.verificationLevel < 5`
4. Ejemplo:
   ```tsx
   {user.verificationLevel < 5 && (
     <KYCNotifications verificationLevel={user.verificationLevel} />
   )}
   ```

---

### FASE 6: Implementar Detección de Vida REAL en Frontend

**Tiempo estimado: 8-10 horas**

**PROBLEMA ACTUAL**: El componente `LivenessCapture.tsx` tiene un sistema de gestos simulado que se completa automáticamente cada 3 segundos sin validar si el usuario realmente realizó el gesto. Esto es una simulación que no proporciona seguridad real.

**SOLUCIÓN**: Implementar detección de vida REAL usando face-api.js en el navegador para validar gestos en tiempo real antes de completarlos.

#### Tarea 6.1: Instalar dependencias de face-api.js en frontend

**Archivo**: `frontend-residencias/package.json`

**Instrucciones**:
1. Instalar face-api.js para navegador:
   ```bash
   npm install @vladmandic/face-api
   ```
2. Descargar modelos pre-entrenados:
   - Crear carpeta `frontend-residencias/public/models/face-api/`
   - Descargar modelos desde: https://github.com/vladmandic/face-api/tree/master/model
   - Modelos necesarios:
     - `ssd_mobilenetv1_model-weights_manifest.json`
     - `ssd_mobilenetv1_model-shard1`
     - `face_landmark_68_model-weights_manifest.json`
     - `face_landmark_68_model-shard1`
     - `face_expression_model-weights_manifest.json`
     - `face_expression_model-shard1`

#### Tarea 6.2: Crear hook personalizado para detección facial en tiempo real

**Archivo nuevo**: `frontend-residencias/src/hooks/useFaceDetection.ts`

**Instrucciones**:
1. Crear hook que:
   - Cargue modelos de face-api.js al montar
   - Detecte rostro y landmarks en cada frame del video
   - Calcule EAR (Eye Aspect Ratio) para detectar parpadeos
   - Calcule ángulos de rotación de cabeza (yaw, pitch, roll)
   - Detecte expresiones faciales (sonrisa)
2. Interfaz del hook:
   ```typescript
   interface UseFaceDetectionResult {
     isModelLoaded: boolean;
     detectFace: (videoElement: HTMLVideoElement) => Promise<FaceDetectionResult>;
     error: string | null;
   }
   
   interface FaceDetectionResult {
     faceDetected: boolean;
     landmarks: FaceLandmarks68 | null;
     expressions: FaceExpressions | null;
     headPose: { yaw: number; pitch: number; roll: number } | null;
     eyeAspectRatio: { left: number; right: number } | null;
   }
   ```
3. Métodos del hook:
   - `loadModels()`: Cargar modelos desde `/models/face-api/`
   - `detectFace(videoElement)`: Detectar rostro en frame actual
   - `calculateEAR(landmarks)`: Calcular Eye Aspect Ratio para parpadeos
   - `calculateHeadPose(landmarks)`: Calcular ángulos de rotación de cabeza
4. Umbrales de detección:
   - Parpadeo: EAR < 0.25 (ojo cerrado)
   - Sonrisa: expression.happy > 0.7
   - Giro izquierda: yaw < -15 grados
   - Giro derecha: yaw > 15 grados

#### Tarea 6.3: Refactorizar LivenessCapture para usar detección real

**Archivo**: `frontend-residencias/src/components/kyc/LivenessCapture.tsx`

**Instrucciones**:
1. Importar hook `useFaceDetection`
2. Agregar estado para tracking de gestos:
   ```typescript
   const [gestureProgress, setGestureProgress] = useState<{
     smile: boolean;
     turn_left: boolean;
     turn_right: boolean;
     blink: boolean;
   }>({
     smile: false,
     turn_left: false,
     turn_right: false,
     blink: false,
   });
   ```
3. Crear loop de detección que se ejecute cada 100ms mientras graba:
   ```typescript
   const detectionLoop = useCallback(async () => {
     if (!webcamRef.current?.video || !isRecording) return;
     
     const result = await detectFace(webcamRef.current.video);
     
     if (result.faceDetected) {
       // Validar gesto actual
       validateCurrentGesture(result);
     }
     
     // Continuar loop
     requestAnimationFrame(detectionLoop);
   }, [isRecording, currentGestureIndex]);
   ```
4. Implementar `validateCurrentGesture(result)`:
   - Si gesto actual es 'smile': Verificar `result.expressions.happy > 0.7`
   - Si gesto actual es 'turn_left': Verificar `result.headPose.yaw < -15`
   - Si gesto actual es 'turn_right': Verificar `result.headPose.yaw > 15`
   - Si gesto actual es 'blink': Detectar transición EAR alto → bajo → alto
   - Cuando gesto se completa: Marcar como completado y avanzar al siguiente
5. Agregar indicador visual de progreso del gesto:
   - Barra de progreso circular alrededor del icono del gesto
   - Se llena cuando el gesto se detecta correctamente
   - Requiere mantener el gesto por 1 segundo para confirmar
6. Agregar feedback visual en tiempo real:
   - Overlay verde cuando rostro detectado correctamente
   - Overlay rojo cuando no se detecta rostro
   - Mensaje de ayuda si el gesto no se detecta después de 5 segundos
7. **IMPORTANTE**: Eliminar el temporizador automático `progressToNextGesture()`
8. **IMPORTANTE**: Solo avanzar al siguiente gesto cuando se detecte el gesto actual

#### Tarea 6.4: Agregar validación de calidad de video en tiempo real

**Archivo**: `frontend-residencias/src/components/kyc/LivenessCapture.tsx`

**Instrucciones**:
1. Validar calidad del video durante la grabación:
   - Iluminación: Verificar que el brillo promedio esté entre 50-200
   - Nitidez: Verificar que la imagen no esté borrosa
   - Tamaño de rostro: Verificar que el rostro ocupe al menos 30% del frame
2. Mostrar advertencias en tiempo real:
   - "Acércate más a la cámara" si rostro muy pequeño
   - "Mejora la iluminación" si muy oscuro o muy brillante
   - "Mantén la cámara quieta" si imagen borrosa
3. Pausar detección de gestos si calidad es insuficiente
4. Reanudar cuando calidad mejore

#### Tarea 6.5: Agregar sistema de anti-spoofing básico

**Archivo**: `frontend-residencias/src/components/kyc/LivenessCapture.tsx`

**Instrucciones**:
1. Implementar validaciones anti-spoofing:
   - Verificar que los parpadeos sean naturales (duración 100-400ms)
   - Verificar que el movimiento de cabeza sea suave (no saltos bruscos)
   - Verificar que las expresiones cambien gradualmente
2. Detectar patrones sospechosos:
   - Parpadeos demasiado rápidos o lentos
   - Movimientos de cabeza robóticos
   - Rostro estático con solo ojos parpadeando (foto con ojos recortados)
3. Si se detecta patrón sospechoso:
   - Mostrar advertencia: "Comportamiento inusual detectado"
   - Solicitar reintentar
   - Registrar en metadata del video

#### Tarea 6.6: Optimizar rendimiento de detección

**Instrucciones**:
1. Reducir frecuencia de detección si dispositivo lento:
   - Detectar FPS del dispositivo
   - Si FPS < 20, reducir frecuencia de detección a cada 200ms
   - Si FPS < 10, mostrar advertencia de dispositivo lento
2. Usar Web Workers para procesamiento en segundo plano:
   - Mover detección facial a Web Worker
   - Evitar bloquear UI durante detección
3. Liberar recursos al desmontar:
   - Detener loop de detección
   - Liberar modelos de memoria
   - Limpiar referencias a video

#### Tarea 6.7: Agregar modo de prueba/debug

**Archivo**: `frontend-residencias/src/components/kyc/LivenessCapture.tsx`

**Instrucciones**:
1. Agregar prop `debugMode?: boolean`
2. Si `debugMode === true`:
   - Mostrar overlay con landmarks faciales dibujados
   - Mostrar valores en tiempo real: EAR, yaw, pitch, roll, expresiones
   - Mostrar FPS de detección
   - Mostrar log de gestos detectados
3. Agregar botón "Modo Debug" en esquina superior derecha (solo en desarrollo)
4. Útil para:
   - Ajustar umbrales de detección
   - Diagnosticar problemas de detección
   - Verificar que los modelos funcionan correctamente

---

### FASE 7: Componente de Campana de Notificaciones (Frontend)

**Tiempo estimado: 4-5 horas**

#### Tarea 7.1: Crear componente NotificationBell

**Archivo nuevo**: `frontend-residencias/src/components/ui/NotificationBell.tsx`

**Instrucciones**:
1. Crear componente de campana de notificaciones que se muestre en el header/navbar
2. El componente debe:
   - Mostrar icono de campana (usar `<Bell />` de Lucide React)
   - Mostrar badge con contador de notificaciones no leídas
   - Al hacer click, abrir dropdown con lista de notificaciones
   - Usar componente `<Popover>` de shadcn/ui
3. Props del componente:
   ```typescript
   interface NotificationBellProps {
     userId: number;
     userRole: 'admin' | 'operator' | 'cliente' | 'propietario';
   }
   ```
4. Estado interno:
   - `notifications`: Array de notificaciones
   - `unreadCount`: Contador de no leídas
   - `isOpen`: Estado del dropdown
   - `isLoading`: Estado de carga
5. Cargar notificaciones al montar y cada 30 segundos (polling)
6. Estilos:
   - Badge rojo con contador en esquina superior derecha del icono
   - Dropdown con máximo 5 notificaciones recientes
   - Botón "Ver todas" al final del dropdown
   - Notificaciones no leídas con fondo azul claro
   - Notificaciones leídas con fondo blanco

#### Tarea 7.2: Crear componente NotificationItem

**Archivo nuevo**: `frontend-residencias/src/components/ui/NotificationItem.tsx`

**Instrucciones**:
1. Crear componente para mostrar una notificación individual
2. Props:
   ```typescript
   interface NotificationItemProps {
     notification: Notification;
     onMarkAsRead: (id: number) => void;
     onDelete: (id: number) => void;
     onClick?: (notification: Notification) => void;
   }
   ```
3. El componente debe mostrar:
   - Icono según tipo de notificación:
     - `kyc_document_retention`: `<FileWarning />` (amarillo)
     - `kyc_pending_review`: `<Clock />` (azul)
     - `system_alert`: `<AlertTriangle />` (rojo)
   - Título en negrita
   - Mensaje truncado (máximo 100 caracteres)
   - Tiempo relativo (ej: "hace 2 horas", usar librería `date-fns`)
   - Botón "Marcar como leída" si no está leída
   - Botón "Eliminar"
4. Al hacer click en la notificación:
   - Marcar como leída automáticamente
   - Si es tipo `kyc_document_retention`, navegar a página de gestión de documentos
   - Si es tipo `kyc_pending_review`, navegar a panel de revisión KYC

#### Tarea 7.3: Crear página de gestión de documentos KYC (Admin)

**Archivo nuevo**: `frontend-residencias/src/pages/admin/KYCDocumentManagement.tsx`

**Instrucciones**:
1. Crear página accesible solo para administradores
2. Ruta: `/admin/kyc/documents`
3. La página debe mostrar:
   - Tabla con verificaciones que tienen documentos antiguos (>90 días)
   - Columnas: Usuario, Fecha de verificación, Estado, Días desde verificación, Cantidad de documentos, Acciones
   - Filtros: Estado (approved/rejected), Días mínimos, Búsqueda por nombre
4. Para cada fila, botones de acción:
   - "Ver Documentos": Abrir modal con lista de documentos
   - "Eliminar Documentos": Abrir modal de confirmación
5. Modal de confirmación de eliminación:
   - Mostrar advertencia: "Esta acción es irreversible"
   - Mostrar lista de documentos que se eliminarán
   - Campo de texto para confirmar: "Escriba 'ELIMINAR' para confirmar"
   - Botón "Eliminar Documentos" (rojo, deshabilitado hasta que escriba correctamente)
6. Después de eliminar:
   - Mostrar toast de éxito
   - Recargar tabla
   - Marcar notificación relacionada como leída

#### Tarea 7.4: Integrar NotificationBell en Header/Navbar

**Archivos a modificar**:
- `frontend-residencias/src/components/layout/Header.tsx` (o el componente de navbar que uses)
- `frontend-residencias/src/components/dashboard/admin/AdminDashboard.tsx`
- `frontend-residencias/src/components/dashboard/operator/OperatorDashboard.tsx`

**Instrucciones**:
1. Importar componente `NotificationBell`
2. Agregar en el header, junto a otros iconos (perfil, configuración, etc.)
3. Posición: Esquina superior derecha, antes del avatar del usuario
4. Solo mostrar para usuarios con role 'admin' u 'operator'
5. Ejemplo:
   ```tsx
   <div className="flex items-center gap-4">
     {(user.role === 'admin' || user.role === 'operator') && (
       <NotificationBell userId={user.id} userRole={user.role} />
     )}
     <Avatar>...</Avatar>
   </div>
   ```

#### Tarea 7.5: Agregar métodos en api.ts para notificaciones

**Archivo**: `frontend-residencias/src/services/api.ts`

**Instrucciones**:
1. Agregar métodos:
   - `getNotifications(limit, offset)`: GET `/api/notifications`
   - `getUnreadNotifications()`: GET `/api/notifications/unread`
   - `getUnreadCount()`: GET `/api/notifications/count`
   - `markNotificationAsRead(notificationId)`: PUT `/api/notifications/${id}/read`
   - `markAllNotificationsAsRead()`: PUT `/api/notifications/read-all`
   - `deleteNotification(notificationId)`: DELETE `/api/notifications/${id}`
   - `getKYCDocumentsForRetention()`: GET `/api/kyc/documents/retention` (lista de verificaciones con documentos antiguos)
   - `deleteKYCDocuments(verificationId)`: DELETE `/api/kyc/verifications/${verificationId}/documents`
2. Todos los métodos deben incluir token JWT en headers

---

### FASE 8: Integración Completa y Pruebas

**Tiempo estimado: 5-6 horas**

#### Tarea 8.1: Probar detección de vida REAL

**Instrucciones**:
1. Probar cada gesto individualmente:
   - **Sonrisa**: Verificar que solo se completa cuando el usuario sonríe
   - **Giro izquierda**: Verificar que solo se completa cuando gira la cabeza a la izquierda
   - **Giro derecha**: Verificar que solo se completa cuando gira la cabeza a la derecha
   - **Parpadeo**: Verificar que solo se completa cuando el usuario parpadea
2. Probar con diferentes condiciones:
   - Iluminación baja: Verificar que muestra advertencia
   - Rostro muy lejos: Verificar que pide acercarse
   - Sin movimiento: Verificar que NO completa gestos automáticamente
3. Probar anti-spoofing:
   - Usar foto impresa: Verificar que no detecta parpadeos
   - Usar video pregrabado: Verificar que detecta movimientos no naturales
   - Usar foto en pantalla: Verificar que no pasa validación
4. Verificar que el video grabado contiene gestos reales:
   - Reproducir video grabado
   - Confirmar que se ven los gestos realizados
5. Probar en diferentes dispositivos:
   - Desktop con webcam
   - Laptop con cámara integrada
   - Tablet
   - Smartphone (Chrome mobile)

#### Tarea 8.2: Probar flujo completo de estudiante

**Instrucciones**:
1. Crear cuenta de estudiante de prueba
2. Iniciar proceso KYC desde dashboard
3. Completar todos los pasos:
   - Subir cédula frontal y reverso
   - Tomar selfie
   - Tomar selfie con documento
   - Grabar video de liveness
4. Verificar que:
   - Los documentos se suben correctamente
   - El procesamiento automático se ejecuta
   - El estado cambia a "pending_review"
   - Se recibe email de confirmación
   - El badge muestra "en proceso"

#### Tarea 8.3: Probar flujo completo de operador

**Instrucciones**:
1. Crear cuenta de operador de prueba (role: 'operator')
2. Acceder al panel de operador
3. Verificar que:
   - La lista de verificaciones pendientes se carga correctamente
   - Los filtros funcionan (estado, fecha, fraud score)
   - Se pueden ver los documentos encriptados
   - Las imágenes se cargan correctamente
   - Las puntuaciones se muestran con colores correctos
4. Aprobar una verificación:
   - Verificar que se puede agregar notas
   - Verificar que el estudiante recibe email de aprobación
   - Verificar que el `verificationLevel` del usuario cambia a 5
   - Verificar que el badge cambia a verde con checkmark
5. Rechazar una verificación:
   - Verificar que la razón es obligatoria
   - Verificar que el estudiante recibe email con la razón
   - Verificar que puede reintentar

#### Tarea 8.4: Probar sistema de notificaciones por email

**Instrucciones**:
1. Configurar variables de entorno SMTP en `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=tu-email@gmail.com
   SMTP_PASSWORD=tu-app-password
   EMAIL_FROM=noreply@habitas.com
   PANEL_URL=http://localhost:5173
   ALERT_RECIPIENTS=operador@habitas.com:Operador Principal
   ```
2. Probar cada tipo de email:
   - Documentos recibidos
   - Revisión pendiente
   - Aprobación
   - Rechazo
   - Expiración (cambiar fecha manualmente en DB)
3. Verificar que los emails:
   - Tienen formato profesional
   - Incluyen logo y colores de Habitas
   - Tienen botones funcionales
   - No incluyen información sensible (puntuaciones, datos personales)

#### Tarea 8.5: Probar sistema de expiración

**Instrucciones**:
1. Aprobar una verificación
2. Verificar que `expiresAt` se establece a 365 días en el futuro
3. Cambiar manualmente `expiresAt` a fecha pasada en la base de datos
4. Ejecutar job de expiración: `KYCService.checkExpiredVerifications()`
5. Verificar que:
   - El status cambia a 'expired'
   - El `verificationLevel` del usuario baja a 1
   - Se envía email de expiración
   - El badge cambia a amarillo

#### Tarea 8.6: Probar alertas a operadores

**Instrucciones**:
1. Crear 101 verificaciones pendientes (usar script de seed)
2. Verificar que se envía alerta de cola excesiva
3. Rechazar 31% de verificaciones en un día
4. Verificar que se envía alerta de tasa de rechazo alta
5. Completar nivel 3 de KYC como estudiante
6. Verificar que operadores reciben notificación de nueva verificación pendiente

#### Tarea 8.7: Probar sistema de notificaciones en campana (Admin)

**Instrucciones**:
1. Crear cuenta de administrador de prueba (role: 'admin')
2. Aprobar una verificación KYC
3. Cambiar manualmente la fecha de verificación a hace 91 días en la base de datos
4. Ejecutar job de retención: `KYCDocumentRetentionJob.run()`
5. Verificar que:
   - Se crea notificación en la base de datos
   - La campana muestra badge con contador "1"
   - Al abrir dropdown, aparece la notificación con icono amarillo
   - El mensaje indica usuario, cantidad de documentos y días de antigüedad
6. Hacer click en la notificación:
   - Verificar que navega a página de gestión de documentos
   - Verificar que la notificación se marca como leída
   - Verificar que el contador de la campana disminuye
7. En la página de gestión de documentos:
   - Verificar que aparece la verificación con documentos antiguos
   - Hacer click en "Ver Documentos"
   - Verificar que se muestran todos los documentos
   - Hacer click en "Eliminar Documentos"
   - Escribir "ELIMINAR" en el campo de confirmación
   - Confirmar eliminación
8. Verificar que:
   - Los archivos físicos se eliminan del storage
   - Los registros se eliminan de la base de datos
   - Se registra en audit log
   - Se muestra toast de éxito
   - La verificación desaparece de la tabla

#### Tarea 8.8: Probar polling de notificaciones

**Instrucciones**:
1. Abrir dashboard de administrador en navegador
2. Dejar abierto por 2 minutos
3. Desde otro navegador/sesión, crear una notificación manualmente en la base de datos
4. Verificar que:
   - Después de máximo 30 segundos, la campana actualiza el contador
   - La nueva notificación aparece en el dropdown
5. Probar con múltiples notificaciones (crear 10)
6. Verificar que:
   - El dropdown muestra solo las 5 más recientes
   - El botón "Ver todas" aparece al final
   - Al hacer click en "Ver todas", navega a página completa de notificaciones

---

## 🔒 Consideraciones de Seguridad

### Seguridad de Documentos
1. **Encriptación**: Todos los documentos deben estar encriptados con AES-256-GCM
2. **Acceso**: Solo operadores pueden ver documentos
3. **Audit Log**: Cada acceso a documento debe registrarse con operatorId, userId, documentType, timestamp
4. **Rate Limiting**: Máximo 50 requests por minuto por operador
5. **No Cache**: Headers `Cache-Control: no-store` en respuestas de documentos
6. **Tokens**: Usar tokens JWT con expiración corta (5 minutos) para URLs de documentos

### Seguridad de Datos Personales
1. **GDPR**: Implementar endpoint para eliminar datos por solicitud del usuario
2. **Anonimización**: Al eliminar, mantener solo estadísticas agregadas
3. **Emails**: No incluir puntuaciones ni datos sensibles en emails
4. **Logs**: No registrar datos personales en logs de aplicación
5. **Retención de Documentos**: Los documentos KYC NO se borran automáticamente. Solo el administrador puede decidir borrarlos manualmente después de recibir notificación

### Seguridad de Autenticación
1. **Roles**: Validar role === 'operator' en todos los endpoints de operador
2. **Tokens**: Validar JWT en cada request
3. **CORS**: Configurar CORS correctamente para frontend
4. **HTTPS**: Usar HTTPS en producción (obligatorio)

---

## 📊 Métricas y Monitoreo

### Métricas a Implementar
1. **Tiempo promedio de procesamiento**: Desde subida de documentos hasta aprobación/rechazo
2. **Tasa de aprobación**: Porcentaje de verificaciones aprobadas vs rechazadas
3. **Tasa de rechazo por razón**: Agrupar rechazos por razón
4. **Cola de revisión**: Número de verificaciones pendientes en tiempo real
5. **Tiempo de espera**: Tiempo promedio que una verificación espera en cola
6. **Puntuaciones promedio**: Promedio de faceMatchScore, livenessScore, documentValidityScore, fraudScore

### Dashboard de Métricas (Opcional - Fase 6)
Crear página `/admin/kyc/metrics` con:
- Gráficos de línea: Verificaciones por día (aprobadas, rechazadas, pendientes)
- Gráfico de pastel: Distribución de razones de rechazo
- Tabla: Top 10 operadores por número de revisiones
- Alertas: Mostrar alertas activas (cola excesiva, tasa de rechazo alta)

---

## 🎯 Resumen de Completitud

### Estado Actual
- **Backend**: 95% completo
- **Frontend**: 60% completo
- **Integración**: 40% completo
- **Total**: 65% completo

### Después de Implementar Todas las Tareas
- **Backend**: 100% completo
- **Frontend**: 100% completo
- **Integración**: 100% completo
- **Total**: 100% completo

---

## 📝 Checklist Final

### Backend
- [x] Modelos de base de datos (User, KYCVerification, KYCDocument, KYCAttempt)
- [x] Servicios (KYC, Encryption, Storage, OCR, FaceMatch, Liveness, Notification, AuditLogger)
- [x] Controlador KYC con todos los endpoints
- [x] Sistema de niveles (0-5)
- [x] Sistema de notificaciones por email
- [ ] Modelo de Notificaciones (campana)
- [ ] Servicio de NotificationBell
- [ ] Job de retención de documentos (notificar admin)
- [ ] Controlador de notificaciones
- [ ] Endpoint para visualizar documentos encriptados
- [ ] Endpoint para eliminar documentos (solo admin)
- [ ] Rate limiting en endpoints de documentos

### Frontend
- [x] Componente KYCFlow para estudiantes
- [x] Componente KYCReviewPanel para operadores
- [x] Componente LivenessCapture (SIMULADO - necesita implementación real)
- [ ] **CRÍTICO**: Implementar detección de vida REAL con face-api.js
- [ ] Hook useFaceDetection para detección facial en tiempo real
- [ ] Validación de gestos reales (no temporizador automático)
- [ ] Sistema anti-spoofing básico
- [ ] Validación de calidad de video en tiempo real
- [ ] Modo debug para ajustar umbrales
- [ ] Integrar KYCSection con API real (eliminar mock data)
- [ ] Implementar visualización de documentos reales
- [ ] Crear componente VerifiedBadge
- [ ] Integrar badge en avatares y listas
- [ ] Crear componente KYCNotifications para estudiantes
- [ ] Crear componente NotificationBell (campana)
- [ ] Crear componente NotificationItem
- [ ] Crear página de gestión de documentos KYC (admin)
- [ ] Integrar NotificationBell en header/navbar
- [ ] Agregar métodos en api.ts para documentos
- [ ] Agregar métodos en api.ts para notificaciones

### Integración
- [ ] **CRÍTICO**: Probar detección de vida REAL (no simulada)
- [ ] Probar cada gesto individualmente con validación real
- [ ] Probar anti-spoofing con fotos y videos pregrabados
- [ ] Probar en diferentes dispositivos y condiciones de iluminación
- [ ] Probar flujo completo de estudiante
- [ ] Probar flujo completo de operador
- [ ] Probar sistema de notificaciones por email
- [ ] Probar sistema de notificaciones en campana (admin)
- [ ] Probar sistema de expiración
- [ ] Probar alertas a operadores
- [ ] Probar job de retención de documentos
- [ ] Probar eliminación manual de documentos por admin
- [ ] Probar polling de notificaciones
- [ ] Configurar variables de entorno SMTP
- [ ] Configurar CORS y seguridad

### Seguridad
- [ ] Validar roles en todos los endpoints
- [ ] Implementar rate limiting
- [ ] Configurar headers de seguridad
- [ ] Implementar audit log completo
- [ ] Probar eliminación de datos (GDPR)

---

## 🚀 Orden de Implementación Recomendado

1. **FASE 1**: Endpoint de visualización de documentos (backend)
2. **FASE 2**: Integración frontend - Panel de operador
3. **FASE 3**: Badge de verificación en perfil
4. **FASE 4**: Sistema de notificaciones para administrador (backend)
5. **FASE 5**: Notificaciones al estudiante
6. **FASE 6**: Implementar detección de vida REAL en frontend
7. **FASE 7**: Componente de campana de notificaciones (frontend)
8. **FASE 8**: Pruebas completas e integración

**Tiempo total estimado**: 33-42 horas de desarrollo

---

## 📞 Soporte y Documentación

### Documentos de Referencia
- `backend-residencias/docs/KYC_LEVELS_SYSTEM.md`: Sistema de niveles KYC
- `backend-residencias/docs/KYC_FRONTEND_EXAMPLE.md`: Ejemplos de integración frontend
- `backend-residencias/src/controllers/kyc.controller.ts`: Todos los endpoints disponibles
- `backend-residencias/src/services/kyc.service.ts`: Lógica de negocio completa

### Variables de Entorno Necesarias
```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password
EMAIL_FROM=noreply@habitas.com

# URLs
PANEL_URL=http://localhost:5173
API_URL=http://localhost:3000

# Alerts
ALERT_RECIPIENTS=operador1@habitas.com:Operador 1,operador2@habitas.com:Operador 2

# Security
JWT_SECRET=tu-secret-key-seguro
ENCRYPTION_KEY=REDACTED

# Storage
STORAGE_PATH=./uploads
```

---

## ✅ Criterios de Aceptación

El sistema KYC estará 100% completo cuando:

1. ✅ Un estudiante puede completar todo el flujo KYC desde su dashboard
2. ✅ Los documentos se encriptan y almacenan correctamente
3. ✅ El procesamiento automático (OCR, face match, liveness) funciona
4. ✅ **CRÍTICO**: La detección de vida valida gestos REALES (no simulados)
5. ✅ Los gestos solo se completan cuando se detectan realmente
6. ✅ El sistema rechaza fotos estáticas y videos pregrabados
7. ✅ Los operadores pueden ver la lista de verificaciones pendientes (sin mock data)
8. ✅ Los operadores pueden ver los documentos encriptados desencriptados temporalmente
9. ✅ Los operadores pueden aprobar/rechazar con notas/razón
10. ✅ Los estudiantes reciben emails en cada etapa del proceso
11. ✅ El badge de verificación aparece en el avatar del usuario
12. ✅ El badge cambia de color según el nivel de verificación
13. ✅ Las notificaciones aparecen en el dashboard del estudiante
14. ✅ El sistema de expiración funciona correctamente (365 días)
15. ✅ Las alertas a operadores se envían cuando corresponde
16. ✅ Todos los accesos a documentos se registran en audit log
17. ✅ El sistema cumple con requisitos de seguridad y GDPR
18. ✅ La campana de notificaciones funciona para administradores
19. ✅ El job de retención notifica al admin sobre documentos antiguos (>90 días)
20. ✅ Los documentos NO se borran automáticamente
21. ✅ Solo el administrador puede eliminar documentos manualmente
22. ✅ El polling de notificaciones actualiza cada 30 segundos
23. ✅ La página de gestión de documentos permite ver y eliminar documentos antiguos

---

## ⚠️ PROBLEMA CRÍTICO: Detección de Vida Simulada

### Estado Actual

El componente `LivenessCapture.tsx` tiene un sistema de gestos **SIMULADO** que NO proporciona seguridad real:

1. **Temporizador Automático**: Los gestos se completan automáticamente cada 3 segundos sin validar si el usuario realmente los realizó
2. **Sin Validación Real**: No hay detección facial en tiempo real durante la grabación
3. **Vulnerable a Ataques**: Un atacante puede simplemente esperar 12 segundos (4 gestos × 3 segundos) sin hacer nada y el sistema lo aprobará
4. **Falsa Sensación de Seguridad**: El usuario ve instrucciones de gestos pero el sistema no verifica que los haga

### Código Problemático

```typescript
// En LivenessCapture.tsx - línea ~240
const progressToNextGesture = useCallback(() => {
  if (gestureTimerRef.current) {
    clearTimeout(gestureTimerRef.current);
  }

  gestureTimerRef.current = setTimeout(() => {
    setCurrentGestureIndex((prevIndex) => {
      const newIndex = prevIndex + 1;
      
      // ❌ PROBLEMA: Marca como completado sin validar
      setCompletedGestures((prev) => [...prev, GESTURES[prevIndex].type]);
      
      if (newIndex >= GESTURES.length) {
        stopRecording(false);
        return prevIndex;
      }
      
      progressToNextGesture(); // ❌ Continúa automáticamente
      return newIndex;
    });
  }, GESTURE_DURATION * 1000); // ❌ Solo espera 3 segundos
}, []);
```

### Impacto en Seguridad

- **Riesgo Alto**: Cualquier persona puede pasar la verificación sin realizar gestos
- **Ataques con Fotos**: Una foto estática pasaría la verificación
- **Ataques con Videos**: Un video pregrabado pasaría la verificación
- **Cumplimiento**: No cumple con estándares de liveness detection reales

### Solución Requerida

La **FASE 6** del documento implementa detección de vida REAL usando face-api.js en el navegador para:

1. ✅ Detectar rostro y landmarks en tiempo real
2. ✅ Validar cada gesto antes de marcarlo como completado
3. ✅ Calcular EAR (Eye Aspect Ratio) para detectar parpadeos reales
4. ✅ Calcular ángulos de rotación de cabeza para validar giros
5. ✅ Detectar expresiones faciales para validar sonrisas
6. ✅ Implementar anti-spoofing básico
7. ✅ Validar calidad de video en tiempo real

---

## 🔔 Sistema de Retención de Documentos KYC

### Política de Retención

1. **NO Borrado Automático**: Los documentos KYC NUNCA se borran automáticamente del sistema
2. **Notificación al Administrador**: Después de 90 días desde la aprobación/rechazo, el sistema notifica al administrador
3. **Decisión Manual**: Solo el administrador puede decidir si eliminar o mantener los documentos
4. **Auditoría**: Toda eliminación de documentos se registra en audit log con fecha, hora y usuario que ejecutó la acción

### Flujo de Retención

1. **Job Diario**: Se ejecuta automáticamente cada día a las 2:00 AM
2. **Identificación**: Busca verificaciones con documentos de más de 90 días
3. **Notificación**: Crea notificación en la campana del administrador
4. **Revisión**: El administrador revisa la notificación y decide
5. **Acción Manual**: Si decide eliminar, lo hace desde la página de gestión de documentos
6. **Confirmación**: Debe escribir "ELIMINAR" para confirmar la acción irreversible
7. **Registro**: Se registra en audit log con todos los detalles

### Razones para Mantener Documentos

- Investigaciones en curso
- Disputas legales
- Auditorías regulatorias
- Solicitudes de autoridades
- Casos de fraude bajo investigación

### Razones para Eliminar Documentos

- Cumplimiento con GDPR (derecho al olvido)
- Minimización de datos personales almacenados
- Reducción de superficie de ataque en caso de brecha de seguridad
- Optimización de espacio de almacenamiento

---

**Documento creado**: 2026-04-13  
**Versión**: 3.0  
**Última actualización**: 2026-04-13  
**Autor**: Sistema de Análisis KYC  
**Cambios en v2.0**: Agregado sistema de notificaciones en campana para administrador y política de retención de documentos sin borrado automático  
**Cambios en v3.0**: Identificado problema crítico de detección de vida simulada y agregada FASE 6 para implementar detección REAL con face-api.js en navegador
