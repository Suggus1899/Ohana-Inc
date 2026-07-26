# Guía de Docker - Backend Residencias

## 📋 Requisitos Previos

1. Docker Desktop instalado y corriendo
2. Verificar que Docker está activo: `docker --version`

## 🎯 Modos de Ejecución

Este proyecto tiene DOS configuraciones de Docker:

### 🔥 Modo DESARROLLO (Recomendado para desarrollo diario)
- ✅ Hot-reload automático (cambios instantáneos)
- ✅ No requiere rebuild al cambiar código
- ✅ Código fuente montado como volumen
- 📝 Usa: `docker-compose.dev.yml`
- 🚀 Comando: `npm run docker:dev`

### 🏭 Modo PRODUCCIÓN
- ✅ Código compilado y optimizado
- ✅ Imagen más pequeña
- ❌ Requiere rebuild para ver cambios
- 📝 Usa: `docker-compose.yml`
- 🚀 Comando: `npm run docker:up`

---

## 🔥 DESARROLLO - Hot Reload

### Iniciar en modo desarrollo

```bash
# Opción 1: Script directo (Windows)
docker-start-dev.bat

# Opción 2: Usando npm (recomendado)
npm run docker:dev

# Opción 3: En background
docker-compose -f docker-compose.dev.yml up --build -d
```

### Gestión en desarrollo

```bash
# Ver logs en tiempo real
npm run docker:dev:logs

# Detener servicios
npm run docker:dev:down

# Reiniciar backend (mantiene hot-reload)
docker-compose -f docker-compose.dev.yml restart backend

# Limpiar todo (incluye BD)
npm run docker:dev:clean
```

### ✨ Ventajas del modo desarrollo
- Editas código en `src/`
- Guardas (Ctrl+S)
- Los cambios se reflejan automáticamente
- NO necesitas reconstruir ni reiniciar

---

## 🏭 PRODUCCIÓN - Comandos Básicos

### Iniciar los servicios

```bash
# Opción 1: Usando npm script (recomendado)
npm run docker:up

# Opción 2: Comando directo
docker-compose up -d

# Opción 3: Con rebuild forzado
docker-compose up -d --build
```

### Detener los servicios

```bash
# Opción 1: Usando npm script
npm run docker:down

# Opción 2: Comando directo
docker-compose down
```

### Reiniciar solo el backend

```bash
npm run docker:restart
```

## 📝 Ver Logs

### Ver logs en tiempo real (seguir logs)

```bash
# Opción 1: Usando npm script (solo backend)
npm run docker:logs

# Opción 2: Ver logs del backend
docker-compose logs -f backend

# Opción 3: Ver logs de postgres
docker-compose logs -f postgres

# Opción 4: Ver logs de todos los servicios
docker-compose logs -f
```

### Ver últimas N líneas de logs

```bash
# Ver últimas 100 líneas del backend
docker-compose logs --tail=100 backend

# Ver últimas 50 líneas de postgres
docker-compose logs --tail=50 postgres
```

### Ver logs sin seguir (snapshot)

```bash
# Ver logs del backend sin seguir
docker-compose logs backend

# Ver logs de todos los servicios
docker-compose logs
```

## 🔧 Ejecutar Scripts dentro del Contenedor

### Método 1: Ejecutar comando directamente

```bash
# Ejecutar migraciones
docker-compose exec backend npm run migrate

# Ejecutar seed completo
docker-compose exec backend npm run seed:complete

# Ejecutar seed básico
docker-compose exec backend npm run seed

# Sincronizar modelos
docker-compose exec backend npm run sync

# Reset completo (sync + seed)
docker-compose exec backend npm run reset

# Generar clave de encriptación
docker-compose exec backend npm run generate:key

# Descargar modelos de face-api
docker-compose exec backend npm run download:models

# Ejecutar tests
docker-compose exec backend npm run test
```

### Método 2: Entrar al contenedor y ejecutar comandos

```bash
# Entrar al contenedor del backend
docker-compose exec backend bash

# Una vez dentro, puedes ejecutar cualquier comando:
npm run migrate
npm run seed:complete
npm run test
exit  # Para salir del contenedor
```

### Método 3: Ejecutar comando en contenedor detenido

```bash
# Si el contenedor está detenido, usa 'run' en lugar de 'exec'
docker-compose run backend npm run migrate
```

## 🗄️ Gestión de Base de Datos

### Conectarse a PostgreSQL

```bash
# Opción 1: Desde el contenedor de postgres
docker-compose exec postgres psql -U residencias_user -d residencias_db

# Opción 2: Desde tu máquina (si tienes psql instalado)
psql -h localhost -p 5432 -U residencias_user -d residencias_db
```

### Comandos útiles de PostgreSQL

```sql
-- Ver todas las tablas
\dt

-- Describir una tabla
\d users

-- Ver datos de una tabla
SELECT * FROM users LIMIT 10;

-- Salir de psql
\q
```

### Backup y Restore

```bash
# Crear backup
docker-compose exec postgres pg_dump -U residencias_user residencias_db > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U residencias_user -d residencias_db < backup.sql
```

## 📊 Monitoreo y Estado

### Ver estado de los contenedores

```bash
# Ver contenedores corriendo
docker ps

# Ver todos los contenedores (incluso detenidos)
docker ps -a

# Ver estado de los servicios de docker-compose
docker-compose ps
```

### Ver uso de recursos

