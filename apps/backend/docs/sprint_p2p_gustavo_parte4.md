# Instrucciones para Completar la Implementación P2P

**Objetivo**: Completar el flujo P2P de solicitud de alquiler al 100%  
**Estado actual**: 45% completo  
**Tiempo estimado**: 12-16 horas  
**Prioridad**: Alta

---

## 📋 Resumen de lo que falta

El sistema P2P está parcialmente implementado. Falta:
1. Endpoint para que propietarios vean solicitudes recibidas
2. Validación de permisos (solo propietario puede aprobar sus propiedades)
3. Integración automática entre RentRequest y Transaction
4. Conectar frontend del propietario con API real (eliminar datos mock)
5. Simplificar UX: solicitud con 1 click (sin formulario)
6. Botón para ver perfil del estudiante
7. Sistema de notificaciones (opcional)

---

## 🎯 FASE 1: Backend - Solicitudes del Propietario (3 horas)

### Tarea 1.1: Crear endpoint para solicitudes recibidas (2 horas)

**Archivo a modificar**: `backend-residencias/src/controllers/rent.controller.ts`

**Instrucciones**:
1. Crear función `getOwnerRequests` que reciba el userId del propietario autenticado
2. Buscar todas las propiedades donde `authorId` sea igual al userId del propietario
3. Obtener todas las solicitudes (RentRequest) donde `propertyId` esté en la lista de propiedades del propietario
4. Incluir en la respuesta:
   - Información del inquilino (tenant): id, name, email, phone, profileImage
   - Información de la propiedad: id, title, address, price
5. Ordenar por fecha de creación descendente (más recientes primero)
6. Manejar errores y retornar array vacío si no hay solicitudes

**Archivo a modificar**: `backend-residencias/src/routes/rent.routes.ts`

**Instrucciones**:
1. Agregar nueva ruta GET `/received` que llame a `getOwnerRequests`
2. Asegurarse de que requiera autenticación
3. La ruta debe estar disponible para usuarios con rol 'propietario'

**Resultado esperado**: 
- Endpoint funcional: `GET /api/rent-requests/received`
- Retorna lista de solicitudes con información completa del inquilino y propiedad

---

### Tarea 1.2: Validar permisos en aprobar/rechazar (1 hora)

**Archivo a modificar**: `backend-residencias/src/controllers/rent.controller.ts`

**Instrucciones**:
1. En la función `updateRequestStatus`, antes de actualizar el estado:
   - Si el nuevo estado es 'approved' o 'rejected':
     - Buscar la propiedad asociada a la solicitud
     - Verificar que el `authorId` de la propiedad sea igual al userId del usuario autenticado
     - Si no coincide, retornar error 403 "No tienes permiso para modificar esta solicitud"
   - Si el nuevo estado es 'cancelled':
     - Verificar que el `tenantId` de la solicitud sea igual al userId del usuario autenticado
     - Si no coincide, retornar error 403 "Solo puedes cancelar tus propias solicitudes"
2. Solo después de validar permisos, proceder con la actualización del estado

**Resultado esperado**:
- Solo el propietario de la propiedad puede aprobar/rechazar solicitudes
- Solo el estudiante que creó la solicitud puede cancelarla
- Intentos no autorizados retornan error 403

---

## 🔗 FASE 2: Backend - Integración RentRequest → Transaction (3 horas)

### Tarea 2.1: Crear transacción automáticamente al aprobar (3 horas)

**Archivo a modificar**: `backend-residencias/src/controllers/rent.controller.ts`

**Instrucciones**:
1. Importar `TransactionService` al inicio del archivo
2. Crear instancia del servicio: `const transactionService = new TransactionService()`
3. En la función `updateRequestStatus`, después de actualizar el estado a 'approved':
   - Buscar la propiedad asociada usando `propertyId` de la solicitud
   - Llamar a `transactionService.createTransaction()` con:
     - propertyId: de la solicitud
     - clientId: tenantId de la solicitud
     - amount: precio de la propiedad
     - currency: 'USD' (o el que use la propiedad)
     - notes: "Transacción generada desde solicitud #[id]"
   - Capturar errores en un try-catch para que si falla la creación de la transacción, no falle la aprobación
   - Registrar en consola el ID de la transacción creada
4. La transacción se creará automáticamente en estado `PENDING_PAYMENT` con tiempo límite de 24 horas

