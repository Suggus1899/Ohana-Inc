# MetricsService

Servicio para agregar y calcular métricas del sistema KYC de verificación de identidad.

## Requisitos Implementados

- **33.1**: Tiempo promedio de completar verificación
- **33.2**: Tasa de aprobación de verificaciones
- **33.3**: Tasa de rechazo de verificaciones
- **33.4**: Razones más comunes de rechazo
- **33.5**: Tiempo promedio de revisión manual por operador
- **33.6**: Cantidad de verificaciones pendientes en cola
- **33.7**: Tasa de éxito de comparación facial
- **33.8**: Tasa de éxito de detección de vida
- **33.9**: Tasa de éxito de OCR
- **33.10**: Distribución de puntuaciones de fraude
- **33.12**: Alerta cuando la cola de revisión excede 100 verificaciones
- **33.13**: Alerta cuando la tasa de rechazo excede 30% en un día

## Uso

```typescript
import { MetricsService } from './services/metrics.service';

const metricsService = new MetricsService();

// Obtener todas las métricas
const allMetrics = await metricsService.getAllMetrics();

// Obtener métricas específicas
const verificationMetrics = await metricsService.getVerificationMetrics();
const rejectionReasons = await metricsService.getRejectionReasons();
const operatorMetrics = await metricsService.getOperatorMetrics();
const pendingMetrics = await metricsService.getPendingMetrics();
const componentSuccessRates = await metricsService.getComponentSuccessRates();
const fraudScoreDistribution = await metricsService.getFraudScoreDistribution();

// Verificar si se deben enviar alertas
const shouldAlertQueue = await metricsService.shouldAlertPendingQueue();
const shouldAlertRejection = await metricsService.shouldAlertRejectionRate();
```

## Interfaces

### VerificationMetrics
```typescript
{
  averageCompletionTime: number | null; // En horas
  approvalRate: number; // Porcentaje 0-100
  rejectionRate: number; // Porcentaje 0-100
  totalVerifications: number;
  approvedCount: number;
  rejectedCount: number;
}
```

### RejectionReasons
```typescript
{
  reason: string;
  count: number;
  percentage: number;
}
```

### OperatorMetrics
```typescript
{
  operatorId: number;
  averageReviewTime: number | null; // En horas
  totalReviews: number;
  approvedCount: number;
  rejectedCount: number;
}
```

### PendingMetrics
```typescript
{
  pendingCount: number;
  oldestPendingDate: Date | null;
  averageWaitTime: number | null; // En horas
}
```

### ComponentSuccessRates
```typescript
{
  faceMatchSuccessRate: number; // Porcentaje 0-100
  livenessSuccessRate: number; // Porcentaje 0-100
  ocrSuccessRate: number; // Porcentaje 0-100
  totalAttempts: number;
  faceMatchSuccessCount: number;
  livenessSuccessCount: number;
  ocrSuccessCount: number;
}
```

### FraudScoreDistribution
```typescript
{
  range: string; // e.g., "0-10", "10-20", etc.
  count: number;
  percentage: number;
}
```

## Notas de Implementación

- Todas las métricas de tiempo se calculan en horas
- Los porcentajes se calculan con precisión decimal (0-100)
- Las consultas utilizan agregaciones SQL para eficiencia
- La distribución de fraud scores se agrupa en rangos de 10 puntos
- Las alertas se pueden integrar con el NotificationService para enviar notificaciones automáticas
