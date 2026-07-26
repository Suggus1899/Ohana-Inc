# 🎯 Primera Vez - Setup Completo

## ⚠️ Si es tu primera vez, sigue estos pasos

### 1️⃣ Iniciar Docker
```bash
npm run docker:dev
```

Espera a que aparezca:
```
✅ Server running on port 5000
```

---

### 2️⃣ Ejecutar Migraciones (IMPORTANTE)
En otra terminal, ejecuta:
```bash
docker-compose -f docker-compose.dev.yml exec backend npm run migrate
```

O más corto:
```bash
docker exec -it residencias-backend-dev npm run migrate
```

**Deberías ver:**
```
✅ Migration 20260311-add-account-status executed
✅ Migration 20260402-add-verifiedById-column executed
✅ Migration 20260403-add-escalation-to-tickets executed
✅ Migration 20260404-add-verification-level executed
✅ Migration 20260405-create-kyc-verifications executed
✅ Migration 20260406-create-kyc-documents executed
✅ Migration 20260406-create-p2p-escrow-tables executed
✅ Migration 20260407-create-kyc-attempts executed
✅ Migration 20260408-add-consented-at executed
```

---

### 3️⃣ Ejecutar Seeds (Opcional - Datos de Prueba)
```bash
docker-compose -f docker-compose.dev.yml exec backend npm run seed:complete
```

O:
```bash
docker exec -it residencias-backend-dev npm run seed:complete
```

**Esto crea:**
- Usuarios de prueba
- Propiedades de ejemplo
- Datos de demostración

---

### 4️⃣ Verificar que Todo Funciona

#### Opción A: Desde el navegador
```
http://localhost:3001/api/health
```

Debe responder:
```json
{
  "status": "ok",
  "timestamp": "2026-04-09T..."
}
```

#### Opción B: Desde terminal
```bash
curl http://localhost:3001/api/health
```

---

### 5️⃣ Verificar Tablas en la Base de Datos
```bash
docker exec -it residencias-postgres-dev psql -U residencias_user -d residencias_db -c "\dt"
```

**Deberías ver:**
```
 public | disputes
 public | favorites
 public | kyc_attempts
 public | kyc_documents
 public | kyc_verifications
 public | properties
 public | property_assignments
 public | rent_requests
 public | tasks
 public | tickets
 public | transaction_timelines
 public | transactions
 public | user_reports
 public | users
```

---

## ✅ ¡Listo!

Ahora puedes:
1. Registrarte en el frontend
2. Hacer login
3. Usar la aplicación

---

## 🔄 Próximas Veces

Las siguientes veces que inicies el proyecto, solo necesitas:

```bash
npm run docker:dev
```

**NO necesitas ejecutar migraciones de nuevo** (a menos que haya nuevas migraciones).

---

## 🐛 Si Algo Sale Mal

### Error: "relation users does not exist"
Significa que no ejecutaste las migraciones. Ejecuta:
```bash
docker-compose -f docker-compose.dev.yml exec backend npm run migrate
```

### Error: "Cannot connect to database"
Verifica que PostgreSQL esté corriendo:
```bash
docker ps
```

Debes ver `residencias-postgres-dev` en la lista.

### Error: "Port 3001 already in use"
Detén el contenedor anterior:
```bash
npm run docker:down
npm run docker:dev
```

### Empezar de Cero
Si quieres limpiar todo y empezar de nuevo:
```bash
# Detener y limpiar todo (BORRA LA BASE DE DATOS)
npm run docker:dev:clean

# Iniciar de nuevo
npm run docker:dev

# Ejecutar migraciones
docker-compose -f docker-compose.dev.yml exec backend npm run migrate

# Ejecutar seeds
docker-compose -f docker-compose.dev.yml exec backend npm run seed:complete
```

---

## 📋 Resumen de Comandos

```bash
# 1. Iniciar (siempre)
npm run docker:dev

# 2. Migraciones (primera vez o cuando hay nuevas)
docker-compose -f docker-compose.dev.yml exec backend npm run migrate

# 3. Seeds (opcional, para datos de prueba)
docker-compose -f docker-compose.dev.yml exec backend npm run seed:complete

# 4. Verificar
curl http://localhost:3001/api/health
```

---

## 🎯 Siguiente Paso

Lee [START-HERE.md](./START-HERE.md) para aprender más sobre el desarrollo con hot-reload.