**Resultado esperado**:
- Al aprobar una solicitud, se crea automáticamente una Transaction
- El estudiante tiene 24 horas para subir el comprobante de pago
- Si falla la creación de la transacción, la aprobación no se revierte (solo se registra el error)

---

## 🎨 FASE 3: Frontend - Panel del Propietario (4 horas)

### Tarea 3.1: Conectar ReceivedRequestsSection con API real (2 horas)

**Archivo a modificar**: `frontend-residencias/src/components/dashboard/owner/ReceivedRequestsSection.tsx`

**Instrucciones**:
1. Eliminar el import de `mockRequests` de `@/data/mockDashboardData`
2. Eliminar el componente `MockDataIndicator`
3. Crear interface `ReceivedRequest` con los campos:
   - id, tenantId, propertyId, status, message, moveInDate, phoneNumber
   - tenant (objeto con: id, name, email, phone, profileImage)
   - property (objeto con: id, title, address, price)
   - createdAt
4. Agregar estados:
   - `requests` (array de ReceivedRequest)
   - `isLoading` (boolean)
5. Crear función `fetchRequests` que:
   - Haga llamada a `api.request('/rent-requests/received')`
   - Actualice el estado `requests` con la respuesta
   - Maneje errores mostrando toast
6. Usar `useEffect` para llamar a `fetchRequests` al montar el componente
7. Mostrar loading spinner mientras `isLoading` es true
8. Calcular estadísticas (pendingCount, approvedCount, rejectedCount) desde el estado `requests`
9. Renderizar la lista de solicitudes desde el estado `requests` (no desde mock)

**Resultado esperado**:
- El componente muestra solicitudes reales desde la API
- Se muestra loading mientras carga
- Las estadísticas se calculan dinámicamente

---

### Tarea 3.2: Implementar botones aprobar/rechazar funcionales (2 horas)

**Archivo a modificar**: `frontend-residencias/src/components/dashboard/owner/ReceivedRequestsSection.tsx`

**Instrucciones**:
1. Crear función `handleApprove` que:
   - Reciba el `requestId` como parámetro
   - Llame a `api.updateRentRequestStatus(requestId, 'approved')`
   - Si es exitoso:
     - Actualice el estado local cambiando el status de esa solicitud a 'approved'
     - Muestre toast de éxito: "Solicitud aprobada. Se ha notificado al estudiante"
   - Si falla, muestre toast de error
2. Crear función `handleReject` que:
   - Reciba el `requestId` como parámetro
   - Llame a `api.updateRentRequestStatus(requestId, 'rejected')`
   - Si es exitoso:
     - Actualice el estado local cambiando el status de esa solicitud a 'rejected'
     - Muestre toast: "Solicitud rechazada"
   - Si falla, muestre toast de error
3. En el render, modificar los botones:
   - Botón "Aprobar": agregar `onClick={() => handleApprove(request.id)}`
   - Botón "Rechazar": agregar `onClick={() => handleReject(request.id)}`
4. Los botones solo deben mostrarse si `request.status === "pending"`

**Resultado esperado**:
- Los botones aprobar/rechazar funcionan
- El estado se actualiza en tiempo real sin recargar la página
- Se muestran mensajes de confirmación

---

## 🚀 FASE 4: Frontend - Mejoras de UX (2 horas)

### Tarea 4.1: Solicitud con 1 click (sin formulario) (1 hora)

**Archivo a modificar**: `frontend-residencias/src/components/dashboard/tenant/DiscoverSection.tsx`

**Instrucciones**:
1. Eliminar completamente el componente `RentRequestModal` (todo el código del modal con formulario)
2. Eliminar los estados relacionados:
   - `isRentModalOpen`
   - `rentingProperty`
3. Crear función `handleQuickRequest` que:
   - Reciba la propiedad como parámetro
   - Llame directamente a `api.createRentRequest()` con:
     - propertyId: property.id
     - message: "Estoy interesado en [título de la propiedad]"
     - (moveInDate y phoneNumber son opcionales, no enviarlos)
   - Si es exitoso:
     - Mostrar toast: "¡Solicitud enviada! El propietario la revisará pronto"
     - Cerrar el modal de detalles de la propiedad
   - Si falla, mostrar toast de error
