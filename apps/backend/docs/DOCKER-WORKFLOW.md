# 🔄 Docker Workflow - Diagrama Visual

## 🎯 Flujo de Desarrollo vs Producción

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODO DESARROLLO                              │
│                   (Hot-Reload Activo)                           │
└─────────────────────────────────────────────────────────────────┘

1. Inicio
   ┌──────────────────┐
   │ npm run docker:dev│
   └────────┬──────────┘
            │
            ▼
   ┌──────────────────────────────────┐
   │ Docker monta src/ como volumen  │
   │ ts-node-dev inicia con --watch  │
   └────────┬─────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────┐
   │ Servidor corriendo en :3001     │
   │ Logs en tiempo real             │
   └────────┬─────────────────────────┘
            │
            ▼

2. Desarrollo
   ┌──────────────────────────────────┐
   │ Editas archivo en src/          │
   │ Guardas (Ctrl+S)                │
   └────────┬─────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────┐
   │ ts-node-dev detecta cambio      │
   │ Reinicia automáticamente        │
   └────────┬─────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────┐
   │ ✨ Cambios visibles en segundos │
   │ Sin rebuild necesario           │
   └──────────────────────────────────┘

3. Fin
   ┌──────────────────────────────────┐
   │ Ctrl+C o npm run docker:dev:down│
   └──────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    MODO PRODUCCIÓN                              │
│                  (Código Compilado)                             │
└─────────────────────────────────────────────────────────────────┘

1. Inicio
   ┌──────────────────┐
   │ npm run docker:up│
   └────────┬──────────┘
            │
            ▼
   ┌──────────────────────────────────┐
   │ Docker compila TypeScript       │
   │ Crea imagen optimizada          │
   └────────┬─────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────┐
   │ Ejecuta dist/index.js           │
   │ Código compilado (rápido)       │
   └────────┬─────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────┐
   │ Servidor corriendo en :3001     │
   └──────────────────────────────────┘

2. Cambio en código
   ┌──────────────────────────────────┐
   │ Editas archivo en src/          │
   │ Guardas (Ctrl+S)                │
   └────────┬─────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────┐
   │ ❌ Cambios NO se reflejan       │
   │ Código está compilado           │
   └────────┬─────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────┐
   │ Necesitas rebuild:              │
   │ npm run docker:up               │
   └────────┬─────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────┐
   │ Docker recompila (lento)        │
   │ Reinicia contenedor             │
   └────────┬─────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────┐
   │ ✅ Cambios visibles             │
   │ Después de rebuild completo     │
   └──────────────────────────────────┘

3. Fin
   ┌──────────────────────────────────┐
   │ npm run docker:down             │
   └──────────────────────────────────┘
```

---

## 📊 Comparación Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                    TIEMPO DE FEEDBACK                           │
└─────────────────────────────────────────────────────────────────┘

DESARROLLO (Hot-Reload)
Editar → Guardar → Ver cambios
  1s       1s        2s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ~4 segundos ⚡


PRODUCCIÓN (Rebuild)
Editar → Guardar → Rebuild → Ver cambios
  1s       1s       60s        2s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ~64 segundos 🐌
```

---

## 🔀 Árbol de Decisión

```
                    ¿Qué necesitas hacer?
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌───────────────┐ ┌──────────┐ ┌──────────────┐
    │ Desarrollar   │ │ Testing  │ │ Deploy       │
    │ código        │ │ final    │ │ producción   │
    └───────┬───────┘ └────┬─────┘ └──────┬───────┘
            │              │               │
            ▼              ▼               ▼
    ┌───────────────┐ ┌──────────┐ ┌──────────────┐
    │ docker:dev    │ │docker:up │ │ docker:up    │
    │ (Hot-reload)  │ │(Prod)    │ │ (Prod)       │
    └───────────────┘ └──────────┘ └──────────────┘
```

---

## 🎬 Escenarios Comunes

### Escenario 1: Desarrollo de Nueva Feature

```
Día 1 - Inicio
├─ npm run docker:dev
├─ Crear nueva ruta en src/routes/
├─ Guardar → ✨ Hot-reload
├─ Crear controlador en src/controllers/
├─ Guardar → ✨ Hot-reload
├─ Crear servicio en src/services/
├─ Guardar → ✨ Hot-reload
└─ Probar en Postman → ✅ Funciona

Día 2 - Continuar
├─ npm run docker:dev (si lo detuviste)
├─ Agregar validaciones
├─ Guardar → ✨ Hot-reload
├─ Agregar tests
├─ npm run test
└─ ✅ Feature completa

Total de rebuilds: 0 🎉
```

