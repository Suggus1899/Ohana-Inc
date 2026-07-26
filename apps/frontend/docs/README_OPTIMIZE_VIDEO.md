# 🎬 Scripts de Optimización de Videos

Scripts interactivos para optimizar videos para uso en el Hero del landing page.

---

## 📋 Requisitos Previos

### Instalar FFmpeg

#### Windows
```powershell
# Opción 1: Con Chocolatey (recomendado)
choco install ffmpeg

# Opción 2: Manual
# 1. Descarga desde: https://ffmpeg.org/download.html
# 2. Extrae el archivo
# 3. Agrega la carpeta bin al PATH
```

#### macOS
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Linux (Fedora)
```bash
sudo dnf install ffmpeg
```

### Verificar Instalación
```bash
ffmpeg -version
```

---

## 🚀 Uso de los Scripts

### Windows - Batch (.bat)

**Método 1: Arrastrar y soltar**
1. Arrastra tu video sobre el archivo `optimize-video.bat`
2. Sigue las instrucciones en pantalla

**Método 2: Línea de comandos**
```cmd
optimize-video.bat "ruta/al/video.mp4"
```

**Método 3: Doble clic**
1. Doble clic en `optimize-video.bat`
2. Escribe o pega la ruta del video
3. Selecciona el modo de optimización

---

### Windows - PowerShell (.ps1)

**Habilitar ejecución de scripts (primera vez):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Uso básico:**
```powershell
.\optimize-video.ps1 -InputFile "ruta/al/video.mp4"
```

**Con modo específico:**
```powershell
.\optimize-video.ps1 -InputFile "video.mp4" -Mode "max"
```

**Modos disponibles:**
- `basic` - Compresión básica
- `no-audio` - Sin audio
- `720p` - Resolución 720p
- `low-fps` - 24 FPS
- `max` - Máxima optimización (recomendado)

---

### Linux/Mac - Bash (.sh)

**Dar permisos de ejecución (primera vez):**
```bash
chmod +x optimize-video.sh
```

**Uso básico:**
```bash
./optimize-video.sh video.mp4
```

**Con modo específico:**
```bash
./optimize-video.sh video.mp4 max
```

**Arrastrar y soltar (Terminal):**
1. Escribe `./optimize-video.sh ` (con espacio al final)
2. Arrastra el video a la terminal
3. Presiona Enter

---

## 🎯 Modos de Optimización

### 1. Básica
- **Uso**: Videos ya optimizados que solo necesitan ajuste
- **Compresión**: CRF 28
- **Mantiene**: Resolución, FPS, audio
- **Reducción**: ~30-40%

```bash
# Comando directo
ffmpeg -i input.mp4 -vcodec libx264 -crf 28 -preset slow -movflags faststart output.mp4
```

---

### 2. Sin Audio
- **Uso**: Videos de fondo decorativos (RECOMENDADO para Hero)
- **Compresión**: CRF 28 + elimina audio
- **Mantiene**: Resolución, FPS
- **Reducción**: ~40-50%

```bash
# Comando directo
ffmpeg -i input.mp4 -vcodec libx264 -an -crf 28 -preset slow -movflags faststart output.mp4
```

---

### 3. 720p
- **Uso**: Videos de alta resolución (1080p o 4K)
- **Compresión**: CRF 28 + reduce a 1280x720
- **Mantiene**: FPS, audio
- **Reducción**: ~50-60%

```bash
# Comando directo
ffmpeg -i input.mp4 -vf scale=1280:720 -vcodec libx264 -crf 28 -movflags faststart output.mp4
```

---

### 4. Bajo FPS
- **Uso**: Videos con FPS alto (60fps)
- **Compresión**: CRF 28 + reduce a 24 FPS
- **Mantiene**: Resolución, audio
- **Reducción**: ~40-50%

```bash
# Comando directo
ffmpeg -i input.mp4 -r 24 -vcodec libx264 -crf 28 -movflags faststart output.mp4
```

---

### 5. Máxima (RECOMENDADO) ⭐
- **Uso**: Optimización completa para web
- **Compresión**: CRF 28 + 720p + 24fps + sin audio
- **Reducción**: ~70-80%
- **Ideal para**: Hero backgrounds

```bash
# Comando directo
ffmpeg -i input.mp4 -vf scale=1280:720 -r 24 -vcodec libx264 -crf 28 -preset slow -an -movflags faststart output.mp4
```

---

## 📊 Ejemplo de Resultados

### Video Original
- Tamaño: 50 MB
- Resolución: 1920x1080
- FPS: 30
- Audio: Sí

### Después de Optimización "Máxima"
- Tamaño: 8 MB (84% reducción)
- Resolución: 1280x720
- FPS: 24
- Audio: No

---

## 📁 Estructura de Salida

Los videos optimizados se guardan en una carpeta `optimized` junto al video original:

```
tu-carpeta/
├── video-original.mp4
└── optimized/
    ├── video-original-optimized-basic.mp4
    ├── video-original-optimized-max.mp4
    └── ...
```

