# 📚 Índice de Documentación Docker

## 🎯 ¿Por dónde empezar?

### Si eres nuevo
1. 👉 [QUICK-START-DEV.md](./QUICK-START-DEV.md) - Empieza aquí
2. 📖 [README-DOCKER.md](./README-DOCKER.md) - Resumen general

### Si usas Windows
👉 [INSTRUCCIONES-WINDOWS.md](./INSTRUCCIONES-WINDOWS.md) - Guía específica para Windows

### Si necesitas comandos rápidos
👉 [COMANDOS-DOCKER.md](./COMANDOS-DOCKER.md) - Referencia rápida

---

## 📖 Documentación Completa

### Guías Principales

| Archivo | Descripción | Para quién |
|---------|-------------|------------|
| [QUICK-START-DEV.md](./QUICK-START-DEV.md) | Inicio rápido en 30 segundos | Todos |
| [README-DOCKER.md](./README-DOCKER.md) | Resumen y comparación de modos | Todos |
| [DOCKER-DEV.md](./DOCKER-DEV.md) | Guía completa modo desarrollo | Desarrolladores |
| [GUIA-DOCKER.md](./GUIA-DOCKER.md) | Guía detallada completa | Referencia avanzada |
| [COMANDOS-DOCKER.md](./COMANDOS-DOCKER.md) | Referencia de comandos | Consulta rápida |
| [INSTRUCCIONES-WINDOWS.md](./INSTRUCCIONES-WINDOWS.md) | Guía específica Windows | Usuarios Windows |
| [DOCKER-WORKFLOW.md](./DOCKER-WORKFLOW.md) | Diagramas y flujos visuales | Visual learners |
| [VERIFICACION.md](./VERIFICACION.md) | Checklist de verificación | Testing setup |

### Archivos Técnicos

| Archivo | Descripción |
|---------|-------------|
| `docker-compose.yml` | Configuración producción |
| `docker-compose.dev.yml` | Configuración desarrollo |
| `Dockerfile` | Build producción |
| `Dockerfile.dev` | Build desarrollo |
| `docker-entrypoint.sh` | Script de inicio |

### Scripts de Inicio

| Archivo | Descripción | Uso |
|---------|-------------|-----|
| `docker-start.bat` | Inicia modo producción (Windows) | Doble clic |
| `docker-start.sh` | Inicia modo producción (Linux/Mac) | `./docker-start.sh` |
| `docker-start-dev.bat` | Inicia modo desarrollo (Windows) | Doble clic |
| `docker-start-dev.sh` | Inicia modo desarrollo (Linux/Mac) | `./docker-start-dev.sh` |

---

## 🎓 Rutas de Aprendizaje

### Ruta 1: Principiante
1. [QUICK-START-DEV.md](./QUICK-START-DEV.md) - Inicio rápido
2. [README-DOCKER.md](./README-DOCKER.md) - Conceptos básicos
3. [INSTRUCCIONES-WINDOWS.md](./INSTRUCCIONES-WINDOWS.md) - Si usas Windows
4. Practica: Inicia el proyecto y haz cambios

### Ruta 2: Desarrollador
1. [README-DOCKER.md](./README-DOCKER.md) - Resumen
2. [DOCKER-DEV.md](./DOCKER-DEV.md) - Modo desarrollo
3. [COMANDOS-DOCKER.md](./COMANDOS-DOCKER.md) - Comandos útiles
4. [GUIA-DOCKER.md](./GUIA-DOCKER.md) - Referencia completa

### Ruta 3: DevOps/Avanzado
1. [GUIA-DOCKER.md](./GUIA-DOCKER.md) - Guía completa
2. Revisa `docker-compose.yml` y `Dockerfile`
3. Revisa `docker-compose.dev.yml` y `Dockerfile.dev`
4. Personaliza según necesidades

---

## 🔍 Buscar por Tema

### Hot-Reload / Desarrollo
- [QUICK-START-DEV.md](./QUICK-START-DEV.md)
- [DOCKER-DEV.md](./DOCKER-DEV.md)
- [README-DOCKER.md](./README-DOCKER.md) - Sección "Desarrollo"

### Comandos
- [COMANDOS-DOCKER.md](./COMANDOS-DOCKER.md) - Todos los comandos
- [GUIA-DOCKER.md](./GUIA-DOCKER.md) - Comandos con explicación

### Producción
- [README-DOCKER.md](./README-DOCKER.md) - Sección "Producción"
- [GUIA-DOCKER.md](./GUIA-DOCKER.md) - Workflow producción
- `docker-compose.yml` - Configuración

### Troubleshooting
- [INSTRUCCIONES-WINDOWS.md](./INSTRUCCIONES-WINDOWS.md) - Problemas Windows
- [GUIA-DOCKER.md](./GUIA-DOCKER.md) - Sección "Troubleshooting"
- [DOCKER-DEV.md](./DOCKER-DEV.md) - Sección "Troubleshooting"

### Windows
- [INSTRUCCIONES-WINDOWS.md](./INSTRUCCIONES-WINDOWS.md) - Guía completa Windows
- [QUICK-START-DEV.md](./QUICK-START-DEV.md) - Inicio rápido

---

## 📋 Checklist de Configuración

### Primera Vez
- [ ] Docker Desktop instalado
- [ ] WSL 2 instalado (Windows)
- [ ] Proyecto clonado
- [ ] Archivo `.env` configurado
- [ ] Ejecutado `npm install` (opcional)
- [ ] Probado `npm run docker:dev`

### Verificación
- [ ] Docker Desktop corriendo
- [ ] Puerto 3001 libre
- [ ] Puerto 5432 libre (PostgreSQL)
- [ ] Puerto 6379 libre (Redis)
- [ ] Contenedores iniciados correctamente
- [ ] API responde en http://localhost:3001/api/health

---

## 🎯 Casos de Uso Comunes

### "Quiero empezar a desarrollar YA"
👉 [QUICK-START-DEV.md](./QUICK-START-DEV.md)

### "¿Cómo funciona el hot-reload?"
👉 [DOCKER-DEV.md](./DOCKER-DEV.md)

### "Necesito un comando específico"
👉 [COMANDOS-DOCKER.md](./COMANDOS-DOCKER.md)

### "Tengo un error en Windows"
👉 [INSTRUCCIONES-WINDOWS.md](./INSTRUCCIONES-WINDOWS.md)

### "¿Cuál es la diferencia entre dev y prod?"
👉 [README-DOCKER.md](./README-DOCKER.md)

### "Necesito información detallada"
👉 [GUIA-DOCKER.md](./GUIA-DOCKER.md)

---

## 🆘 Ayuda Rápida

```bash
# Desarrollo
npm run docker:dev          # Iniciar
npm run docker:dev:logs     # Ver logs
npm run docker:dev:down     # Detener

# Producción
npm run docker:up           # Iniciar
npm run docker:logs         # Ver logs
npm run docker:down         # Detener

# Emergencia
docker ps                   # Ver contenedores
docker logs <container>     # Ver logs
docker-compose kill         # Detener todo
```

---

## 📞 Soporte

1. Revisa la documentación relevante arriba
2. Busca en la sección de Troubleshooting
3. Verifica los logs: `npm run docker:dev:logs`
4. Consulta la documentación oficial de Docker

---

## 🔄 Actualizaciones

Este índice se actualiza cuando se agregan nuevos archivos de documentación.

Última actualización: 2026-04-09
