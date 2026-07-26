# Análisis del Flujo P2P - Sistema de Alquiler de Propiedades

**Fecha de análisis**: 13 de abril de 2026  
**Estado actual**: 45% completo  
**Tiempo estimado para completar**: 1 semana

---

## 📊 Resumen Ejecutivo

El sistema de transacciones P2P (peer-to-peer) para alquiler de propiedades está parcialmente implementado. Este documento detalla qué está funcionando, qué falta por implementar, y las tareas específicas que el programador debe completar.

### Estado Actual
- ✅ **Implementado**: 45%
- ❌ **Faltante**: 55%
- 🎯 **Objetivo**: Flujo completo de solicitud → aprobación → pago → confirmación

---

## ✅ LO QUE YA ESTÁ IMPLEMENTADO (45%)

### Backend Implementado

#### 1. Modelo RentRequest
**Archivo**: `backend-residencias/src/models/RentRequest.ts`

```typescript
// Campos disponibles:
- id: number
- tenantId: number (estudiante que solicita)
- propertyId: number (propiedad solicitada)
- status: 'pending' | 'approved' | 'rejected' | 'cancelled'
- message: string
- moveInDate?: Date
- phoneNumber?: string
```

**Relaciones**:
- ✅ Relación con User (tenant)
- ✅ Relación con Property
- ✅ Índices en tenantId, propertyId, status

#### 2. Endpoints de RentRequest
**Archivo**: `backend-residencias/src/controllers/rent.controller.ts`

| Método | Endpoint | Función | Estado |
|--------|----------|---------|--------|
| POST | `/api/rent-requests` | Crear solicitud | ✅ Funcional |
| GET | `/api/rent-requests` | Obtener solicitudes del estudiante | ✅ Funcional |
| PATCH | `/api/rent-requests/:id/status` | Actualizar estado | ✅ Funcional |

#### 3. Modelo Transaction (Sistema P2P)
**Archivo**: `backend-residencias/src/models/Transaction.ts`

```typescript
// Estados del flujo P2P:
- PENDING_OWNER_APPROVAL (48h límite)
- PENDING_PAYMENT (24h límite) ← Aquí estudiante debe pagar
- PAYMENT_SUBMITTED (72h límite)
- PAYMENT_CONFIRMED
- COMPLETED
- EXPIRED
- DISPUTED
```

**Características implementadas**:
- ✅ Sistema de expiración automática
- ✅ Escrow (retención de pagos)
- ✅ Timeline de eventos
- ✅ Manejo de disputas

#### 4. Servicio de Transacciones
**Archivo**: `backend-residencias/src/services/transaction.service.ts`

Métodos disponibles:
- ✅ `createTransaction()` - Crear transacción
- ✅ `approveTransaction()` - Propietario aprueba
- ✅ `submitPayment()` - Estudiante sube comprobante
- ✅ `confirmPayment()` - Propietario confirma pago
- ✅ `cancelTransaction()` - Cancelar transacción

#### 5. Sistema de Expiración
**Archivo**: `backend-residencias/src/services/transaction-expiry.service.ts`

Tiempos límite configurados:
- ✅ 48 horas para aprobación del propietario
- ✅ 24 horas para pago del estudiante
- ✅ 72 horas para confirmación del propietario

---

### Frontend Implementado

#### 1. Componente de Solicitud (Estudiante)
**Archivo**: `frontend-residencias/src/components/dashboard/tenant/DiscoverSection.tsx`

- ✅ Modal `RentRequestModal` con formulario
- ✅ Campos: mensaje, fecha de mudanza, teléfono
- ✅ Integración con API `createRentRequest()`

#### 2. Componente Mis Solicitudes (Estudiante)
**Archivo**: `frontend-residencias/src/components/dashboard/tenant/RequestsSection.tsx`

- ✅ Lista de solicitudes enviadas
- ✅ Badges de estado (pendiente, aprobada, rechazada)
- ✅ Botón "Proceder al Pago" cuando está aprobada
- ✅ Integración con `P2PPaymentFlow`
- ✅ Cancelar solicitudes pendientes

#### 3. Componente de Pago P2P
**Archivo**: `frontend-residencias/src/components/transactions/P2PPaymentFlow.tsx`

- ✅ Flujo completo de pago
- ✅ Subir comprobante de pago
- ✅ Campos: método de pago, referencia, fecha
- ✅ Integración con Transaction API