---

## 🎯 Recomendaciones para Hero Background

### Tamaño Ideal
- ✅ Excelente: < 5 MB
- ⚠️ Aceptable: 5-10 MB
- ❌ Muy grande: > 10 MB

### Características Recomendadas
- **Resolución**: 1280x720 (720p)
- **FPS**: 24
- **Duración**: 10-30 segundos
- **Audio**: No necesario
- **Formato**: MP4 (H.264)

### Contenido Sugerido
- Tours de apartamentos/casas
- Exteriores de propiedades
- Interiores modernos
- Movimientos lentos y suaves
- Bien iluminado

---

## 🔧 Personalización Avanzada

### Aumentar Compresión (videos muy grandes)

Cambia el CRF de 28 a 30-32:
```bash
ffmpeg -i input.mp4 -vf scale=1280:720 -r 24 -vcodec libx264 -crf 32 -preset slow -an -movflags faststart output.mp4
```

### Reducir Más la Resolución

Para videos aún más pequeños (480p):
```bash
ffmpeg -i input.mp4 -vf scale=854:480 -r 24 -vcodec libx264 -crf 28 -preset slow -an -movflags faststart output.mp4
```

### Cortar Duración del Video

Tomar solo los primeros 20 segundos:
```bash
ffmpeg -i input.mp4 -t 20 -vf scale=1280:720 -r 24 -vcodec libx264 -crf 28 -preset slow -an -movflags faststart output.mp4
```

### Cortar Segmento Específico

Desde segundo 5 hasta segundo 25:
```bash
ffmpeg -i input.mp4 -ss 5 -t 20 -vf scale=1280:720 -r 24 -vcodec libx264 -crf 28 -preset slow -an -movflags faststart output.mp4
```

---

## 📋 Workflow Completo

### 1. Obtener Video
- Descarga de Pexels, Pixabay, etc.
- O graba tu propio video

### 2. Optimizar
```bash
# Windows
optimize-video.bat video.mp4

# Linux/Mac
./optimize-video.sh video.mp4
```

### 3. Seleccionar Modo
- Elige opción 5 (Máxima) para mejor resultado

### 4. Copiar al Proyecto
```bash
# Crear carpeta si no existe
mkdir -p public/videos

# Copiar video optimizado
cp optimized/video-optimized-max.mp4 public/videos/hero-background.mp4
```

### 5. Verificar en el Navegador
```bash
npm run dev
```

---

## 🐛 Solución de Problemas

### Error: "ffmpeg no encontrado"
**Solución**: Instala FFmpeg (ver sección de requisitos)

### Error: "No se puede ejecutar el script"
**Windows PowerShell**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Linux/Mac**:
```bash
chmod +x optimize-video.sh
```

### El video sigue siendo muy grande
**Soluciones**:
1. Usa modo "max" si no lo hiciste
2. Aumenta CRF a 30-32
3. Reduce la duración del video
4. Reduce más la resolución (480p)

### El video se ve pixelado
**Soluciones**:
1. Reduce CRF a 24-26 (mayor calidad)
2. Usa un video original de mejor calidad
3. No reduzcas tanto la resolución

### El script se cierra inmediatamente
**Windows**: Ejecuta desde CMD o PowerShell, no con doble clic

---

## 📚 Recursos Adicionales

### Documentación FFmpeg
- https://ffmpeg.org/documentation.html

### Guías de Optimización
- https://trac.ffmpeg.org/wiki/Encode/H.264

### Videos Gratuitos
- https://www.pexels.com/videos/
- https://pixabay.com/videos/
- https://coverr.co/

---

## 💡 Tips Profesionales

### Batch Processing (Múltiples Videos)

**Windows PowerShell**:
```powershell
Get-ChildItem *.mp4 | ForEach-Object {
    .\optimize-video.ps1 -InputFile $_.FullName -Mode "max"
}
```

**Linux/Mac**:
```bash
for video in *.mp4; do
    ./optimize-video.sh "$video" max
done
```

### Comparar Calidad

Reproduce ambos videos lado a lado para comparar:
```bash
ffplay -i original.mp4 &
ffplay -i optimized.mp4 &
```

### Extraer Frame para Poster

Crear imagen de preview:
```bash
ffmpeg -i video.mp4 -ss 00:00:05 -vframes 1 poster.jpg
```

---

## ✅ Checklist Final

- [ ] FFmpeg instalado y funcionando
- [ ] Video descargado u obtenido
- [ ] Script ejecutado con modo "max"
- [ ] Video optimizado < 10 MB (idealmente < 5 MB)
- [ ] Video copiado a `public/videos/hero-background.mp4`
- [ ] Servidor de desarrollo reiniciado
- [ ] Video se reproduce correctamente en el navegador
- [ ] Texto legible sobre el video
- [ ] Rendimiento verificado en móvil

---

**¡Listo para optimizar tus videos! 🎬✨**
