# Docker Setup - Backend Residencias

## Requisitos Previos

- Docker Desktop instalado
- Docker Compose instalado

## Inicio Rápido

### Opción 1: Usando scripts

**Windows:**
```bash
docker-start.bat
```

**Linux/Mac:**
```bash
chmod +x docker-start.sh
./docker-start.sh
```

### Opción 2: Usando npm scripts

```bash
# Iniciar servicios
npm run docker:up

# Ver logs del backend
npm run docker:logs

# Reiniciar backend
npm run docker:restart

# Detener servicios
npm run docker:down

# Limpiar todo (incluye volúmenes)
npm run docker:clean
```

### Opción 3: Comandos Docker directos

```bash
# Construir e iniciar
docker-compose --env-file .env up --build -d

# Ver logs
docker-compose logs -f backend

# Detener
docker-compose down
```

## Servicios

El docker-compose levanta dos servicios:

1. **postgres** - Base de datos PostgreSQL 16
   - Puerto: 5432
   - Usuario: residencias_user
   - Base de datos: residencias_db

2. **backend** - API Node.js
   - Puerto: 5000
   - Incluye todas las dependencias para:
     - TensorFlow (@tensorflow/tfjs-node)
     - Canvas (reconocimiento facial)
     - FFmpeg (procesamiento de video)

## Configuración

Las variables de entorno se cargan desde `.env`. Asegúrate de tener configurado:

- `JWT_SECRET`: Clave secreta para JWT
- `ENCRYPTION_KEY`: Clave de encriptación (64 caracteres hex)
- `DB_*`: Configuración de base de datos

## Volúmenes

Los siguientes directorios se montan como volúmenes:

- `./storage` → `/app/storage` - Almacenamiento de documentos KYC
- `./logs` → `/app/logs` - Logs de auditoría
- `./models` → `/app/models` - Modelos de face-api

## Migraciones

Para ejecutar migraciones dentro del contenedor:

```bash
# Entrar al contenedor
docker-compose exec backend sh

# Ejecutar migraciones
npm run migrate

# Ejecutar seeds
npm run seed:complete
```

## Troubleshooting

### El backend no inicia

```bash
# Ver logs detallados
docker-compose logs backend

# Verificar estado
docker-compose ps
```

### Problemas con la base de datos

```bash
# Reiniciar solo postgres
docker-compose restart postgres

# Ver logs de postgres
docker-compose logs postgres
```

### Limpiar y empezar de nuevo

```bash
# Detener y eliminar todo (incluye volúmenes)
docker-compose down -v

# Reconstruir desde cero
docker-compose up --build
```

## Desarrollo

Para desarrollo local sin Docker, usa:

```bash
npm run dev
```

Esto ejecutará el backend directamente con ts-node-dev (pero necesitarás Visual Studio Build Tools en Windows para las dependencias nativas).

## Producción

El Dockerfile está optimizado para producción:

- Usa Node.js 20 Bullseye (Debian)
- Compila TypeScript a JavaScript
- Instala todas las dependencias nativas
- Ejecuta el código compilado con `node dist/index.js`

## Health Checks

El backend incluye un health check en `/health` que verifica:

- Estado del servidor
- Conexión a la base de datos

Docker Compose verifica automáticamente la salud de los servicios.