#### 4. API Service
**Archivo**: `frontend-residencias/src/services/api.ts`

Métodos disponibles:
- ✅ `createRentRequest()`
- ✅ `getUserRentRequests()`
- ✅ `updateRentRequestStatus()`

---

## ❌ LO QUE FALTA IMPLEMENTAR (55%)

### 🔴 Prioridad Alta - Backend

#### Tarea 1: Endpoint para Solicitudes Recibidas del Propietario
**Archivo a modificar**: `backend-residencias/src/controllers/rent.controller.ts`

**Descripción**: Crear endpoint para que el propietario vea todas las solicitudes de sus propiedades.

**Código a implementar**:
```typescript
export const getOwnerRequests = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user?.userId;
    
    // 1. Obtener IDs de propiedades del propietario
    const properties = await Property.findAll({
      where: { authorId: ownerId },
      attributes: ['id']
    });
    
    const propertyIds = properties.map(p => p.id);
    
    // 2. Obtener solicitudes de esas propiedades
    const requests = await RentRequest.findAll({
      where: { 
        propertyId: { [Op.in]: propertyIds }
      },
      include: [
        { 
          model: User, 
          as: 'tenant',
          attributes: ['id', 'name', 'email', 'phone', 'profileImage']
        },
        { 
          model: Property, 
          as: 'property',
          attributes: ['id', 'title', 'address', 'price']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ success: true, data: { requests } });
  } catch (error: any) {
    console.error('Get owner requests error:', error);
    res.status(500).json({ 
      success: false, 
      error: { message: 'Error al obtener solicitudes' } 
    });
  }
};
```

**Archivo a modificar**: `backend-residencias/src/routes/rent.routes.ts`

```typescript
// Agregar esta línea:
router.get('/received', getUserRequests); // Para propietarios
```

**Estimación**: 2 horas

---

#### Tarea 2: Validación de Permisos en Aprobar/Rechazar
**Archivo a modificar**: `backend-residencias/src/controllers/rent.controller.ts`

**Descripción**: Validar que solo el propietario de la propiedad puede aprobar/rechazar solicitudes.

**Código a modificar en `updateRequestStatus`**:
```typescript
export const updateRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;
    
    const request = await RentRequest.findByPk(id, {
      include: [{ model: Property, as: 'property' }]
    });
    
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        error: { message: 'Solicitud no encontrada' } 
      });
    }
    
    // NUEVA VALIDACIÓN: Solo el propietario puede aprobar/rechazar
    if (status === 'approved' || status === 'rejected') {
      const property = await Property.findByPk(request.propertyId);
      
      if (!property || property.authorId !== userId) {
        return res.status(403).json({ 
          success: false, 
          error: { message: 'No tienes permiso para modificar esta solicitud' } 
        });
      }
    }
    
    // Solo el tenant puede cancelar
    if (status === 'cancelled' && request.tenantId !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: { message: 'Solo puedes cancelar tus propias solicitudes' } 
        });
    }

    await request.update({ status });
    res.json({ success: true, data: { request } });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: { message: error.message } 
    });
  }
};
```

**Estimación**: 1 hora

---

#### Tarea 3: Integración RentRequest → Transaction
**Archivo a modificar**: `backend-residencias/src/controllers/rent.controller.ts`

**Descripción**: Al aprobar una solicitud, crear automáticamente una Transaction en estado PENDING_PAYMENT.

**Código a agregar en `updateRequestStatus`**:
```typescript
import { TransactionService } from '../services/transaction.service';

const transactionService = new TransactionService();

export const updateRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    // ... código de validación existente ...
    
    await request.update({ status });
    
    // NUEVO: Si se aprueba, crear transacción
    if (status === 'approved') {
      const property = await Property.findByPk(request.propertyId);
      
      if (property) {
        try {
          const transaction = await transactionService.createTransaction(
            property.id,
            request.tenantId,
            {
              amount: property.price,
              currency: 'USD',
              notes: `Transacción generada desde solicitud #${request.id}`
            }
          );
          
          console.log(`✅ Transacción ${transaction.id} creada para solicitud ${request.id}`);
        } catch (txError) {
          console.error('Error creando transacción:', txError);
          // No fallar la aprobación si falla la transacción
        }
      }
    }
    
    res.json({ success: true, data: { request } });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: { message: error.message } 
    });
  }
};
```

**Estimación**: 3 horas

---

### 🔴 Prioridad Alta - Frontend

#### Tarea 4: Conectar ReceivedRequestsSection con API Real
**Archivo a modificar**: `frontend-residencias/src/components/dashboard/owner/ReceivedRequestsSection.tsx`

**Descripción**: Reemplazar datos mock con llamadas a la API real.

**Cambios necesarios**:

1. Eliminar import de mock data:
```typescript
// ELIMINAR:
import { mockRequests } from "@/data/mockDashboardData";
```

2. Agregar estados y fetch:
```typescript
import { useState, useEffect, useCallback } from "react";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ReceivedRequest {
  id: number;
  tenantId: number;
  propertyId: number;
  status: string;
  message: string;
  moveInDate?: string;
  phoneNumber?: string;
  tenant?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    profileImage?: string;
  };
  property?: {
    id: number;
    title: string;
    address?: string;
    price: number;
  };
  createdAt: string;
}

