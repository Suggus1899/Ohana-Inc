# 📋 Comandos Docker - Guía Rápida

## 🔥 DESARROLLO (Hot-Reload)

### Iniciar
```bash
# Opción 1: Script directo
docker-start-dev.bat

# Opción 2: Con npm
npm run docker:dev

# Opción 3: En background
docker-compose -f docker-compose.dev.yml up --build -d
```

### Gestión
```bash
# Ver logs en tiempo real
npm run docker:dev:logs

# Detener servicios
npm run docker:dev:down

# Reiniciar solo el backend (mantiene cambios)
docker-compose -f docker-compose.dev.yml restart backend

# Limpiar todo (incluye base de datos)
npm run docker:dev:clean
```

### ✅ Ventajas
- ✨ Cambios instantáneos sin rebuild
- 🚀 Edita y guarda, listo
- 📝 Logs en tiempo real

---

## 🏭 PRODUCCIÓN

### Iniciar
```bash
# Opción 1: Script directo
docker-start.bat

# Opción 2: Con npm
npm run docker:up
```

### Gestión
```bash
# Ver logs
npm run docker:logs

# Reiniciar backend (NO recarga código)
npm run docker:restart

# Detener servicios
npm run docker:down

# Limpiar todo
npm run docker:clean
```

### ⚠️ Importante
- ❌ `docker:restart` NO recarga cambios de código
- ✅ Para ver cambios: `npm run docker:up` (rebuild completo)

---

## 🎯 ¿Cuándo usar cada uno?

| Situación | Comando |
|-----------|---------|
| Desarrollo diario | `npm run docker:dev` |
| Cambios en código (dev) | Solo guarda el archivo |
| Cambios en package.json | Rebuild: `docker-compose -f docker-compose.dev.yml up --build` |
| Testing de producción | `npm run docker:up` |
| Deploy | `docker-compose.yml` con env vars |

---

## 🔍 Comandos Útiles

```bash
# Ver contenedores corriendo
docker ps

# Entrar al contenedor backend (dev)
docker exec -it residencias-backend-dev bash

# Entrar al contenedor backend (prod)
docker exec -it residencias-backend bash

# Ver logs de PostgreSQL
docker logs residencias-postgres-dev -f

# Ver logs de Redis
docker logs residencias-redis-dev -f

# Limpiar todo Docker (cuidado!)
docker system prune -a --volumes
```

---

## 🐛 Solución de Problemas

### Puerto 3001 ocupado
```bash
# Detén el contenedor de producción
npm run docker:down

# O cambia el puerto en docker-compose.dev.yml
```

### Cambios no se reflejan (dev)
```bash
# Verifica el volumen
docker exec -it residencias-backend-dev ls -la /app/src

# Reinicia
docker-compose -f docker-compose.dev.yml restart backend
```

### Error de base de datos
```bash
# Limpia y reinicia
npm run docker:dev:clean
npm run docker:dev
```

### Rebuild forzado
```bash
# Desarrollo
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up

# Producción
docker-compose build --no-cache
docker-compose up -d
```
