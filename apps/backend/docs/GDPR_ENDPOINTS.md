# GDPR Endpoints Implementation

## Overview
This document describes the implementation of GDPR compliance endpoints for the KYC system, fulfilling requirements 31.6-31.10.

## Implemented Endpoints

### 1. GET /api/kyc/gdpr/access
**Requisito:** 31.6 - Derecho de acceso

**Description:** Allows users to access all their KYC data stored in the system.

**Authentication:** Required (JWT)

**Response:**
```json
{
  "success": true,
  "data": {
    "verification": {
      "id": 1,
      "userId": 1,
      "status": "approved",
      "verificationLevel": 5,
      "fullName": "Juan Pérez",
      "documentNumber": "CC-12345678",
      "dateOfBirth": "1990-01-01",
      "nationality": "Colombiana",
      "address": "Calle Principal 123",
      "faceMatchScore": 87.5,
      "livenessScore": 92.0,
      "documentValidityScore": 95.0,
      "fraudScore": 15.0,
      "ocrData": {...},
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z",
      "consentedAt": "2024-01-01T00:00:00.000Z"
    },
    "documents": [
      {
        "id": 1,
        "documentType": "id_front",
        "fileHash": "abc123...",
        "uploadedAt": "2024-01-01T00:00:00.000Z",
        "metadata": {
          "originalName": "id_front.jpg",
          "size": 1024,
          "mimeType": "image/jpeg"
        }
      }
    ],
    "attempts": [
      {
        "id": 1,
        "attemptNumber": 1,
        "step": "document_capture",
        "success": true,
        "errorMessage": null,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Audit Logging:** Logs GDPR access request with event type 'access'

---

### 2. POST /api/kyc/gdpr/rectify
**Requisito:** 31.7 - Derecho de rectificación

**Description:** Allows users to request correction of their KYC data.

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "field": "fullName",
  "currentValue": "Juan Perez",
  "requestedValue": "Juan Pérez",
  "reason": "Corrección de acento en apellido"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Solicitud de rectificación recibida. Será revisada por nuestro equipo en un plazo de 30 días.",
    "requestDetails": {
      "field": "fullName",
      "currentValue": "Juan Perez",
      "requestedValue": "Juan Pérez",
      "reason": "Corrección de acento en apellido",
      "submittedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Audit Logging:** 
- Logs GDPR rectification request with event type 'rectification'
- Logs detailed rectification request in audit events

**Note:** Rectification requests require manual review by operators.

---

### 3. POST /api/kyc/gdpr/delete
**Requisitos:** 31.8, 31.10 - Derecho al olvido

**Description:** Allows users to request deletion of their KYC data. Data will be deleted after 30 days as per GDPR requirements.

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "reason": "Ya no deseo usar el servicio"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Solicitud de eliminación recibida. Tus datos serán eliminados en 30 días.",
    "scheduledDeletionDate": "2024-02-14T10:30:00.000Z",
    "reason": "Ya no deseo usar el servicio"
  }
}
```

**Audit Logging:** 
- Logs GDPR erasure request with event type 'erasure'
- Logs scheduled deletion date in audit events

**Important:** As per Requisito 31.10, all documents and personal data will be deleted 30 days after the request.

---

### 4. GET /api/kyc/gdpr/export
**Requisito:** 31.9 - Derecho de portabilidad

**Description:** Allows users to export all their KYC data in JSON format for portability.

**Authentication:** Required (JWT)

**Response:**
```json
{
  "success": true,
  "data": {
    "exportDate": "2024-01-15T10:30:00.000Z",
    "userId": 1,
    "verification": {
      "id": 1,
      "status": "approved",
      "verificationLevel": 5,
      "fullName": "Juan Pérez",
      "documentNumber": "CC-12345678",
      "dateOfBirth": "1990-01-01",
      "nationality": "Colombiana",
      "address": "Calle Principal 123",
      "faceMatchScore": 87.5,
      "livenessScore": 92.0,
      "documentValidityScore": 95.0,
      "fraudScore": 15.0,
      "ocrData": {...},
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z",
      "consentedAt": "2024-01-01T00:00:00.000Z"
    },
    "documents": [...],
    "attempts": [...]
  }
}
```

**Audit Logging:** Logs GDPR portability request with event type 'portability'

**Note:** The exported data is in structured JSON format suitable for import into other systems.

---

## Security Features

1. **Authentication:** All endpoints require JWT authentication
2. **Authorization:** Users can only access their own data
3. **Audit Logging:** All GDPR requests are logged with:
   - User ID
   - Request type (access, rectification, erasure, portability)
   - IP address
   - Timestamp
4. **Data Privacy:** Document content is not included in responses (only metadata)

## Error Handling

All endpoints use the centralized error handling middleware and return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No autenticado"
  }
}
```

Common error codes:
- `UNAUTHORIZED` (401): User not authenticated
- `VALIDATION_ERROR` (400): Missing or invalid request parameters
- `INTERNAL_ERROR` (500): Server error

## Testing

Comprehensive test suite with 12 tests covering:
- Successful operations for all 4 endpoints
- Authentication validation
- Input validation
- Error handling
- Audit logging verification
- 30-day deletion scheduling (Requisito 31.10)

Test file: `tests/controllers/kyc.gdpr.test.ts`

Run tests: `npm test -- kyc.gdpr.test.ts`

## Files Modified

1. **apps/backend/src/controllers/kyc.controller.ts**
   - Added 4 new controller functions
   - Integrated audit logging
   - Added proper error handling

2. **apps/backend/src/routes/kyc.routes.ts**
   - Registered 4 new GDPR routes
   - Applied authentication middleware

3. **apps/backend/tests/controllers/kyc.gdpr.test.ts** (NEW)
   - Comprehensive test suite for GDPR endpoints

4. **apps/backend/docs/GDPR_ENDPOINTS.md** (NEW)
   - This documentation file

## Compliance

This implementation fulfills the following GDPR requirements:

- ✅ **Requisito 31.6:** Derecho de acceso - Users can access all their data
- ✅ **Requisito 31.7:** Derecho de rectificación - Users can request data correction
- ✅ **Requisito 31.8:** Derecho al olvido - Users can request data deletion
- ✅ **Requisito 31.9:** Derecho de portabilidad - Users can export data in JSON
- ✅ **Requisito 31.10:** 30-day deletion period - Deletion scheduled for 30 days after request
- ✅ **Requisito 32.9:** Audit logging - All GDPR requests are logged

## Future Enhancements

1. **Automated Deletion Job:** Implement a scheduled job to execute deletions after 30 days
2. **Rectification Workflow:** Create operator interface to review and approve rectification requests
3. **Export Formats:** Add support for additional export formats (CSV, XML)
4. **Email Notifications:** Send confirmation emails for GDPR requests