const ReceivedRequestsSection = () => {
  const [requests, setRequests] = useState<ReceivedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.request<{ requests: ReceivedRequest[] }>(
        '/rent-requests/received'
      );
      
      if (response.success && response.data) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Calcular estadísticas
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  // ... resto del componente
};
```

3. Agregar loading state en el render:
```typescript
{isLoading ? (
  <div className="flex flex-col items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
    <p className="text-muted-foreground">Cargando solicitudes...</p>
  </div>
) : requests.length === 0 ? (
  // ... empty state
) : (
  // ... lista de solicitudes
)}
```

**Estimación**: 2 horas

---

#### Tarea 5: Implementar Botones Aprobar/Rechazar Funcionales
**Archivo a modificar**: `frontend-residencias/src/components/dashboard/owner/ReceivedRequestsSection.tsx`

**Descripción**: Hacer que los botones de aprobar/rechazar funcionen y actualicen el estado.

**Código a agregar**:
```typescript
const handleApprove = async (requestId: number) => {
  try {
    const response = await api.updateRentRequestStatus(requestId, 'approved');
    
    if (response.success) {
      setRequests(prev => 
        prev.map(r => r.id === requestId ? { ...r, status: 'approved' } : r)
      );
      
      toast({
        title: "Solicitud aprobada",
        description: "Se ha notificado al estudiante para proceder con el pago",
      });
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "No se pudo aprobar la solicitud",
      variant: "destructive"
    });
  }
};

const handleReject = async (requestId: number) => {
  try {
    const response = await api.updateRentRequestStatus(requestId, 'rejected');
    
    if (response.success) {
      setRequests(prev => 
        prev.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r)
      );
      
      toast({
        title: "Solicitud rechazada",
        description: "Se ha notificado al estudiante",
      });
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "No se pudo rechazar la solicitud",
      variant: "destructive"
    });
  }
};
```

**Modificar los botones en el render**:
```typescript
{request.status === "pending" && (
  <>
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => handleReject(request.id)}
    >
      Rechazar
    </Button>
    <Button 
      size="sm"
      onClick={() => handleApprove(request.id)}
    >
      Aprobar
    </Button>
  </>
)}
```

**Estimación**: 2 horas

---

### 🟡 Prioridad Media - Frontend

#### Tarea 6: Eliminar Formulario y Hacer Solicitud con 1 Click
**Archivo a modificar**: `frontend-residencias/src/components/dashboard/tenant/DiscoverSection.tsx`

**Descripción**: Simplificar UX eliminando el modal con formulario. Al hacer click en "Solicitar Alquiler", enviar solicitud automáticamente.

**Cambios**:

1. Eliminar componente `RentRequestModal` completo

2. Crear función de solicitud rápida:
```typescript
const handleQuickRequest = async (property: PropertyUI) => {
  try {
    const response = await api.createRentRequest({
      propertyId: property.id,
      message: `Estoy interesado en ${property.title}`,
      // moveInDate y phoneNumber opcionales
    });
    
    if (response.success) {
      toast({
        title: "¡Solicitud enviada!",
        description: "El propietario revisará tu solicitud pronto",
      });
      
      // Cerrar modal de detalles
      closePropertyDetail();
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "No se pudo enviar la solicitud",
      variant: "destructive"
    });
  }
};
```

3. Modificar botón en `PropertyDetailModal`:
```typescript
<Button 
  className="flex-1" 
  size="lg" 
  onClick={() => handleQuickRequest(property)}
