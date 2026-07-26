# Instrucciones Rápidas - Sistema KYC por Niveles

## ✅ Pasos para Activar el Sistema

### 1. Aplicar Migración de Base de Datos

```bash
cd backend-residencias
npm run migrate
```

Esto creará las nuevas columnas en la tabla `kyc_verifications`:
- `currentLevel`
- `level1Data`, `level2Data`, `level3Data`
- `level1CompletedAt`, `level2CompletedAt`, `level3CompletedAt`

### 2. Reiniciar el Servidor

```bash
# Modo desarrollo
npm run dev

# O modo producción
npm start
```

### 3. Probar los Nuevos Endpoints

#### Obtener Progreso Actual
```bash
curl -X GET http://localhost:3000/api/kyc/level/progress \
  -H "Authorization: Bearer REDACTED"
```

#### Guardar Progreso del Nivel 1
```bash
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
```

#### Completar Nivel 1
```bash
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

## 📋 Nuevos Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/kyc/level/save` | Guardar progreso parcial de un nivel |
| POST | `/api/kyc/level/complete` | Completar un nivel (1, 2 o 3) |
| GET | `/api/kyc/level/progress` | Obtener progreso actual del usuario |

## 🔄 Flujo Completo del Estudiante

### Paso 1: Iniciar Verificación
```bash
POST /api/kyc/start
```

### Paso 2: Completar Nivel 1 (Información Básica)
```bash
POST /api/kyc/level/complete
Body: {
  "level": 1,
  "data": {
    "fullName": "Juan Pérez",
    "documentType": "cedula",
    "documentNumber": "12345678",
    "dateOfBirth": "1995-05-15"
  }
}
```

### Paso 3: Completar Nivel 2 (Información Adicional)
```bash
POST /api/kyc/level/complete
Body: {
  "level": 2,
  "data": {
    "nationality": "Venezolana",
    "address": "Calle Principal #123",
    "city": "Caracas",
    "state": "Miranda",
    "postalCode": "1010"
  }
}
```

### Paso 4: Subir Documentos (Nivel 3)
```bash
# Subir cada documento
POST /api/kyc/upload
Body (multipart/form-data): {
  verificationId: 123,
  documentType: "id_front",
  file: [archivo]
}

# Repetir para:
# - id_back
# - selfie
# - selfie_with_doc
# - liveness_video
# - proof_of_address
```

### Paso 5: Completar Nivel 3
```bash
POST /api/kyc/level/complete
Body: {
  "level": 3,
  "data": {
    "documentsUploaded": true,
    "uploadedAt": "2026-04-09T10:30:00.000Z"
  }
}
```

**Resultado:** La solicitud se envía automáticamente al panel de operador y se notifica por email.

## 👨‍💼 Panel de Operador

Los operadores recibirán:
1. Email de notificación cuando se complete el nivel 3
2. La verificación aparecerá en `/api/kyc/admin/pending` con estado `pending_review`
3. Pueden aprobar/rechazar usando los endpoints existentes:
   - `POST /api/kyc/admin/approve/:verificationId`
   - `POST /api/kyc/admin/reject/:verificationId`

## 📚 Documentación Completa

- **Sistema completo:** `docs/KYC_LEVELS_SYSTEM.md`
- **Ejemplo frontend:** `docs/KYC_FRONTEND_EXAMPLE.md`
- **Resumen de cambios:** `CAMBIOS-KYC-NIVELES.md`

## ⚠️ Notas Importantes

1. **Compatibilidad:** El sistema es retrocompatible. Las verificaciones existentes seguirán funcionando.

2. **Orden de niveles:** Los niveles deben completarse en orden (1 → 2 → 3). El sistema valida esto automáticamente.

3. **Guardado automático:** Se recomienda implementar auto-guardado en el frontend usando `/api/kyc/level/save`.

4. **Notificaciones:** Asegúrate de que las variables de entorno SMTP estén configuradas para que funcionen las notificaciones por email.

5. **Seguridad:** Todos los endpoints requieren autenticación JWT válida.

## 🐛 Solución de Problemas

### Error: "Debes completar el nivel X antes de continuar"
- Asegúrate de completar los niveles en orden (1, 2, 3)
- Verifica el progreso con `GET /api/kyc/level/progress`

### Error: "No se encontró una verificación activa"
- Primero debes iniciar la verificación con `POST /api/kyc/start`

### No llegan notificaciones a operadores
- Verifica la configuración SMTP en las variables de entorno
- Revisa los logs del servidor para errores de email

### Error de migración
- Asegúrate de tener PostgreSQL corriendo
- Verifica las credenciales de base de datos en `.env`
- Revisa que no haya migraciones pendientes

## 🚀 Siguiente Paso

Implementar el frontend usando el ejemplo en `docs/KYC_FRONTEND_EXAMPLE.md`
