# 🪟 Instrucciones para Windows

## 🚀 Inicio Rápido

### Opción 1: Doble clic (Más fácil)
1. Abre la carpeta `backend-residencias`
2. Doble clic en `docker-start-dev.bat`
3. ¡Listo! El servidor inicia con hot-reload

### Opción 2: PowerShell/CMD
```bash
cd backend-residencias
npm run docker:dev
```

---

## 📝 Comandos en Windows

### PowerShell (Recomendado)
```powershell
# Iniciar desarrollo
npm run docker:dev

# Ver logs (en otra ventana)
npm run docker:dev:logs

# Detener
npm run docker:dev:down

# Limpiar todo
npm run docker:dev:clean
```

### CMD
```cmd
REM Iniciar desarrollo
npm run docker:dev

REM Ver logs
npm run docker:dev:logs

REM Detener
npm run docker:dev:down
```

---

## 🔧 Configuración Inicial (Solo primera vez)

### 1. Instalar Docker Desktop
- Descarga: https://www.docker.com/products/docker-desktop
- Instala y reinicia Windows
- Abre Docker Desktop y espera que inicie

### 2. Verificar instalación
```powershell
docker --version
docker-compose --version
```

### 3. Clonar/Abrir proyecto
```powershell
cd C:\tu\ruta\backend-residencias
```

### 4. Instalar dependencias (opcional, para npm scripts)
```powershell
npm install
```

### 5. Configurar .env
- Copia `.env.example` a `.env`
- Edita valores si es necesario

---

## 🎯 Uso Diario

### Iniciar tu día
```powershell
# Opción A: Script directo
.\docker-start-dev.bat

# Opción B: Con npm
npm run docker:dev
```

### Durante el desarrollo
1. Edita archivos en `src\`
2. Guarda con `Ctrl+S`
3. Los cambios se aplican automáticamente
4. Revisa logs en la terminal

### Terminar tu día
```powershell
# Presiona Ctrl+C en la terminal
# O en otra terminal:
npm run docker:dev:down
```

---

## 🐛 Solución de Problemas en Windows

### Docker Desktop no inicia
1. Abre "Servicios" de Windows
2. Busca "Docker Desktop Service"
3. Click derecho → Iniciar

### Puerto 3001 ocupado
```powershell
# Ver qué usa el puerto
netstat -ano | findstr :3001

# Matar proceso (reemplaza PID)
taskkill /PID <numero> /F

# O detén el contenedor anterior
npm run docker:down
```

### Error "docker-compose no reconocido"
```powershell
# Verifica Docker Desktop esté corriendo
docker --version

# Si no funciona, reinicia Docker Desktop
```

### Cambios no se reflejan
```powershell
# Reinicia el backend
docker-compose -f docker-compose.dev.yml restart backend

# Si persiste, rebuild
docker-compose -f docker-compose.dev.yml up --build
```

### Error de permisos
1. Ejecuta PowerShell como Administrador
2. Ejecuta: `Set-ExecutionPolicy RemoteSigned`
3. Confirma con `Y`

### WSL 2 no instalado (Docker lo requiere)
1. Abre PowerShell como Administrador
2. Ejecuta:
```powershell
wsl --install
```
3. Reinicia Windows
4. Abre Docker Desktop de nuevo

---

## 📁 Estructura de Archivos Windows

```
C:\tu\ruta\backend-residencias\
│
├── src\                        # Tu código (edita aquí)
├── storage\                    # Archivos KYC
├── logs\                       # Logs de auditoría
├── models\                     # Modelos face-api
│
├── docker-compose.dev.yml      # Config desarrollo
├── docker-start-dev.bat        # Script inicio (doble clic)
├── Dockerfile.dev              # Build desarrollo
│
└── .env                        # Variables de entorno
```

---

## 🎨 Recomendaciones para Windows

### Editor de Código
- Visual Studio Code (recomendado)
- Instala extensión "Docker" para VS Code
- Instala extensión "Remote - Containers"

### Terminal
- Windows Terminal (recomendado)
- PowerShell 7+
- Git Bash

### Herramientas Útiles
- Docker Desktop Dashboard (ver contenedores)
- Postman (probar API)
- DBeaver (conectar a PostgreSQL)

---

## 🔗 Conectar a Servicios desde Windows

### PostgreSQL
```
Host: localhost
Port: 5432
Database: residencias_db
User: residencias_user
Password: residencias_password_2026
```

### Redis
```
Host: localhost
Port: 6379
```

### API Backend
```
http://localhost:3001/api
```

---

## 💡 Tips para Windows

1. **Usa Windows Terminal**: Mejor experiencia que CMD
2. **Mantén Docker Desktop abierto**: Necesario para que funcione
3. **Antivirus**: Agrega excepción para Docker
4. **WSL 2**: Asegúrate que esté actualizado
5. **Recursos**: Asigna suficiente RAM a Docker (Settings → Resources)

---

## 🆘 Comandos de Emergencia

```powershell
# Detener todo inmediatamente
docker-compose -f docker-compose.dev.yml kill

# Limpiar todo y empezar de cero
npm run docker:dev:clean
npm run docker:dev

# Ver todos los contenedores
docker ps -a

# Ver logs de error
docker logs residencias-backend-dev

# Reiniciar Docker Desktop
# Cierra Docker Desktop y ábrelo de nuevo
```

---

## 📞 Necesitas Ayuda?

1. Revisa los logs: `npm run docker:dev:logs`
2. Verifica Docker Desktop esté corriendo
3. Consulta [DOCKER-DEV.md](./DOCKER-DEV.md) para más detalles
4. Revisa [COMANDOS-DOCKER.md](./COMANDOS-DOCKER.md) para referencia
