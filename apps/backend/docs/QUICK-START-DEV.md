# 🚀 Quick Start - Desarrollo con Hot-Reload

## Para empezar AHORA:

### Windows
```bash
docker-start-dev.bat
```

### O con npm
```bash
npm run docker:dev
```

⚠️ **PRIMERA VEZ:** Ejecuta las migraciones después de iniciar:
```bash
docker-compose -f docker-compose.dev.yml exec backend npm run migrate
```

## ✨ ¿Qué hace esto?

1. Levanta PostgreSQL, Redis y tu Backend
2. Activa hot-reload automático
3. Cualquier cambio en `src/` se refleja instantáneamente
4. NO necesitas reconstruir ni reiniciar

## 🎯 Ahora puedes:

- Editar archivos en `src/`
- Guardar (Ctrl+S)
- Ver los cambios automáticamente en http://localhost:3001

## 📖 Más información

Lee [DOCKER-DEV.md](./DOCKER-DEV.md) para detalles completos.
