#!/bin/bash

# ==============================================================================
# SCRIPT DE CONFIGURACIÓN: NAVEGACIÓN LOCAL (AURA EDITION)
# ==============================================================================
# Este script automatiza la descarga y el procesamiento de mapas para el 
# sistema de navegación autónomo de la plataforma Ohana.
#
# REQUISITOS:
#   - Docker y Docker Compose instalados.
#   - Conexión a internet para descargar el mapa de Geofabrik.
# ==============================================================================

# Definición de colores para la consola
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color (Reset)

# Variables de configuración
DATA_DIR="./data"
MAP_URL="https://download.geofabrik.de/south-america/colombia-latest.osm.pbf"
MAP_FILE="$DATA_DIR/colombia-latest.osm.pbf"

echo -e "${BLUE}------------------------------------------------------------${NC}"
echo -e "${BLUE}>>> INICIANDO CONFIGURACIÓN DE NAVEGACIÓN LOCAL${NC}"
echo -e "${BLUE}------------------------------------------------------------${NC}"

# 1. PREPARACIÓN DEL DIRECTORIO
# OSRM necesita un lugar donde escribir los archivos procesados.
# Usamos una carpeta local ./data que está montada como volumen en Docker.
if [ ! -d "$DATA_DIR" ]; then
    echo -e "${YELLOW}[INF] Creando directorio de datos en $DATA_DIR...${NC}"
    mkdir -p "$DATA_DIR"
fi

# 2. ADQUISICIÓN DE DATOS GEOGRÁFICOS
# Descargamos el archivo .osm.pbf (OpenStreetMap) que contiene la red vial.
# Si el archivo ya existe, saltamos este paso para ahorrar tiempo y ancho de banda.
if [ ! -f "$MAP_FILE" ]; then
    echo -e "${YELLOW}[INF] Descargando mapa de Colombia (Geofabrik)...${NC}"
    wget -O "$MAP_FILE" "$MAP_URL"
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERR] Falló la descarga del mapa. Verificá tu conexión.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}[OK] El mapa base ya está presente en $DATA_DIR.${NC}"
fi

# 3. GESTIÓN DE PERMISOS
# Docker a veces crea archivos como root. Para evitar errores de 'Permission Denied'
# al intentar leer o escribir desde el host o el contenedor, liberamos permisos.
echo -e "${YELLOW}[INF] Ajustando permisos del directorio de datos...${NC}"
sudo chmod -R 777 "$DATA_DIR"

# 4. PROCESAMIENTO DE OSRM (Motor de Rutas)
# El procesamiento se divide en 3 fases críticas:
echo -e "${BLUE}>>> INICIANDO PROCESAMIENTO DE DATOS OSRM...${NC}"

# FASE A: osrm-extract
# Toma el archivo .pbf y extrae la red vial usando el perfil de 'auto' (car.lua).
# Esto define qué calles son transitables, velocidades máximas, giros, etc.
echo -e "${YELLOW}[1/3] Extrayendo red vial (osrm-extract)...${NC}"
docker compose run --rm --entrypoint osrm-extract osrm -p /opt/car.lua /data/colombia-latest.osm.pbf

# FASE B: osrm-partition
# Divide el grafo de calles en celdas pequeñas para acelerar los cálculos de rutas largas.
echo -e "${YELLOW}[2/3] Particionando grafo (osrm-partition)...${NC}"
docker compose run --rm --entrypoint osrm-partition osrm /data/colombia-latest.osrm

# FASE C: osrm-customize
# Calcula los pesos finales (tiempos de viaje) basados en los datos extraídos y particionados.
echo -e "${YELLOW}[3/3] Personalizando motor de rutas (osrm-customize)...${NC}"
docker compose run --rm --entrypoint osrm-customize osrm /data/colombia-latest.osrm

# FINALIZACIÓN
echo -e "${BLUE}------------------------------------------------------------${NC}"
echo -e "${GREEN}[SUCCESS] Configuración completada correctamente.${NC}"
echo -e "${GREEN}[ACTION] Ejecutá 'docker compose up -d' para iniciar los servicios.${NC}"
echo -e "${BLUE}------------------------------------------------------------${NC}"

# ==============================================================================
# EXPLICACIÓN TÉCNICA DE ARCHIVOS GENERADOS:
# .osrm            -> Grafo base extraído.
# .osrm.partition  -> Datos de las celdas particionadas.
# .osrm.cells      -> Información de conectividad entre celdas.
# .osrm.customize  -> Datos de ruteo optimizados (pesos y tiempos).
# ==============================================================================
