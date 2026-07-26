# Centralized Error Handling

Este documento explica cómo usar el sistema de manejo de errores centralizado implementado para el proyecto.

## Requisitos Cumplidos

- **22.8**: Formato estándar de respuesta de error
- **22.9**: Mapeo de errores de validación a 400
- **22.10**: Mapeo de errores de autenticación a 401
- **22.11**: Mapeo de errores de autorización a 403
- **22.12**: Mapeo de errores de recurso no encontrado a 404
- **22.13**: Mapeo de errores internos a 500 sin exponer detalles

## Formato de Respuesta de Error

Todas las respuestas de error siguen este formato estándar:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje descriptivo del error",
    "details": {
      "field1": "Error específico del campo 1",
      "field2": "Error específico del campo 2"
    },
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## Clases de Error Disponibles

### 1. ValidationError (400)

Para errores de validación de datos de entrada.

```typescript
import { ValidationError } from '../middleware/error.middleware';

// Ejemplo básico
throw new ValidationError('El email es obligatorio');

// Con detalles de múltiples campos
throw new ValidationError('Errores de validación', {
  email: 'El email no es válido',
  password: 'La contraseña debe tener al menos 8 caracteres'
});
```

### 2. AuthenticationError (401)

Para errores de autenticación (usuario no autenticado).

```typescript
import { AuthenticationError } from '../middleware/error.middleware';

// Mensaje por defecto: "No autenticado"
throw new AuthenticationError();

// Mensaje personalizado
throw new AuthenticationError('Token expirado');
```

### 3. AuthorizationError (403)

Para errores de autorización (usuario autenticado pero sin permisos).

```typescript
import { AuthorizationError } from '../middleware/error.middleware';

// Mensaje por defecto
throw new AuthorizationError();

// Mensaje personalizado
throw new AuthorizationError('Necesitas ser operador para realizar esta acción');
```

### 4. NotFoundError (404)

Para recursos no encontrados.

```typescript
import { NotFoundError } from '../middleware/error.middleware';

// Mensaje por defecto: "Recurso no encontrado"
throw new NotFoundError();

// Mensaje personalizado
throw new NotFoundError('Verificación no encontrada');
```

### 5. ProcessingError (422)

Para errores de procesamiento de datos válidos pero que no pueden ser procesados.

```typescript
import { ProcessingError } from '../middleware/error.middleware';

throw new ProcessingError('No se pudo procesar la verificación', {
  reason: 'Documento vencido',
  expirationDate: '2023-12-31'
});
```

## Uso en Controladores

### Patrón Recomendado

```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { 
  AuthenticationError, 
  ValidationError, 
  NotFoundError 
} from '../middleware/error.middleware';

export async function myController(
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    // Validar autenticación
    if (!req.user) {
      throw new AuthenticationError();
    }

    // Validar datos de entrada
    if (!req.body.requiredField) {
      throw new ValidationError('El campo requiredField es obligatorio');
    }

    // Lógica del controlador
    const result = await someService.doSomething();

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    // Manejar errores específicos del dominio
    if (error.message.includes('not found')) {
      return next(new NotFoundError('Recurso no encontrado'));
    }

    // Delegar errores desconocidos al manejador centralizado
    next(error);
  }
}
```

### Ejemplo Completo: KYC Controller

```typescript
export async function startVerification(
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AuthenticationError();
    }

    const verification = await kycService.createVerification(req.user.userId);

    res.status(201).json({
      success: true,
      data: {
        verificationId: verification.id,
        status: verification.status
      }
    });
  } catch (error: any) {
    if (error.message.includes('Maximum of 3 verification attempts')) {
      return next(new AuthorizationError(
        'Has excedido el límite de intentos'
      ));
    }

    if (error.message.includes('already has an active verification')) {
      return next(new ValidationError(
        'Ya tienes una verificación en progreso'
      ));
    }

    next(error);
  }
}
```

## Errores Automáticos Manejados

El middleware maneja automáticamente estos errores sin necesidad de código adicional:

### Errores de Sequelize

- **SequelizeValidationError** → 400 (Validation Error)
- **SequelizeUniqueConstraintError** → 400 (Duplicate Entry)
- **SequelizeForeignKeyConstraintError** → 400 (Invalid Reference)

### Errores de Multer

- **MulterError (LIMIT_FILE_SIZE)** → 400 (File Too Large)
- Otros errores de Multer → 400 (Validation Error)

### Errores Genéricos

Cualquier error no manejado específicamente se convierte en:
- **500 Internal Server Error**
- En producción: mensaje genérico sin detalles
- En desarrollo: mensaje de error completo

## Integración en app.ts

El middleware ya está integrado en `app.ts`:

```typescript
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// ... rutas ...

// 404 handler (debe estar después de todas las rutas)
app.use(notFoundHandler);

// Error handler centralizado (debe estar al final)
app.use(errorHandler);
```

## Mapeo de Códigos HTTP

| Código | Clase de Error | Uso |
|--------|----------------|-----|
| 400 | ValidationError | Datos de entrada inválidos |
| 401 | AuthenticationError | Usuario no autenticado |
| 403 | AuthorizationError | Usuario sin permisos |
| 404 | NotFoundError | Recurso no encontrado |
| 422 | ProcessingError | Error de procesamiento |
| 500 | (Automático) | Error interno del servidor |

## Mejores Prácticas

1. **Siempre agregar `next: NextFunction`** como tercer parámetro en controladores
2. **Usar `throw` para errores conocidos** en lugar de `res.status().json()`
3. **Usar `next(error)`** para delegar errores al manejador centralizado
4. **Usar `return next(error)`** cuando necesites salir inmediatamente
5. **No exponer detalles sensibles** en mensajes de error
6. **Usar mensajes descriptivos** para ayudar al frontend a mostrar errores apropiados

## Ejemplo de Migración

### Antes (código antiguo):

```typescript
if (!req.user) {
  const response: ApiResponse = {
    success: false,
    error: {
      code: ErrorCodes.UNAUTHORIZED,
      message: 'No autenticado'
    }
  };
  res.status(401).json(response);
  return;
}
```

### Después (con error handling centralizado):

```typescript
if (!req.user) {
  throw new AuthenticationError();
}
```

Mucho más limpio y consistente! 🎉
