# 🐳 Docker Setup - Backend Residencias

## 🎯 Inicio Rápido

### Para Desarrollo (Hot-Reload)
```bash
npm run docker:dev
```
✨ Cambios automáticos sin rebuild

### Para Producción
```bash
npm run docker:up
```
⚠️ Requiere rebuild al cambiar código

---

## 📊 Comparación de Modos

| Característica | Desarrollo | Producción |
|----------------|------------|------------|
| Hot-reload | ✅ Sí | ❌ No |
| Rebuild necesario | ❌ No | ✅ Sí |
| Velocidad de cambios | ⚡ Instantáneo | 🐌 Lento (rebuild) |
| Tamaño de imagen | 📦 Grande | 📦 Pequeña |
| Optimización | ❌ No | ✅ Sí |
| Uso recomendado | Desarrollo diario | Testing/Deploy |

---

## 🚀 Comandos Esenciales

### Desarrollo
```bash
# Iniciar
npm run docker:dev

# Ver logs
npm run docker:dev:logs

# Detener
npm run docker:dev:down
```

### Producción
```bash
# Iniciar
npm run docker:up

# Ver logs
npm run docker:logs

# Detener
npm run docker:down
```

---

## 📁 Archivos de Configuración

```
backend-residencias/
├── docker-compose.yml          # Configuración PRODUCCIÓN
├── docker-compose.dev.yml      # Configuración DESARROLLO
├── Dockerfile                  # Build PRODUCCIÓN
├── Dockerfile.dev              # Build DESARROLLO
├── docker-start.bat            # Script inicio PRODUCCIÓN
└── docker-start-dev.bat        # Script inicio DESARROLLO
```

---

## 🔄 Flujo de Trabajo Típico

### Día a día (Desarrollo)
1. `npm run docker:dev` → Inicia todo
2. Edita código en `src/`
3. Guarda archivo
4. ✨ Cambios automáticos
5. `npm run docker:dev:down` → Detiene todo

### Testing de Producción
1. `npm run docker:up` → Inicia en modo producción
2. Prueba la aplicación
3. Si hay cambios: `npm run docker:up` (rebuild)
4. `npm run docker:down` → Detiene todo

---

## 🌐 URLs

- API: http://localhost:3001/api
- Health: http://localhost:3001/api/health
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

## 📚 Documentación Completa

- [QUICK-START-DEV.md](./QUICK-START-DEV.md) - Inicio rápido
- [DOCKER-DEV.md](./DOCKER-DEV.md) - Guía completa desarrollo
- [COMANDOS-DOCKER.md](./COMANDOS-DOCKER.md) - Referencia comandos
- [GUIA-DOCKER.md](./GUIA-DOCKER.md) - Guía detallada completa

---

## ❓ FAQ

### ¿Cuándo usar cada modo?

- **Desarrollo**: Cuando estás escribiendo código
- **Producción**: Para testing final o deploy

### ¿Los cambios no se reflejan?

- **En desarrollo**: `docker-compose -f docker-compose.dev.yml restart backend`
- **En producción**: `npm run docker:up` (rebuild completo)

### ¿Cambié package.json?

Ambos modos requieren rebuild:
```bash
# Desarrollo
docker-compose -f docker-compose.dev.yml up --build

# Producción
npm run docker:up
```

### ¿Cambié .env?

Solo necesitas restart:
```bash
# Desarrollo
docker-compose -f docker-compose.dev.yml restart backend

# Producción
docker-compose restart backend
```

---

## 🆘 Ayuda Rápida

```bash
# Ver contenedores corriendo
docker ps

# Ver logs de un servicio
docker logs residencias-backend-dev -f

# Entrar al contenedor
docker exec -it residencias-backend-dev bash

# Limpiar todo
npm run docker:dev:clean
```

---

## 💡 Tip Pro

Para máxima productividad en desarrollo:

1. Abre 2 terminales
2. Terminal 1: `npm run docker:dev` (logs en vivo)
3. Terminal 2: Edita código
4. Disfruta del hot-reload ✨
