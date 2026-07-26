# Migración: kyc_documents

## Descripción

Esta migración crea la tabla `kyc_documents` que almacena metadatos de cada documento encriptado del proceso KYC (Know Your Customer).

## Requisitos Implementados

- **17.1**: Tabla kyc_documents con campos: id, verificationId, documentType, url, encryptedUrl, fileHash, metadata, uploadedAt
- **17.2**: Foreign key verificationId referenciando kyc_verifications(id) con ON DELETE CASCADE
- **17.3**: ENUM documentType con 6 valores: id_front, id_back, selfie, selfie_with_doc, liveness_video, proof_of_address
- **17.4**: Campo url (TEXT) para URL original del archivo
- **17.5**: Campo encryptedUrl (TEXT) para URL del archivo encriptado
- **17.6**: Campo fileHash (STRING 64) para hash SHA-256 del archivo
- **17.7**: Campo metadata (JSONB) para metadatos adicionales (originalName, size, mimeType, iv, authTag)
- **17.8**: Campo uploadedAt con valor por defecto NOW()
- **17.9**: Índices en verificationId, documentType, fileHash
- **17.10**: Sin timestamps automáticos (solo uploadedAt manual)

## Estructura de la Tabla

```sql
CREATE TABLE kyc_documents (
  id SERIAL PRIMARY KEY,
  verificationId INTEGER NOT NULL REFERENCES kyc_verifications(id) ON DELETE CASCADE ON UPDATE CASCADE,
  documentType ENUM('id_front', 'id_back', 'selfie', 'selfie_with_doc', 'liveness_video', 'proof_of_address') NOT NULL,
  url TEXT NOT NULL,
  encryptedUrl TEXT NOT NULL,
  fileHash VARCHAR(64) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  uploadedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

## Índices Creados

1. **kyc_documents_pkey**: Índice primario en `id`
2. **kyc_documents_verification_id_idx**: Índice en `verificationId` para búsquedas por verificación
3. **kyc_documents_document_type_idx**: Índice en `documentType` para filtrar por tipo de documento
4. **kyc_documents_file_hash_idx**: Índice en `fileHash` para verificación de integridad y detección de duplicados

## ENUM documentType

Los valores del ENUM representan los diferentes tipos de documentos que se pueden cargar:

- **id_front**: Documento de identidad (frente)
- **id_back**: Documento de identidad (reverso)
- **selfie**: Selfie del usuario
- **selfie_with_doc**: Selfie sosteniendo el documento
- **liveness_video**: Video de detección de vida
- **proof_of_address**: Comprobante de domicilio

## Campo metadata (JSONB)

El campo `metadata` almacena información adicional en formato JSON:

```json
{
  "originalName": "cedula_frente.jpg",
  "size": 2048576,
  "mimeType": "image/jpeg",
  "iv": "a1b2c3d4e5f6...",
  "authTag": "x1y2z3..."
}
```

- **originalName**: Nombre original del archivo subido
- **size**: Tamaño del archivo en bytes
- **mimeType**: Tipo MIME del archivo (image/jpeg, video/webm, etc.)
- **iv**: Initialization Vector usado en la encriptación AES-256-GCM
- **authTag**: Authentication Tag para verificar integridad del archivo encriptado

## Relación con kyc_verifications

La tabla tiene una relación **muchos a uno** con `kyc_verifications`:
- Una verificación puede tener múltiples documentos
- Cada documento pertenece a una única verificación
- Si se elimina una verificación, todos sus documentos se eliminan automáticamente (CASCADE)

## Uso

### Ejecutar migración

```bash
npx ts-node src/scripts/run-kyc-documents-migration.ts up
```

### Revertir migración

```bash
npx ts-node src/scripts/run-kyc-documents-migration.ts down
```

### Verificar tabla

```bash
npx ts-node src/scripts/verify-kyc-documents-table.ts
```

## Notas de Seguridad

1. **Encriptación**: Todos los documentos deben ser encriptados antes de almacenarse. El campo `encryptedUrl` apunta al archivo encriptado.
2. **Hash SHA-256**: El campo `fileHash` almacena el hash del archivo original (antes de encriptar) para verificar integridad.
3. **Metadata sensible**: Los campos `iv` y `authTag` en metadata son críticos para desencriptar los archivos.
4. **Cascada de eliminación**: Al eliminar una verificación, todos los documentos asociados se eliminan automáticamente.

## Fecha de Creación

2026-04-06