>
  <Send className="h-4 w-4 mr-2" />
  Solicitar Alquiler
</Button>
```

4. Eliminar estados relacionados con el modal:
```typescript
// ELIMINAR:
const [isRentModalOpen, setIsRentModalOpen] = useState(false);
const [rentingProperty, setRentingProperty] = useState<PropertyUI | null>(null);
```

**Estimación**: 1 hora

---

#### Tarea 7: Botón "Ver Perfil" del Estudiante
**Archivo a modificar**: `frontend-residencias/src/components/dashboard/owner/ReceivedRequestsSection.tsx`

**Descripción**: Implementar navegación al perfil público del estudiante.

**Código a agregar**:
```typescript
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";

const ReceivedRequestsSection = () => {
  const navigate = useNavigate();
  
  const viewTenantProfile = (tenantId: number) => {
    navigate(`/perfil/${tenantId}`);
  };
  
  // En el render, agregar botón:
  <Button 
    variant="outline" 
    size="sm"
    onClick={() => viewTenantProfile(request.tenantId)}
  >
    <User className="h-4 w-4 mr-1" />
    Ver Perfil
  </Button>
};
```

**Estimación**: 1 hora

---

### 🟢 Prioridad Baja - Full Stack

#### Tarea 8: Sistema de Notificaciones Básico
**Descripción**: Implementar notificaciones en tiempo real o polling para alertar a usuarios sobre cambios en solicitudes.

**Componentes a crear**:

1. **Backend**: Servicio de notificaciones
   - Archivo: `backend-residencias/src/services/notification.service.ts`
   - Métodos: `notifyNewRequest()`, `notifyApproval()`, `notifyRejection()`

2. **Frontend**: Badge de notificaciones
   - Archivo: `frontend-residencias/src/components/NotificationBadge.tsx`
   - Mostrar contador en menú lateral

3. **Polling o WebSockets**: Actualización en tiempo real

**Estimación**: 4 horas

---

## 🔗 FLUJO COMPLETO ESPERADO

### Diagrama de Secuencia

```
ESTUDIANTE                    SISTEMA                    PROPIETARIO
    |                            |                            |
    |--[1. Click "Solicitar"]-->|                            |
    |                            |--[Crear RentRequest]------>|
    |                            |                            |
    |                            |<--[Notificación]-----------|
    |                            |                            |
    |                            |<--[2. Ver solicitud]-------|
    |                            |                            |
    |                            |<--[3. Click "Aprobar"]-----|
    |                            |                            |
    |                            |--[Crear Transaction]       |
    |                            |--[Estado: PENDING_PAYMENT] |
    |                            |                            |
    |<--[Notificación aprobada]--|                            |
    |                            |                            |
    |--[4. "Proceder al Pago"]-->|                            |
    |                            |                            |
    |--[5. Subir comprobante]--->|                            |
    |                            |--[Estado: PAYMENT_SUBMITTED]|
    |                            |                            |
    |                            |--[Notificación]----------->|
    |                            |                            |
    |                            |<--[6. Confirmar pago]------|
    |                            |                            |
    |                            |--[Estado: COMPLETED]       |
    |                            |                            |
    |<--[Notificación confirmada]|                            |
    |                            |                            |
```

### Estados y Transiciones

```
RentRequest:
  pending → approved → (crea Transaction)
  pending → rejected
  pending → cancelled

Transaction (cuando RentRequest es approved):
  PENDING_OWNER_APPROVAL (no aplica, se crea directo en PENDING_PAYMENT)
  PENDING_PAYMENT (24h) → PAYMENT_SUBMITTED (72h) → PAYMENT_CONFIRMED → COMPLETED
  PENDING_PAYMENT → EXPIRED (si no paga en 24h)
  PAYMENT_SUBMITTED → DISPUTED (si propietario no confirma en 72h)
