# ✅ Checklist de Verificación - Hot-Reload

## 🎯 Verificar que Hot-Reload Funciona

Sigue estos pasos para confirmar que el hot-reload está funcionando correctamente.

---

## 📋 Pre-requisitos

### 1. Docker Desktop
```bash
docker --version
```
✅ Debe mostrar: `Docker version 20.x.x` o superior

### 2. Docker Compose
```bash
docker-compose --version
```
✅ Debe mostrar: `docker-compose version 1.x.x` o superior

### 3. Archivos Creados
- [ ] `docker-compose.dev.yml` existe
- [ ] `Dockerfile.dev` existe
- [ ] `docker-start-dev.bat` existe
- [ ] `.env` configurado

---

## 🚀 Prueba de Hot-Reload

### Paso 1: Iniciar Modo Desarrollo

```bash
npm run docker:dev
```

**Espera ver:**
```
✅ Postgres healthy
✅ Redis healthy
✅ Backend starting...
[nodemon] starting `ts-node src/index.ts`
✅ Server running on port 5000
```

⏱️ Tiempo esperado: 2-3 minutos (primera vez)

---

### Paso 2: Verificar Servidor

En otra terminal:
```bash
curl http://localhost:3001/api/health
```

**Debe responder:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-09T..."
}
```

✅ Si responde → Servidor funcionando

---

### Paso 3: Hacer un Cambio de Prueba

1. Abre `src/app.ts`

2. Busca la ruta de health (o cualquier ruta)

3. Agrega un console.log:
```typescript
app.get('/api/health', (req, res) => {
  console.log('🔥 HOT-RELOAD FUNCIONA!'); // ← Agregar esta línea
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});
```

4. Guarda el archivo (Ctrl+S)

---

### Paso 4: Verificar Hot-Reload

**En la terminal donde corre docker:dev, debes ver:**
```
[nodemon] restarting due to changes...
[nodemon] starting `ts-node src/index.ts`
✅ Server running on port 5000
```

⏱️ Tiempo esperado: 2-5 segundos

✅ Si ves esto → Hot-reload funcionando!

---

### Paso 5: Probar el Cambio

```bash
curl http://localhost:3001/api/health
```

**En los logs debes ver:**
```
🔥 HOT-RELOAD FUNCIONA!
```

✅ Si aparece → ¡Todo funciona perfectamente!

---

### Paso 6: Limpiar

1. Revierte el cambio en `src/app.ts`
2. Guarda
3. Verifica que se reinicia automáticamente

---

## 🎉 Resultado Esperado

Si completaste todos los pasos:

- ✅ Servidor inicia correctamente
- ✅ Responde a peticiones HTTP
- ✅ Detecta cambios en archivos
- ✅ Se reinicia automáticamente
- ✅ Cambios visibles en segundos

**¡Hot-reload configurado exitosamente!** 🎉

---

## ❌ Troubleshooting

### No veo "[nodemon] restarting"

**Problema:** Hot-reload no está activo

**Solución:**
```bash
# Verifica que estás usando docker-compose.dev.yml
docker ps

# Debe mostrar: residencias-backend-dev
# Si muestra: residencias-backend (sin -dev)
# Estás en modo producción

# Detén y reinicia en modo dev
npm run docker:down
npm run docker:dev
```

---

### Cambios no se reflejan

**Problema:** Volumen no montado correctamente

**Verificación:**
```bash
# Entra al contenedor
docker exec -it residencias-backend-dev bash

# Verifica que src/ existe
ls -la /app/src

# Verifica que es un volumen
mount | grep /app/src

# Sal del contenedor
exit
```

**Solución:**
```bash
# Rebuild forzado
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

---

### Error "Cannot find module"

**Problema:** node_modules no instalados

**Solución:**
```bash
# Rebuild la imagen
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up
```

---

### Puerto 3001 ocupado

