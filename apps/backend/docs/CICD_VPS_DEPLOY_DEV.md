## Problema original

El equipo de desarrollo necesitaba probar cambios en el backend en un entorno real (VPS) **sin interferir entre ramas** y **sin hacer merge a `main`** constantemente. Además, al levantar contenedores manualmente surgían errores de dependencias nativas (TensorFlow) y falta de tablas en la base de datos.

---

## Solución implementada

Hemos creado un sistema de **entornos de desarrollo aislados y automatizados** basado en:

- **Docker Compose** con nombres de contenedores, volúmenes y redes dinámicos (sufijo `-${BRANCH_NAME}`).
- **GitHub Actions** para desplegar automáticamente cada rama de desarrollo en el VPS.
- **Puertos dinámicos** (rango `3000-3999`) asignados por hash del nombre de la rama.
- **Aislamiento de datos** mediante directorios `pgdata_*`, `storage_*` y `logs_*` únicos por rama.
- **Inicialización automática de la base de datos** usando los scripts `sync` (creación de tablas desde modelos Sequelize) y `seed:complete` (datos de prueba).

---

## Archivos clave modificados / creados

### 1. `docker-compose.prod.yml` (dinámico)
- Contenedores con nombres como `ohana-backend-${BRANCH_NAME:-dev}`.
- Mapeo de puerto del backend: `"${BACKEND_PORT:-3001}:5000"`.
- Volúmenes bind mount para `pgdata_*`, `storage_*`, `logs_*`.
- Red aislada por proyecto (`-p ohana-${BRANCH_NAME}`).

### 2. `.gitignore`
- Se agregaron exclusiones: `pgdata_*/`, `storage_*/`, `logs_*/`, `.env`.

### 3. `Dockerfile.dev`
- Se agregó la línea `RUN npm rebuild @tensorflow/tfjs-node --build-from-source` después de `npm install`.

### 4. `package.json`
- Se instaló `@tensorflow/tfjs-node` como dependencia.

### 5. Workflows de GitHub Actions

#### `.github/workflows/deploy-dev.yml`
- Se dispara con push a ramas `dev`, `feature/*`, `develop`, `hotfix/*`.
- Calcula `BRANCH_NAME` (limpio) y `BACKEND_PORT` (único).
- Copia archivos al VPS con `rsync`.
- Levanta los contenedores con `docker-compose -p ohana-$BRANCH_NAME up -d --build`.
- Ejecuta **manualmente** (próximamente automatizado) `sync` y `seed:complete` dentro del contenedor.
- Comenta en el PR la URL de acceso.

#### `.github/workflows/cleanup-dev.yml`
- Se dispara al cerrar un PR.
- Elimina el directorio `/root/apps/$BRANCH_NAME` y los contenedores/volúmenes asociados.

### 6. Configuración en el VPS (CyberPanel + AlmaLinux)
- Docker y Docker Compose instalados.
- Firewall (`firewalld`) con puertos `3000-3999/tcp` y `22/tcp` abiertos.
- Directorio base `/root/apps` para despliegues.

### 7. Secrets de GitHub Actions
- `VPS_SSH_PRIVATE_KEY`: llave privada para conexión SSH.
- `DB_PASSWORD`, `JWT_SECRET`, `ENCRYPTION_KEY`: credenciales para el entorno de desarrollo.

---

## Flujo de trabajo diario para un desarrollador

1. **Crear rama**  
   `git checkout -b feature/nueva-funcionalidad`

2. **Desarrollar cambios** y hacer commit + push.

3. **GitHub Actions** se ejecuta automáticamente:
   - Construye la imagen y despliega en el VPS.
   - Asigna un puerto único (ej. `3593`).
   - (Próximo paso automatizado) Ejecuta migraciones/seed.

4. **El bot comenta en el PR** con la URL `http://31.97.171.120:3593`.

5. **Probar el backend** desde el frontend local o Postman usando esa URL.

6. **Iterar**: nuevos pushes a la misma rama actualizan el entorno automáticamente.

7. **Al hacer merge del PR**, el entorno se limpia automáticamente.

---

## Estado actual comprobado

- **El contenedor `ohana-backend-feature-probar-cicd` está corriendo** sin errores.
- **Logs limpios**:
  ```
  Server running on port 5000
  API available at http://localhost:5000/api
  ```
- **Conexiones exitosas** a PostgreSQL y Redis.
- **Tareas programadas** (KYC, transacciones expiradas) inicializadas correctamente.
- **La API responde** desde el exterior a través de `http://31.97.171.120:3593`.

---

## Tareas pendientes (mejoras futuras)

1. **Automatizar `sync` y `seed` en el workflow**  
   Ya tenemos los comandos manuales probados; solo falta integrarlos en `deploy-dev.yml` (opcionalmente con un `docker run` temporal antes de levantar el backend).

2. **Agregar endpoint `/health`**  
   Para facilitar monitoreo y healthchecks de Docker.

3. **Configurar CORS** en el backend para aceptar el origen del frontend desplegado.

4. **Notificaciones a Slack/Discord** (opcional).

---

## Conclusión

Hemos transformado un proceso manual y propenso a errores en un **sistema de despliegue continuo por rama** completamente funcional, que permite a cada desarrollador probar sus cambios en un entorno aislado y real sin afectar a los demás. Esto acelera el desarrollo, reduce conflictos y mejora la calidad del código que llega a `main`.