```

---

## 📁 Archivos Clave del Sistema

### Backend
```
backend-residencias/
├── src/
│   ├── models/
│   │   ├── RentRequest.ts ✅
│   │   ├── Transaction.ts ✅
│   │   └── TransactionTimeline.ts ✅
│   ├── controllers/
│   │   ├── rent.controller.ts ⚠️ (modificar)
│   │   └── transaction.controller.ts ✅
│   ├── services/
│   │   ├── transaction.service.ts ✅
│   │   ├── transaction-expiry.service.ts ✅
│   │   └── escrow.service.ts ✅
│   └── routes/
│       ├── rent.routes.ts ⚠️ (modificar)
│       └── transaction.routes.ts ✅
```

### Frontend
```
frontend-residencias/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── owner/
│   │   │   │   └── ReceivedRequestsSection.tsx ⚠️ (modificar)
│   │   │   └── tenant/
│   │   │       ├── DiscoverSection.tsx ⚠️ (modificar)
│   │   │       └── RequestsSection.tsx ✅
│   │   └── transactions/
│   │       └── P2PPaymentFlow.tsx ✅
│   └── services/
│       └── api.ts ⚠️ (agregar método)
```

**Leyenda**:
- ✅ Implementado y funcional
- ⚠️ Requiere modificaciones
- ❌ No implementado

---

## 🧪 Testing Recomendado

### Casos de Prueba Críticos

1. **Flujo completo feliz**:
   - Estudiante solicita → Propietario aprueba → Estudiante paga → Propietario confirma

2. **Validación de permisos**:
   - Propietario A no puede aprobar solicitud de propiedad de Propietario B
   - Estudiante A no puede cancelar solicitud de Estudiante B

3. **Expiración de transacciones**:
   - Estudiante no paga en 24h → Transaction EXPIRED
   - Propietario no confirma en 72h → Transaction DISPUTED

4. **Manejo de errores**:
   - Solicitud duplicada (misma propiedad, mismo estudiante)
   - Aprobar solicitud ya aprobada/rechazada

---

## 📝 Notas Importantes

### Requisitos de KYC
Actualmente, el endpoint `POST /rent-requests` requiere nivel de verificación 3 (documentos aprobados):

```typescript
router.post('/', requireVerificationLevel(3), createRequest);
```

**Consideración**: Según las instrucciones, el flujo debe funcionar "sin necesidad de aprobación KYC mientras tanto". 

**Acción recomendada**: Comentar temporalmente el middleware:
```typescript
// router.post('/', requireVerificationLevel(3), createRequest);
router.post('/', createRequest); // Temporal: sin validación KYC
```

### Datos de Prueba
El archivo `backend-residencias/src/scripts/seed-complete.ts` ya crea solicitudes de prueba:

```typescript
await RentRequest.create({
  tenantId: cliente.id,
  propertyId: createdProperties[0].id,
  status: 'pending',
  message: 'Estoy interesado en esta propiedad',
});
```

---

## 🚀 Plan de Implementación Sugerido

### Fase 1: Backend Core (6 horas)
1. Tarea 1: Endpoint solicitudes recibidas (2h)
2. Tarea 2: Validación de permisos (1h)
3. Tarea 3: Integración RentRequest → Transaction (3h)

### Fase 2: Frontend Core (5 horas)
4. Tarea 4: Conectar ReceivedRequestsSection (2h)
5. Tarea 5: Botones aprobar/rechazar (2h)
6. Tarea 7: Botón ver perfil (1h)

### Fase 3: UX Improvements (1 hora)
7. Tarea 6: Solicitud con 1 click (1h)

### Fase 4: Notificaciones (4 horas) - Opcional
8. Tarea 8: Sistema de notificaciones (4h)

**Total**: 16 horas (12 horas sin notificaciones)

---

## ✅ Checklist de Completitud

### Backend
- [ ] Endpoint GET /rent-requests/received implementado
- [ ] Validación de permisos en aprobar/rechazar
- [ ] Integración automática RentRequest → Transaction
- [ ] Tests unitarios de nuevos endpoints
- [ ] Documentación de API actualizada

### Frontend
- [ ] ReceivedRequestsSection conectado a API real
- [ ] Botones aprobar/rechazar funcionales
- [ ] Solicitud con 1 click (sin formulario)
- [ ] Botón ver perfil del estudiante
- [ ] Manejo de errores y loading states
- [ ] Tests de componentes modificados

### Integración
- [ ] Flujo completo probado end-to-end
- [ ] Validación de permisos funcionando
- [ ] Transacciones creándose correctamente
- [ ] Estados sincronizados entre RentRequest y Transaction

---

## 📞 Contacto y Soporte

Si tienes dudas sobre la implementación:
1. Revisa los archivos existentes mencionados en este documento
2. Consulta la documentación de Transaction en `backend-residencias/docs/`
3. Revisa el flujo P2P en `backend-residencias/src/services/transaction.service.ts`

**Última actualización**: 13 de abril de 2026