**Problema:** Otro contenedor usando el puerto

**Solución:**
```bash
# Ver qué usa el puerto
docker ps

# Detener contenedor de producción
npm run docker:down

# O cambiar puerto en docker-compose.dev.yml
# ports:
#   - "3002:5000"  # Cambiar 3001 a 3002
```

---

### Servidor no inicia

**Problema:** Error en el código o configuración

**Verificación:**
```bash
# Ver logs completos
npm run docker:dev:logs

# O
docker logs residencias-backend-dev
```

**Busca errores como:**
- `Cannot connect to database` → Verifica .env
- `Port already in use` → Cambia puerto
- `Module not found` → Rebuild imagen

---

## 🔍 Verificación Avanzada

### Verificar Volúmenes Montados

```bash
docker inspect residencias-backend-dev | grep -A 10 Mounts
```

**Debe mostrar:**
```json
"Mounts": [
  {
    "Type": "bind",
    "Source": "/ruta/a/tu/proyecto/src",
    "Destination": "/app/src",
    ...
  }
]
```

---

### Verificar Comando de Inicio

```bash
docker inspect residencias-backend-dev | grep -A 5 Cmd
```

**Debe mostrar:**
```json
"Cmd": [
  "npm",
  "run",
  "dev"
]
```

---

### Verificar Variables de Entorno

```bash
docker exec residencias-backend-dev env | grep NODE_ENV
```

**Debe mostrar:**
```
NODE_ENV=development
```

---

## 📊 Métricas de Éxito

### Tiempo de Feedback

Mide el tiempo desde que guardas hasta que ves el cambio:

```
Editar archivo → Guardar → Ver logs reiniciando → Probar cambio
     1s            1s            2-3s                1s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 5-6 segundos ⚡
```

✅ Si es < 10 segundos → Excelente
⚠️ Si es > 30 segundos → Revisar configuración
❌ Si es > 60 segundos → Probablemente estás en modo producción

---

## 🎯 Checklist Final

Marca cada item cuando lo verifiques:

### Configuración
- [ ] Docker Desktop corriendo
- [ ] `docker-compose.dev.yml` existe
- [ ] `Dockerfile.dev` existe
- [ ] `.env` configurado
- [ ] Puerto 3001 libre

### Funcionamiento
- [ ] `npm run docker:dev` inicia sin errores
- [ ] Servidor responde en http://localhost:3001/api/health
- [ ] Logs muestran `[nodemon]` messages
- [ ] Cambios en código se detectan
- [ ] Servidor se reinicia automáticamente
- [ ] Cambios visibles en < 10 segundos

### Servicios
- [ ] PostgreSQL conectado
- [ ] Redis conectado
- [ ] Backend responde
- [ ] Logs visibles

---

## 🎉 ¡Todo Listo!

Si marcaste todos los items:

✅ Hot-reload configurado correctamente
✅ Listo para desarrollo productivo
✅ Puedes empezar a codear

---

## 📚 Próximos Pasos

1. Lee [DOCKER-WORKFLOW.md](./DOCKER-WORKFLOW.md) para entender el flujo
2. Consulta [COMANDOS-DOCKER.md](./COMANDOS-DOCKER.md) para comandos útiles
3. Revisa [DOCKER-DEV.md](./DOCKER-DEV.md) para detalles avanzados

---

## 🆘 ¿Aún tienes problemas?

1. Revisa [GUIA-DOCKER.md](./GUIA-DOCKER.md) - Sección Troubleshooting
2. Verifica logs: `npm run docker:dev:logs`
3. Limpia todo y reinicia:
   ```bash
   npm run docker:dev:clean
   npm run docker:dev
   ```

---

## 📝 Notas

- Primera vez puede tardar más (descarga imágenes)
- Cambios en `package.json` requieren rebuild
- Cambios en `.env` solo requieren restart
- `node_modules` NO se sincronizan (están en el contenedor)