4. En el componente `PropertyDetailModal`, modificar el botón "Solicitar Alquiler":
   - Cambiar `onClick` para que llame a `handleQuickRequest(property)`
   - Ya no debe abrir ningún modal de formulario
5. Eliminar la renderización del `RentRequestModal` al final del componente

**Resultado esperado**:
- Al hacer click en "Solicitar Alquiler", se envía la solicitud inmediatamente
- No aparece ningún formulario
- Se muestra confirmación instantánea
- UX más rápida y simple

---

### Tarea 4.2: Botón "Ver Perfil" del estudiante (1 hora)

**Archivo a modificar**: `frontend-residencias/src/components/dashboard/owner/ReceivedRequestsSection.tsx`

**Instrucciones**:
1. Importar `useNavigate` de 'react-router-dom'
2. Importar el ícono `User` de 'lucide-react'
3. Crear instancia de navigate: `const navigate = useNavigate()`
4. Crear función `viewTenantProfile` que:
   - Reciba `tenantId` como parámetro
   - Llame a `navigate(\`/perfil/${tenantId}\`)`
5. En el render, agregar un nuevo botón antes de los botones de Mensaje/Aprobar/Rechazar:
   - Texto: "Ver Perfil"
   - Ícono: `<User className="h-4 w-4 mr-1" />`
   - Variant: "outline"
   - Size: "sm"
   - onClick: `() => viewTenantProfile(request.tenantId)`
6. El botón debe estar visible para todas las solicitudes (no solo pendientes)

**Resultado esperado**:
- Botón "Ver Perfil" visible en cada solicitud
- Al hacer click, navega al perfil público del estudiante
- Permite al propietario revisar información del inquilino antes de aprobar

---

## 🔔 FASE 5: Sistema de Notificaciones (4 horas) - OPCIONAL

### Tarea 5.1: Servicio de notificaciones backend (2 horas)

**Archivo a crear**: `backend-residencias/src/services/notification.service.ts`

**Instrucciones**:
1. Crear clase `NotificationService`
2. Implementar métodos:
   - `notifyNewRequest(ownerId, requestId)`: Notificar al propietario de nueva solicitud
   - `notifyApproval(tenantId, requestId)`: Notificar al estudiante que fue aprobado
   - `notifyRejection(tenantId, requestId)`: Notificar al estudiante que fue rechazado
3. Por ahora, las notificaciones pueden ser:
   - Registros en base de datos (tabla notifications)
   - O emails usando el servicio SMTP configurado
4. Integrar las llamadas a este servicio en:
   - `createRequest`: llamar a `notifyNewRequest`
   - `updateRequestStatus` cuando status es 'approved': llamar a `notifyApproval`
   - `updateRequestStatus` cuando status es 'rejected': llamar a `notifyRejection`

**Resultado esperado**:
- Sistema básico de notificaciones funcionando
- Los usuarios reciben alertas de cambios en sus solicitudes

---

### Tarea 5.2: Badge de notificaciones en frontend (2 horas)

**Archivo a crear**: `frontend-residencias/src/components/NotificationBadge.tsx`

**Instrucciones**:
1. Crear componente que muestre un badge con el número de notificaciones no leídas
2. Hacer polling cada 30 segundos para obtener notificaciones nuevas
3. Integrar el badge en el menú lateral de:
   - Panel propietario (en "Solicitudes Recibidas")
   - Panel estudiante (en "Mis Solicitudes")
4. Al hacer click en el badge, marcar notificaciones como leídas

**Resultado esperado**:
- Badge visible con contador de notificaciones
- Se actualiza automáticamente
- Mejora la experiencia del usuario

---

## ✅ Checklist de Validación

Después de completar cada fase, verificar:

### Backend
- [ ] Endpoint `/api/rent-requests/received` retorna solicitudes del propietario
- [ ] Solo el propietario puede aprobar/rechazar sus propiedades
- [ ] Solo el estudiante puede cancelar sus propias solicitudes
- [ ] Al aprobar solicitud, se crea Transaction automáticamente
- [ ] La Transaction tiene estado PENDING_PAYMENT y expira en 24h
- [ ] Los errores se manejan correctamente sin romper el flujo

