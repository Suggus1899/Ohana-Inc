# 🔥 Desarrollo con Hot-Reload en Docker

Este proyecto ahora incluye configuración para desarrollo con hot-reload, lo que significa que los cambios en tu código se reflejan automáticamente sin necesidad de reconstruir la imagen.

## 🚀 Inicio Rápido

### Windows
```bash
docker-start-dev.bat
```

### Linux/Mac
```bash
chmod +x docker-start-dev.sh
./docker-start-dev.sh
```

### Usando npm
```bash
npm run docker:dev
```

## 📋 Diferencias entre Producción y Desarrollo

### Modo Producción (`docker-compose.yml`)
- ✅ Código compilado a JavaScript
- ✅ Optimizado para performance
- ✅ Imagen más pequeña
- ❌ Requiere rebuild para ver cambios
- **Comando**: `npm run docker:up` o `docker-start.bat`

### Modo Desarrollo (`docker-compose.dev.yml`)
- ✅ Hot-reload activado con `ts-node-dev`
- ✅ Cambios instantáneos sin rebuild
- ✅ Código fuente montado como volumen
- ✅ Mejor experiencia de desarrollo
- ⚠️ Imagen más pesada (incluye dev dependencies)
- **Comando**: `npm run docker:dev` o `docker-start-dev.bat`

## 🛠️ Comandos Disponibles

### Desarrollo
```bash
# Iniciar en modo desarrollo (con logs)
npm run docker:dev

# Iniciar en background
docker-compose -f docker-compose.dev.yml up --build -d

# Ver logs
npm run docker:dev:logs

# Detener servicios
npm run docker:dev:down

# Limpiar todo (incluye volúmenes)
npm run docker:dev:clean
```

### Producción
```bash
# Iniciar en modo producción
npm run docker:up

# Ver logs
npm run docker:logs

# Reiniciar backend (NO recarga código)
npm run docker:restart

# Detener servicios
npm run docker:down

# Limpiar todo
npm run docker:clean
```

## 🔄 Flujo de Trabajo en Desarrollo

1. **Inicia el entorno de desarrollo**:
   ```bash
   npm run docker:dev
   ```

2. **Edita tu código** en `src/`:
   - Los cambios se detectan automáticamente
   - El servidor se reinicia solo
   - No necesitas hacer nada más

3. **Ver logs en tiempo real**:
   - Los logs aparecen automáticamente en la terminal
   - O usa: `npm run docker:dev:logs`

4. **Detener cuando termines**:
   ```bash
   npm run docker:dev:down
   ```

## 📁 Archivos Montados como Volúmenes

En modo desarrollo, estos directorios están sincronizados:
- `./src` → `/app/src` (código fuente)
- `./storage` → `/app/storage` (archivos KYC)
- `./logs` → `/app/logs` (logs de auditoría)
- `./models` → `/app/models` (modelos face-api)

## ⚠️ Notas Importantes

1. **Primera vez**: El build inicial puede tardar varios minutos (instala dependencias nativas)
2. **node_modules**: NO se sincronizan (se mantienen dentro del contenedor)
3. **Cambios en package.json**: Requieren rebuild:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```
4. **Cambios en .env**: Requieren reinicio:
   ```bash
   docker-compose -f docker-compose.dev.yml restart backend
   ```

## 🐛 Troubleshooting

### Los cambios no se reflejan
```bash
# Verifica que el volumen esté montado correctamente
docker exec -it residencias-backend-dev ls -la /app/src

# Reinicia el contenedor
docker-compose -f docker-compose.dev.yml restart backend
```

### Error de permisos en Linux
```bash
# Da permisos al script
chmod +x docker-start-dev.sh
```

### Puerto 3001 ya en uso
```bash
# Detén el contenedor de producción primero
npm run docker:down

# O cambia el puerto en docker-compose.dev.yml
```

## 🎯 Recomendaciones

- **Desarrollo diario**: Usa `docker-compose.dev.yml`
- **Testing de producción**: Usa `docker-compose.yml`
- **Deploy**: Usa `docker-compose.yml` con variables de entorno apropiadas
