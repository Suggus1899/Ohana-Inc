# 🎯 EMPIEZA AQUÍ - Hot-Reload Setup

## 🚀 Inicio en 30 Segundos

```bash
npm run docker:dev
```

⚠️ **¿Primera vez?** Lee [PRIMERA-VEZ.md](./PRIMERA-VEZ.md) para ejecutar migraciones.

✨ **¡Eso es todo!** Ahora tienes hot-reload automático.

---

## 🎓 ¿Primera vez con este proyecto?

### 1️⃣ Lee esto primero
👉 [QUICK-START-DEV.md](./QUICK-START-DEV.md) (2 minutos)

### 2️⃣ Inicia el proyecto
```bash
npm run docker:dev
```

### 3️⃣ Verifica que funciona
👉 [VERIFICACION.md](./VERIFICACION.md) (5 minutos)

### 4️⃣ Empieza a codear
Edita archivos en `src/` y los cambios se reflejan automáticamente ⚡

---

## 📚 Documentación por Nivel

### 🟢 Principiante
1. [QUICK-START-DEV.md](./QUICK-START-DEV.md) - Inicio rápido
2. [README-DOCKER.md](./README-DOCKER.md) - Conceptos básicos
3. [VERIFICACION.md](./VERIFICACION.md) - Verificar setup

### 🟡 Intermedio
1. [DOCKER-DEV.md](./DOCKER-DEV.md) - Guía completa desarrollo
2. [COMANDOS-DOCKER.md](./COMANDOS-DOCKER.md) - Comandos útiles
3. [DOCKER-WORKFLOW.md](./DOCKER-WORKFLOW.md) - Flujos visuales

### 🔴 Avanzado
1. [GUIA-DOCKER.md](./GUIA-DOCKER.md) - Referencia completa
2. [HOT-RELOAD-SETUP.md](./HOT-RELOAD-SETUP.md) - Detalles técnicos
3. Archivos de configuración (`docker-compose.dev.yml`, etc.)

---

## 🪟 ¿Usas Windows?

👉 [INSTRUCCIONES-WINDOWS.md](./INSTRUCCIONES-WINDOWS.md)

Incluye:
- Configuración específica de Windows
- Solución de problemas comunes
- Tips para Docker Desktop

---

## 🔍 ¿Buscas algo específico?

### Comandos
👉 [COMANDOS-DOCKER.md](./COMANDOS-DOCKER.md)

### Troubleshooting
👉 [GUIA-DOCKER.md](./GUIA-DOCKER.md#troubleshooting)

### Flujos y Diagramas
👉 [DOCKER-WORKFLOW.md](./DOCKER-WORKFLOW.md)

### Índice Completo
👉 [DOCKER-INDEX.md](./DOCKER-INDEX.md)

---

## ❓ Preguntas Frecuentes

### ¿Qué es hot-reload?
Los cambios en tu código se reflejan automáticamente sin necesidad de reconstruir Docker.

### ¿Cuándo usar modo desarrollo vs producción?
- **Desarrollo** (`docker:dev`): Desarrollo diario, hot-reload
- **Producción** (`docker:up`): Testing final, deploy

### ¿Los cambios no se reflejan?
Verifica que estás en modo desarrollo:
```bash
docker ps
# Debe mostrar: residencias-backend-dev
```

### ¿Cambié package.json?
Necesitas rebuild:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

---

## 🎯 Flujo de Trabajo Típico

```
1. Inicio del día
   npm run docker:dev

2. Desarrollo
   Editar src/ → Guardar → ✨ Cambios automáticos

3. Fin del día
   Ctrl+C
```

---

## 🆘 Ayuda Rápida

```bash
# Ver logs
npm run docker:dev:logs

# Reiniciar
docker-compose -f docker-compose.dev.yml restart backend

# Limpiar todo
npm run docker:dev:clean
npm run docker:dev
```

---

## 📊 Comparación Rápida

| Característica | Desarrollo | Producción |
|----------------|------------|------------|
| Comando | `docker:dev` | `docker:up` |
| Hot-reload | ✅ Sí | ❌ No |
| Velocidad | ⚡ 4s | 🐌 64s |
| Uso | Diario | Testing/Deploy |

---

## 🎉 ¡Listo para Empezar!

```bash
npm run docker:dev
```

Abre tu editor, edita `src/`, guarda, y disfruta del hot-reload ⚡

---

## 📞 ¿Necesitas más ayuda?

1. [DOCKER-INDEX.md](./DOCKER-INDEX.md) - Índice completo
2. [VERIFICACION.md](./VERIFICACION.md) - Checklist
3. [GUIA-DOCKER.md](./GUIA-DOCKER.md) - Guía detallada

---

**Happy coding!** 🚀