```bash
# Ver uso de CPU, memoria, red
docker stats

# Ver solo el backend
docker stats residencias-backend
```

### Inspeccionar contenedor

```bash
# Ver configuración completa del contenedor
docker inspect residencias-backend

# Ver solo la IP del contenedor
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' residencias-backend
```

## 🧹 Limpieza

### Limpiar contenedores y volúmenes

```bash
# Detener y eliminar contenedores (mantiene volúmenes)
docker-compose down

# Detener y eliminar contenedores + volúmenes (CUIDADO: borra la BD)
npm run docker:clean
# o
docker-compose down -v

# Eliminar imágenes no usadas
docker image prune -a

# Limpieza completa del sistema Docker
docker system prune -a --volumes
```

### Reconstruir desde cero

```bash
# 1. Detener y limpiar todo
docker-compose down -v

# 2. Eliminar la imagen del backend
docker rmi backend-residencias-backend

# 3. Reconstruir y levantar
docker-compose up -d --build
```

## 🐛 Troubleshooting

### El backend no inicia

```bash
# Ver logs detallados
docker-compose logs backend

# Verificar que postgres esté healthy
docker-compose ps

# Reiniciar el backend
docker-compose restart backend
```

### Error de conexión a la base de datos

```bash
# Verificar que postgres esté corriendo
docker-compose ps postgres

# Ver logs de postgres
docker-compose logs postgres

# Reiniciar postgres
docker-compose restart postgres
```

### Cambios en el código no se reflejan

```bash
# Si estás en modo DESARROLLO:
# Los cambios deberían ser automáticos. Si no:
docker-compose -f docker-compose.dev.yml restart backend

# Si estás en modo PRODUCCIÓN:
# Necesitas reconstruir la imagen
docker-compose up -d --build

# O forzar recreación
docker-compose up -d --force-recreate
```

### Puerto ya en uso

```bash
# Ver qué está usando el puerto 5000
netstat -ano | Select-String ":5000"

# Cambiar el puerto en .env
# PORT=5001

# O detener el proceso que usa el puerto
Stop-Process -Id <PID> -Force
```

## 📁 Estructura de Volúmenes

Los siguientes directorios se sincronizan entre tu máquina y el contenedor:

```
./storage  ↔  /app/storage   (Documentos KYC)
./logs     ↔  /app/logs      (Logs de auditoría)
./models   ↔  /app/models    (Modelos de face-api)
```

Puedes acceder a estos archivos directamente desde tu máquina.

## 🔄 Workflow Completo de Desarrollo

### Modo DESARROLLO (Recomendado)

```bash
# 1. Iniciar servicios en modo desarrollo
npm run docker:dev

# 2. Ver logs (en otra terminal si iniciaste en background)
npm run docker:dev:logs

# 3. Ejecutar migraciones (primera vez)
docker-compose -f docker-compose.dev.yml exec backend npm run migrate

# 4. Ejecutar seeds (primera vez)
docker-compose -f docker-compose.dev.yml exec backend npm run seed:complete

# 5. Verificar que el backend responde
curl http://localhost:3001/api/health

# 6. Hacer cambios en el código...
# ✨ Los cambios se reflejan automáticamente!

# 7. Al terminar, detener servicios
npm run docker:dev:down
```

### Modo PRODUCCIÓN

```bash
# 1. Iniciar servicios
npm run docker:up

# 2. Ver logs para verificar que todo está bien
npm run docker:logs

# 3. Ejecutar migraciones (primera vez)
docker-compose exec backend npm run migrate

# 4. Ejecutar seeds (primera vez)
docker-compose exec backend npm run seed:complete

# 5. Verificar que el backend responde
curl http://localhost:3001/api/health

# 6. Hacer cambios en el código...

# 7. Reconstruir (NECESARIO en producción)
docker-compose up -d --build

# 8. Ver logs de nuevo
npm run docker:logs

# 9. Al terminar, detener servicios
npm run docker:down
```

## 🌐 URLs Importantes

- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432
- Health Check: http://localhost:5000/health

## 📝 Variables de Entorno

Las variables se cargan desde `.env`. Para cambiar configuración:

1. Edita `.env`
2. Reinicia los servicios: `docker-compose restart backend`

## 🆘 Comandos de Emergencia

```bash
# Detener todo inmediatamente
docker-compose kill

# Eliminar todo y empezar de cero
docker-compose down -v
docker system prune -a --volumes
npm run docker:up

# Ver logs de error del último contenedor que falló
docker logs $(docker ps -lq)
```

## 💡 Tips

1. **Para desarrollo diario**: Usa `npm run docker:dev` (hot-reload automático)
2. **Para testing de producción**: Usa `npm run docker:up`
3. **No uses `docker-compose down -v`** a menos que quieras borrar la base de datos
4. **Cambios en package.json**: Requieren rebuild incluso en modo desarrollo
5. **Cambios en .env**: Solo requieren restart, no rebuild
6. **Para desarrollo rápido sin Docker**: Usa `npm run dev` (pero sin face recognition)

## 📚 Documentación Adicional

- [DOCKER-DEV.md](./DOCKER-DEV.md) - Guía completa del modo desarrollo
- [COMANDOS-DOCKER.md](./COMANDOS-DOCKER.md) - Referencia rápida de comandos
- [QUICK-START-DEV.md](./QUICK-START-DEV.md) - Inicio rápido para desarrollo
