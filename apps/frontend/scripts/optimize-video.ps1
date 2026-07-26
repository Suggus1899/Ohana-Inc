# Script de Optimización de Videos para Hero Background
# Requiere FFmpeg instalado: https://ffmpeg.org/download.html

param(
    [Parameter(Mandatory=$false)]
    [string]$InputFile,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("basic", "no-audio", "720p", "low-fps", "max")]
    [string]$Mode = "max"
)

# Colores para output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Banner
Write-Host ""
Write-ColorOutput Green "╔════════════════════════════════════════════════════════════╗"
Write-ColorOutput Green "║         OPTIMIZADOR DE VIDEOS PARA WEB                     ║"
Write-ColorOutput Green "║         Hero Background Video Optimizer                    ║"
Write-ColorOutput Green "╚════════════════════════════════════════════════════════════╝"
Write-Host ""

# Verificar si FFmpeg está instalado
try {
    $ffmpegVersion = ffmpeg -version 2>&1 | Select-Object -First 1
    Write-ColorOutput Cyan "✓ FFmpeg detectado: $ffmpegVersion"
} catch {
    Write-ColorOutput Red "✗ ERROR: FFmpeg no está instalado o no está en el PATH"
    Write-Host ""
    Write-Host "Instala FFmpeg desde: https://ffmpeg.org/download.html"
    Write-Host "O usa Chocolatey: choco install ffmpeg"
    exit 1
}

Write-Host ""

# Si no se proporciona archivo, mostrar menú
if (-not $InputFile) {
    Write-ColorOutput Yellow "Arrastra tu video aquí o escribe la ruta:"
    $InputFile = Read-Host "Archivo de entrada"
    $InputFile = $InputFile.Trim('"')
}

# Verificar que el archivo existe
if (-not (Test-Path $InputFile)) {
    Write-ColorOutput Red "✗ ERROR: El archivo '$InputFile' no existe"
    exit 1
}

# Obtener información del archivo
$fileInfo = Get-Item $InputFile
$fileName = $fileInfo.BaseName
$fileExt = $fileInfo.Extension
$fileSize = [math]::Round($fileInfo.Length / 1MB, 2)

Write-ColorOutput Cyan "📁 Archivo: $($fileInfo.Name)"
Write-ColorOutput Cyan "📊 Tamaño: $fileSize MB"
Write-Host ""

# Menú de opciones si no se especificó modo
if (-not $Mode) {
    Write-ColorOutput Yellow "Selecciona el modo de optimización:"
    Write-Host ""
    Write-Host "1. Básica          - Compresión estándar (CRF 28)"
    Write-Host "2. Sin Audio       - Compresión + eliminar audio"
    Write-Host "3. 720p            - Reducir a 1280x720"
    Write-Host "4. Bajo FPS        - Reducir a 24 FPS"
    Write-Host "5. Máxima          - 720p + 24fps + sin audio (RECOMENDADO)"
    Write-Host ""
    
    $selection = Read-Host "Opción (1-5)"
    
    switch ($selection) {
        "1" { $Mode = "basic" }
        "2" { $Mode = "no-audio" }
        "3" { $Mode = "720p" }
        "4" { $Mode = "low-fps" }
        "5" { $Mode = "max" }
        default { 
            Write-ColorOutput Red "Opción inválida. Usando modo máximo."
            $Mode = "max"
        }
    }
}

# Crear carpeta de salida si no existe
$outputDir = Join-Path (Split-Path $InputFile) "optimized"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Generar nombre de archivo de salida
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = Join-Path $outputDir "$fileName-optimized-$Mode$fileExt"

Write-Host ""
Write-ColorOutput Green "🎬 Iniciando optimización en modo: $Mode"
Write-ColorOutput Cyan "📤 Salida: $outputFile"
Write-Host ""
Write-ColorOutput Yellow "⏳ Procesando... (esto puede tomar varios minutos)"
Write-Host ""

# Comandos según el modo
$startTime = Get-Date

switch ($Mode) {
    "basic" {
        Write-Host "Modo: Compresión básica optimizada"
        ffmpeg -i $InputFile -vcodec libx264 -crf 28 -preset slow -movflags faststart $outputFile -y
    }
    "no-audio" {
        Write-Host "Modo: Sin audio (videos decorativos)"
        ffmpeg -i $InputFile -vcodec libx264 -an -crf 28 -preset slow -movflags faststart $outputFile -y
    }
    "720p" {
        Write-Host "Modo: Resolución 720p"
        ffmpeg -i $InputFile -vf scale=1280:720 -vcodec libx264 -crf 28 -movflags faststart $outputFile -y
    }
    "low-fps" {
        Write-Host "Modo: 24 FPS"
        ffmpeg -i $InputFile -r 24 -vcodec libx264 -crf 28 -movflags faststart $outputFile -y
    }
    "max" {
        Write-Host "Modo: Máxima optimización (720p + 24fps + sin audio)"
        ffmpeg -i $InputFile -vf scale=1280:720 -r 24 -vcodec libx264 -crf 28 -preset slow -an -movflags faststart $outputFile -y
    }
}

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""

# Verificar si se creó el archivo
if (Test-Path $outputFile) {
    $outputFileInfo = Get-Item $outputFile
    $outputSize = [math]::Round($outputFileInfo.Length / 1MB, 2)
    $reduction = [math]::Round((($fileSize - $outputSize) / $fileSize) * 100, 2)
    
    Write-ColorOutput Green "╔════════════════════════════════════════════════════════════╗"
    Write-ColorOutput Green "║                  ✓ OPTIMIZACIÓN EXITOSA                    ║"
    Write-ColorOutput Green "╚════════════════════════════════════════════════════════════╝"
    Write-Host ""
    Write-ColorOutput Cyan "📊 RESULTADOS:"
    Write-Host "   Tamaño original:  $fileSize MB"
    Write-Host "   Tamaño optimizado: $outputSize MB"
    Write-ColorOutput Green "   Reducción:        $reduction%"
    Write-Host "   Tiempo:           $($duration.ToString('mm\:ss'))"
    Write-Host ""
    Write-ColorOutput Cyan "📁 Archivo guardado en:"
    Write-Host "   $outputFile"
    Write-Host ""
    
    # Sugerencia de uso
    if ($outputSize -lt 5) {
        Write-ColorOutput Green "✓ El video está optimizado para web (< 5MB)"
    } elseif ($outputSize -lt 10) {
        Write-ColorOutput Yellow "⚠ El video es aceptable pero podrías optimizar más"
    } else {
        Write-ColorOutput Red "⚠ El video es grande (> 10MB). Considera:"
        Write-Host "   - Reducir la duración del video"
        Write-Host "   - Usar modo 'max' si no lo hiciste"
        Write-Host "   - Aumentar CRF a 30-32 para más compresión"
    }
    
    Write-Host ""
    Write-ColorOutput Cyan "📋 PRÓXIMOS PASOS:"
    Write-Host "   1. Copia el video a: apps/frontend/public/videos/"
    Write-Host "   2. Renombra a: hero-background.mp4"
    Write-Host "   3. Reinicia el servidor de desarrollo"
    Write-Host ""
    
    # Preguntar si quiere abrir la carpeta
    $openFolder = Read-Host "¿Abrir carpeta de salida? (S/N)"
    if ($openFolder -eq "S" -or $openFolder -eq "s") {
        explorer $outputDir
    }
    
} else {
    Write-ColorOutput Red "✗ ERROR: No se pudo crear el archivo optimizado"
    Write-Host "Revisa los mensajes de error de FFmpeg arriba"
}

Write-Host ""
Write-Host "Presiona Enter para salir..."
Read-Host