### Escenario 2: Testing Pre-Deploy

```
Testing Final
├─ npm run docker:down (detener dev)
├─ npm run docker:up (iniciar prod)
├─ Probar todas las features
├─ Encontrar bug
├─ Editar código
├─ npm run docker:up (rebuild)
├─ Probar de nuevo
└─ ✅ Listo para deploy

Total de rebuilds: 1-2 (solo para testing)
```

### Escenario 3: Cambio en package.json

```
Agregar Nueva Dependencia
├─ npm install nueva-libreria
├─ Editar package.json
├─ docker-compose -f docker-compose.dev.yml up --build
├─ Usar nueva librería en código
├─ Guardar → ✨ Hot-reload (funciona de nuevo)
└─ ✅ Dependencia lista

Total de rebuilds: 1 (solo por package.json)
```

---

## 📈 Productividad

```
┌─────────────────────────────────────────────────────────────────┐
│              CAMBIOS POR DÍA vs TIEMPO PERDIDO                  │
└─────────────────────────────────────────────────────────────────┘

Asumiendo 50 cambios por día:

CON HOT-RELOAD (Desarrollo)
50 cambios × 4 segundos = 200 segundos = 3.3 minutos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tiempo productivo: 7h 56m ⚡


SIN HOT-RELOAD (Producción)
50 cambios × 64 segundos = 3,200 segundos = 53 minutos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tiempo productivo: 7h 7m 🐌


AHORRO: 50 minutos por día! 🎉
```

---

## 🔧 Arquitectura Técnica

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODO DESARROLLO                              │
└─────────────────────────────────────────────────────────────────┘

Tu Máquina                    Contenedor Docker
┌──────────────┐             ┌──────────────────┐
│              │             │                  │
│  src/        │◄───────────►│  /app/src/       │
│  (editando)  │  Volumen    │  (montado)       │
│              │  montado    │                  │
└──────────────┘             └────────┬─────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │  ts-node-dev     │
                             │  --watch         │
                             │  (detecta        │
                             │   cambios)       │
                             └────────┬─────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │  Reinicia        │
                             │  automático      │
                             └────────┬─────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │  Servidor        │
                             │  actualizado     │
                             └──────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    MODO PRODUCCIÓN                              │
└─────────────────────────────────────────────────────────────────┘

Tu Máquina                    Contenedor Docker
┌──────────────┐             ┌──────────────────┐
│              │             │                  │
│  src/        │    NO       │  dist/           │
│  (editando)  │  conectado  │  (compilado)     │
│              │             │                  │
└──────────────┘             └────────┬─────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │  node            │
                             │  dist/index.js   │
                             │  (estático)      │
                             └────────┬─────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │  Servidor        │
                             │  (sin cambios)   │
                             └──────────────────┘

Para ver cambios: Rebuild completo necesario
```

---

## 💡 Tips Visuales

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEÑALES VISUALES                             │
└─────────────────────────────────────────────────────────────────┘

✅ Hot-reload funcionando:
   [nodemon] restarting due to changes...
   [nodemon] starting `ts-node src/index.ts`
   ✅ Server running on port 5000

❌ Modo producción (sin hot-reload):
   > node dist/index.js
   ✅ Server running on port 5000
   (Sin mensajes de "restarting")

⚠️ Necesitas rebuild:
   Editaste código pero no ves cambios
   → Estás en modo producción
   → Ejecuta: npm run docker:up

🔄 Rebuild en progreso:
   Building backend...
   Step 1/15 : FROM node:20-bullseye
   ...
   (Tarda ~60 segundos)
```

---

## 🎯 Resumen Ejecutivo

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUÁNDO USAR CADA MODO                        │
└─────────────────────────────────────────────────────────────────┘

DESARROLLO (docker:dev)
✅ Desarrollo diario
✅ Debugging
✅ Experimentación rápida
✅ Iteración rápida
❌ Testing de producción
❌ Deploy

PRODUCCIÓN (docker:up)
❌ Desarrollo diario
✅ Testing de producción
✅ Verificación final
✅ Deploy
✅ Performance testing
❌ Iteración rápida
```

---

## 📚 Referencias

- [QUICK-START-DEV.md](./QUICK-START-DEV.md) - Inicio rápido
- [DOCKER-DEV.md](./DOCKER-DEV.md) - Guía completa desarrollo
- [README-DOCKER.md](./README-DOCKER.md) - Resumen general
- [COMANDOS-DOCKER.md](./COMANDOS-DOCKER.md) - Referencia comandos