### Frontend - Propietario
- [ ] ReceivedRequestsSection muestra solicitudes reales (no mock)
- [ ] Estadísticas se calculan correctamente
- [ ] Botón "Aprobar" funciona y actualiza el estado
- [ ] Botón "Rechazar" funciona y actualiza el estado
- [ ] Botón "Ver Perfil" navega al perfil del estudiante
- [ ] Se muestran mensajes de confirmación (toasts)
- [ ] Loading state funciona correctamente

### Frontend - Estudiante
- [ ] Solicitud se envía con 1 click (sin formulario)
- [ ] Se muestra confirmación inmediata
- [ ] En "Mis Solicitudes" aparece el botón "Proceder al Pago" cuando está aprobada
- [ ] El botón abre el componente P2PPaymentFlow correctamente

### Integración
- [ ] Flujo completo funciona: Solicitar → Aprobar → Pagar → Confirmar
- [ ] Los tiempos de expiración funcionan (24h para pago, 72h para confirmación)
- [ ] Los estados se sincronizan correctamente entre RentRequest y Transaction
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en logs del backend

---

## 🧪 Casos de Prueba Recomendados

### Prueba 1: Flujo completo feliz
1. Estudiante solicita propiedad con 1 click
2. Propietario ve la solicitud en su panel
3. Propietario aprueba la solicitud
4. Estudiante ve "Proceder al Pago" en sus solicitudes
5. Estudiante sube comprobante de pago
6. Propietario confirma el pago
7. Transacción se completa

### Prueba 2: Validación de permisos
1. Propietario A intenta aprobar solicitud de propiedad de Propietario B → Error 403
2. Estudiante A intenta cancelar solicitud de Estudiante B → Error 403

### Prueba 3: Expiración de transacciones
1. Estudiante solicita, propietario aprueba
2. Esperar 24 horas sin que estudiante pague
3. Verificar que Transaction cambia a EXPIRED

### Prueba 4: Manejo de errores
1. Intentar solicitar la misma propiedad dos veces → Error
2. Intentar aprobar solicitud ya aprobada → Error
3. Perder conexión durante solicitud → Mensaje de error apropiado

---

## 📊 Métricas de Éxito

Al completar la implementación, el sistema debe:
- ✅ Permitir solicitudes con 1 click (< 2 segundos)
- ✅ Mostrar solicitudes en tiempo real (< 1 segundo de carga)
- ✅ Validar permisos correctamente (0 errores de seguridad)
- ✅ Crear transacciones automáticamente (100% de las aprobaciones)
- ✅ Manejar errores gracefully (sin crashes)
- ✅ Completar flujo P2P end-to-end sin intervención manual

---

## 🚨 Notas Importantes

### Requisito KYC Temporal
Actualmente el endpoint `POST /rent-requests` requiere nivel de verificación KYC 3. Según las instrucciones, debe funcionar sin KYC mientras tanto.

**Acción requerida**:
En `backend-residencias/src/routes/rent.routes.ts`, comentar temporalmente:
```
// router.post('/', requireVerificationLevel(3), createRequest);
router.post('/', createRequest); // Temporal: sin validación KYC
```

### Datos de Prueba
El script `backend-residencias/src/scripts/seed-complete.ts` ya crea solicitudes de prueba. Puedes ejecutarlo con:
```bash
npm run seed:complete
```

### Orden de Implementación Recomendado
1. Fase 1 (Backend solicitudes propietario) - CRÍTICO
2. Fase 2 (Integración Transaction) - CRÍTICO
3. Fase 3 (Frontend propietario) - CRÍTICO
4. Fase 4 (Mejoras UX) - IMPORTANTE
5. Fase 5 (Notificaciones) - OPCIONAL

---

## 📞 Recursos Adicionales

### Documentación de referencia
- Análisis completo: `backend-residencias/docs/FLUJO-P2P-ANALISIS.md`
- Modelo Transaction: `backend-residencias/src/models/Transaction.ts`
- Servicio Transaction: `backend-residencias/src/services/transaction.service.ts`
- Componente P2P Payment: `frontend-residencias/src/components/transactions/P2PPaymentFlow.tsx`

### Comandos útiles
```bash
# Iniciar Docker
npm run docker:dev

# Ver logs del backend
npm run docker:dev:logs

# Ejecutar migraciones
npm run migrate

# Crear datos de prueba
npm run seed:complete

# Ejecutar tests
npm test
```

---

**Última actualización**: 13 de abril de 2026  
**Versión**: 1.0  
**Estado**: Listo para implementación
