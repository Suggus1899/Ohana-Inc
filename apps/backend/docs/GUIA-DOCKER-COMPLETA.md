# Guía Completa de Docker - Backend Residencias

Esta guía documenta todos los comandos de Docker disponibles para trabajar con el proyecto, incluyendo base de datos, Redis, backend, y cómo interactuar con cada servicio.

---

## 📋 Tabla de Contenidos

1. [Comandos Básicos de Docker](#comandos-básicos-de-docker)
2. [Modo Producción](#modo-producción)
3. [Modo Desarrollo](#modo-desarrollo)
4. [Gestión de Base de Datos PostgreSQL](#gestión-de-base-de-datos-postgresql)
5. [Gestión de Redis](#gestión-de-redis)
6. [Logs y Debugging](#logs-y-debugging)
7. [Scripts del Backend](#scripts-del-backend)
8. [Limpieza y Reset](#limpieza-y-reset)
9. [Scripts NPM Disponibles](#scripts-npm-disponibles)
10. [Troubleshooting](#troubleshooting)

---

## 🐳 Comandos Básicos de Docker

### Verificar instalación de Docker
```bash
docker --version
docker-compose --version
```

### Ver contenedores en ejecución
```bash
docker ps
```

### Ver todos los contenedores (incluyendo detenidos)
```bash
docker ps -a
```

### Ver imágenes disponibles
```bash
docker images
```

### Ver volúmenes
```bash
docker volume ls
```

### Ver redes
```bash
docker network ls
```

---

## 🚀 Modo Producción

### Iniciar todos los servicios (PostgreSQL + Redis + Backend)
```bash
# Usando npm script (recomendado)
npm run docker:up

# O directamente con docker-compose
docker-compose --env-file .env up --build -d
```

**Servicios iniciados:**
- `residencias-postgres` - Base de datos PostgreSQL en puerto 5432
- `residencias-redis` - Redis en puerto 6379
- `residencias-backend` - Backend API en puerto 3001

### Detener todos los servicios
```bash
# Usando npm script
npm run docker:down

# O directamente
docker-compose down
```

### Reiniciar solo el backend
```bash
# Usando npm script
npm run docker:restart

# O directamente
docker-compose restart backend
```

### Ver logs del backend en tiempo real
```bash
# Usando npm script
npm run docker:logs

# O directamente
docker-compose logs -f backend
```

### Limpiar todo (contenedores + volúmenes)
```bash
# Usando npm script (CUIDADO: borra la base de datos)
npm run docker:clean

# O directamente
docker-compose down -v
```

---

## 🔧 Modo Desarrollo

El modo desarrollo incluye hot-reload automático cuando modificas archivos en `src/`.

### Iniciar en modo desarrollo
```bash
# Usando npm script
npm run docker:dev

# O directamente
docker-compose -f docker-compose.dev.yml up --build
```

**Diferencias con producción:**
- Hot-reload activado (cambios en `src/` se reflejan automáticamente)
- No ejecuta migraciones automáticamente al iniciar
- Usa `ts-node-dev` en lugar de código compilado
- Contenedores con sufijo `-dev`

### Detener modo desarrollo
```bash
npm run docker:dev:down
```

### Ver logs en modo desarrollo
```bash
npm run docker:dev:logs
```

### Limpiar modo desarrollo
```bash
npm run docker:dev:clean
```

---

## 🗄️ Gestión de Base de Datos PostgreSQL

### Conectarse a PostgreSQL desde la terminal

#### Opción 1: Usando docker exec (recomendado)
```bash
# Conectarse a la base de datos
docker exec -it residencias-postgres psql -U residencias_user -d residencias_db

# En modo desarrollo
docker exec -it residencias-postgres-dev psql -U residencias_user -d residencias_db
```

#### Opción 2: Desde tu máquina local (si tienes psql instalado)
```bash
psql -h localhost -p 5432 -U residencias_user -d residencias_db
```

### Comandos útiles dentro de psql

```sql
-- Ver todas las tablas
\dt

-- Describir estructura de una tabla
\d nombre_tabla

-- Ver todas las bases de datos
\l

-- Cambiar de base de datos
\c nombre_base_datos

-- Ver usuarios
\du

-- Salir de psql
\q

-- Ejecutar consulta SQL
SELECT * FROM users LIMIT 10;

-- Ver verificaciones KYC
SELECT id, "userId", status, "verificationLevel", "currentLevel", "createdAt" 
FROM kyc_verifications 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Ver documentos KYC
SELECT id, "verificationId", "documentType", "uploadedAt" 
FROM kyc_documents 
ORDER BY "uploadedAt" DESC 
LIMIT 10;

-- Contar usuarios por rol
SELECT role, COUNT(*) as total 
FROM users 
GROUP BY role;
```

### Ejecutar script SQL desde archivo
```bash
# Copiar archivo SQL al contenedor
docker cp mi-script.sql residencias-postgres:/tmp/mi-script.sql

# Ejecutar el script
docker exec -it residencias-postgres psql -U residencias_user -d residencias_db -f /tmp/mi-script.sql
```

### Backup de la base de datos
```bash
# Crear backup
docker exec residencias-postgres pg_dump -U residencias_user residencias_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker exec -i residencias-postgres psql -U residencias_user -d residencias_db < backup_20260412_120000.sql
```

### Ejecutar migraciones desde Docker

```bash
# Ejecutar migraciones (subir)
docker exec -it residencias-backend npm run migrate

# Revertir última migración
docker exec -it residencias-backend npm run migrate:down

# En modo desarrollo
docker exec -it residencias-backend-dev npm run migrate
```

---

## 🔴 Gestión de Redis

### Conectarse a Redis desde la terminal

```bash
# Conectarse a Redis CLI
docker exec -it residencias-redis redis-cli

# En modo desarrollo
docker exec -it residencias-redis-dev redis-cli
```

### Comandos útiles dentro de redis-cli

```bash
# Verificar conexión
PING
# Respuesta: PONG

# Ver todas las claves
KEYS *

# Ver valor de una clave
GET nombre_clave

# Establecer valor
SET mi_clave "mi_valor"

# Eliminar clave
DEL mi_clave

# Ver información del servidor
INFO

# Ver estadísticas de memoria
INFO memory

# Limpiar toda la base de datos (CUIDADO)
FLUSHDB

# Limpiar todas las bases de datos (CUIDADO)
FLUSHALL

# Salir
EXIT
```

### Monitorear comandos en tiempo real
```bash
docker exec -it residencias-redis redis-cli MONITOR
```

---

## 📊 Logs y Debugging

### Ver logs de todos los servicios
```bash
docker-compose logs -f
```

### Ver logs de un servicio específico
```bash
# Backend
docker-compose logs -f backend

# PostgreSQL
docker-compose logs -f postgres

# Redis
docker-compose logs -f redis
```

### Ver últimas 100 líneas de logs
```bash
docker-compose logs --tail=100 backend
```

### Ver logs sin seguir (snapshot)
```bash
docker-compose logs backend
```

### Ver logs con timestamps
```bash
docker-compose logs -f -t backend
```

### Acceder a la terminal del contenedor backend
```bash
# Producción
docker exec -it residencias-backend /bin/bash

# Desarrollo
docker exec -it residencias-backend-dev /bin/bash
```

### Ver procesos en ejecución dentro del contenedor
```bash
docker exec -it residencias-backend ps aux
```

### Ver uso de recursos
```bash
# Ver uso de CPU y memoria de todos los contenedores
docker stats

# Ver uso de un contenedor específico
docker stats residencias-backend
```

---

## 🔧 Scripts del Backend

Todos estos scripts se pueden ejecutar dentro del contenedor Docker.

### Ejecutar scripts desde Docker

```bash
# Sintaxis general
docker exec -it residencias-backend npm run <nombre-script>

# En modo desarrollo
docker exec -it residencias-backend-dev npm run <nombre-script>
```

### Scripts de Base de Datos

#### Sincronizar modelos (crea/actualiza tablas)
```bash
docker exec -it residencias-backend npm run sync
```
**Descripción:** Sincroniza los modelos de Sequelize con la base de datos. Crea tablas faltantes y actualiza estructuras.

#### Crear tablas faltantes
```bash
docker exec -it residencias-backend npm run create-tables
```
**Descripción:** Crea solo las tablas que no existen, sin modificar las existentes.

#### Ejecutar migraciones
```bash
# Subir migraciones
docker exec -it residencias-backend npm run migrate

# Bajar última migración
docker exec -it residencias-backend npm run migrate:down
```
**Descripción:** Ejecuta las migraciones pendientes o revierte la última migración aplicada.

#### Migraciones legacy (sistema antiguo)
```bash
# Subir migraciones legacy
docker exec -it residencias-backend npm run migrate:legacy:up

# Bajar migraciones legacy
docker exec -it residencias-backend npm run migrate:legacy:down
```

### Scripts de Datos de Prueba

#### Seed básico
```bash
docker exec -it residencias-backend npm run seed
```
**Descripción:** Inserta datos de prueba básicos (usuarios, propiedades).

#### Seed completo
```bash
docker exec -it residencias-backend npm run seed:complete
```
**Descripción:** Inserta conjunto completo de datos de prueba incluyendo usuarios, propiedades, reservas, etc.

#### Reset completo (sync + seed)
```bash
docker exec -it residencias-backend npm run reset
```
**Descripción:** Sincroniza modelos y luego ejecuta seed completo. **CUIDADO:** Puede borrar datos existentes.

### Scripts de Verificación

#### Verificar usuarios
```bash
docker exec -it residencias-backend npm run check-users
```
**Descripción:** Muestra lista de usuarios en la base de datos con sus roles y niveles de verificación.

#### Test de seguridad
```bash
docker exec -it residencias-backend npm run test:security
```
**Descripción:** Ejecuta pruebas de seguridad del sistema.

### Scripts de Configuración

#### Descargar modelos de Face API
```bash
docker exec -it residencias-backend npm run download:models
```
**Descripción:** Descarga los modelos de TensorFlow necesarios para detección facial y liveness.

#### Generar clave de encriptación
```bash
docker exec -it residencias-backend npm run generate:key
```
**Descripción:** Genera una nueva clave de encriptación de 256 bits para documentos KYC.

#### Validar dependencias
```bash
docker exec -it residencias-backend npm run validate:dependencies
```
**Descripción:** Verifica que todas las dependencias necesarias estén instaladas correctamente.

### Scripts de Testing

#### Ejecutar tests con cobertura
```bash
docker exec -it residencias-backend npm run test
```
**Descripción:** Ejecuta toda la suite de tests con reporte de cobertura.

#### Ejecutar tests en modo watch
```bash
docker exec -it residencias-backend npm run test:watch
```
**Descripción:** Ejecuta tests en modo watch (se re-ejecutan al cambiar archivos).

---

## 🧹 Limpieza y Reset

### Limpiar contenedores detenidos
```bash
docker container prune
```

### Limpiar imágenes no utilizadas
```bash
docker image prune
```

### Limpiar volúmenes no utilizados
```bash
docker volume prune
```

### Limpiar todo (contenedores, imágenes, volúmenes, redes)
```bash
# CUIDADO: Esto borra TODO
docker system prune -a --volumes
```

### Rebuild completo desde cero

```bash
# 1. Detener y eliminar todo
docker-compose down -v

# 2. Eliminar imágenes del proyecto
docker rmi backend-residencias-backend
docker rmi postgres:16-alpine
docker rmi redis:7-alpine

# 3. Limpiar caché de build
docker builder prune -a

# 4. Rebuild y reiniciar
docker-compose up --build -d
```

### Reset de base de datos (mantener contenedores)

```bash
# Opción 1: Eliminar solo el volumen de PostgreSQL
docker-compose down
docker volume rm backend-residencias_postgres_data
docker-compose up -d

# Opción 2: Desde dentro del contenedor
docker exec -it residencias-postgres psql -U residencias_user -d residencias_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker exec -it residencias-backend npm run migrate
docker exec -it residencias-backend npm run seed:complete
```

---

## 📦 Scripts NPM Disponibles

### Scripts de Desarrollo
| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `npm run dev` | Inicia servidor en modo desarrollo con hot-reload (fuera de Docker) |
| `build` | `npm run build` | Compila TypeScript a JavaScript en carpeta `dist/` |
| `start` | `npm start` | Inicia servidor desde código compilado |

### Scripts de Base de Datos
| Script | Comando | Descripción |
|--------|---------|-------------|
| `sync` | `npm run sync` | Sincroniza modelos Sequelize con la base de datos |
| `create-tables` | `npm run create-tables` | Crea tablas faltantes sin modificar existentes |
| `migrate` | `npm run migrate` | Ejecuta migraciones pendientes (subir) |
| `migrate:down` | `npm run migrate:down` | Revierte última migración |
| `migrate:legacy:up` | `npm run migrate:legacy:up` | Ejecuta migraciones legacy (sistema antiguo) |
| `migrate:legacy:down` | `npm run migrate:legacy:down` | Revierte migraciones legacy |

### Scripts de Datos
| Script | Comando | Descripción |
|--------|---------|-------------|
| `seed` | `npm run seed` | Inserta datos de prueba básicos |
| `seed:complete` | `npm run seed:complete` | Inserta conjunto completo de datos de prueba |
| `reset` | `npm run reset` | Sincroniza modelos + seed completo |

### Scripts de Verificación
| Script | Comando | Descripción |
|--------|---------|-------------|
| `check-users` | `npm run check-users` | Muestra usuarios en la base de datos |
| `test:security` | `npm run test:security` | Ejecuta pruebas de seguridad |
| `validate:dependencies` | `npm run validate:dependencies` | Verifica dependencias instaladas |

### Scripts de Configuración
| Script | Comando | Descripción |
|--------|---------|-------------|
| `download:models` | `npm run download:models` | Descarga modelos de Face API |
| `generate:key` | `npm run generate:key` | Genera clave de encriptación |

### Scripts de Testing
| Script | Comando | Descripción |
|--------|---------|-------------|
| `test` | `npm test` | Ejecuta tests con cobertura |
| `test:watch` | `npm run test:watch` | Ejecuta tests en modo watch |

### Scripts de Docker - Producción
| Script | Comando | Descripción |
|--------|---------|-------------|
| `docker:up` | `npm run docker:up` | Inicia todos los servicios en producción |
| `docker:down` | `npm run docker:down` | Detiene todos los servicios |
| `docker:logs` | `npm run docker:logs` | Ver logs del backend en tiempo real |
| `docker:restart` | `npm run docker:restart` | Reinicia solo el backend |
| `docker:clean` | `npm run docker:clean` | Detiene y elimina volúmenes (⚠️ borra BD) |

### Scripts de Docker - Desarrollo
| Script | Comando | Descripción |
|--------|---------|-------------|
| `docker:dev` | `npm run docker:dev` | Inicia servicios en modo desarrollo |
| `docker:dev:down` | `npm run docker:dev:down` | Detiene servicios de desarrollo |
| `docker:dev:logs` | `npm run docker:dev:logs` | Ver logs en modo desarrollo |
| `docker:dev:clean` | `npm run docker:dev:clean` | Limpia servicios de desarrollo |

---

## 🔍 Troubleshooting

### El backend no inicia

```bash
# Ver logs detallados
docker-compose logs backend

# Verificar que PostgreSQL esté listo
docker exec -it residencias-postgres pg_isready -U residencias_user

# Verificar que Redis esté listo
docker exec -it residencias-redis redis-cli PING

# Reiniciar backend
docker-compose restart backend
```

### Error de conexión a PostgreSQL

```bash
# Verificar que el contenedor esté corriendo
docker ps | grep postgres

# Verificar variables de entorno
docker exec -it residencias-backend env | grep DB_

# Probar conexión manualmente
docker exec -it residencias-postgres psql -U residencias_user -d residencias_db -c "SELECT 1;"
```

### Error "port already in use"

```bash
# Ver qué proceso usa el puerto 3001
netstat -ano | findstr :3001  # Windows
lsof -i :3001                  # Linux/Mac

# Cambiar puerto en .env
# DB_PORT=5433 (para PostgreSQL)
# O cambiar puerto del backend en docker-compose.yml
```

### Volúmenes con permisos incorrectos

```bash
# En Linux/Mac, dar permisos a carpetas
sudo chown -R $USER:$USER ./storage ./logs ./models

# O ejecutar contenedor como root (no recomendado en producción)
docker-compose run --user root backend bash
```

### Hot-reload no funciona en modo desarrollo

```bash
# Verificar que los volúmenes estén montados correctamente
docker inspect residencias-backend-dev | grep -A 10 Mounts

# Reiniciar en modo desarrollo
npm run docker:dev:down
npm run docker:dev
```

### Limpiar caché de Docker completamente

```bash
# Detener todos los contenedores
docker stop $(docker ps -aq)

# Eliminar todos los contenedores
docker rm $(docker ps -aq)

# Eliminar todas las imágenes
docker rmi $(docker images -q)

# Eliminar todos los volúmenes
docker volume rm $(docker volume ls -q)

# Limpiar sistema completo
docker system prune -a --volumes
```

---

## 📝 Flujo de Trabajo Recomendado

### Para Desarrollo Diario

1. **Iniciar servicios en modo desarrollo:**
   ```bash
   npm run docker:dev
   ```

2. **Verificar que todo esté corriendo:**
   ```bash
   docker ps
   ```

3. **Ver logs si hay problemas:**
   ```bash
   npm run docker:dev:logs
   ```

4. **Hacer cambios en el código** (hot-reload automático)

5. **Ejecutar migraciones si es necesario:**
   ```bash
   docker exec -it residencias-backend-dev npm run migrate
   ```

6. **Ejecutar tests:**
   ```bash
   docker exec -it residencias-backend-dev npm test
   ```

7. **Al terminar, detener servicios:**
   ```bash
   npm run docker:dev:down
   ```

### Para Producción/Testing

1. **Build y deploy:**
   ```bash
   npm run docker:up
   ```

2. **Verificar salud de servicios:**
   ```bash
   docker ps
   curl http://localhost:3001/api/health
   ```

3. **Monitorear logs:**
   ```bash
   npm run docker:logs
   ```

4. **Ejecutar migraciones en producción:**
   ```bash
   docker exec -it residencias-backend npm run migrate
   ```

---

## 🎯 Comandos Rápidos de Referencia

```bash
# Iniciar todo (producción)
npm run docker:up

# Iniciar todo (desarrollo con hot-reload)
npm run docker:dev

# Ver logs del backend
npm run docker:logs

# Conectarse a PostgreSQL
docker exec -it residencias-postgres psql -U residencias_user -d residencias_db

# Conectarse a Redis
docker exec -it residencias-redis redis-cli

# Ejecutar migraciones
docker exec -it residencias-backend npm run migrate

# Ejecutar seed de datos
docker exec -it residencias-backend npm run seed:complete

# Ver usuarios en la BD
docker exec -it residencias-backend npm run check-users

# Ejecutar tests
docker exec -it residencias-backend npm test

# Detener todo
npm run docker:down

# Limpiar todo (⚠️ borra base de datos)
npm run docker:clean
```

---

## 📚 Recursos Adicionales

- [Documentación oficial de Docker](https://docs.docker.com/)
- [Documentación de Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL en Docker](https://hub.docker.com/_/postgres)
- [Redis en Docker](https://hub.docker.com/_/redis)

---

**Última actualización:** 2026-04-12
