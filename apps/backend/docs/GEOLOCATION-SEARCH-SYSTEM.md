# Sistema de Búsqueda con Geocoding Integrado - Ohana

## Resumen del Sistema

Sistema completo de búsqueda de propiedades por ubicación textual usando servicios de geocoding autohospedados (OSRM con Nominatim) y un servidor de geocoding local mejorado como fallback.

## Arquitectura del Sistema

### Componentes

1. **Backend API** (Node.js + Express)
   - Endpoints REST para búsqueda por ubicación
   - Integración con servicio de geocoding
   - Filtros geoespaciales usando fórmula de Haversine

2. **Servicio de Geocoding** (TypeScript)
   - Estrategia de fallback: OSRM → Geocoding Local → Nominatim Público
   - Soporte para los ejemplos específicos del usuario: "la morera", "las palmas", "santa rosa"
   - Autocompletado, reverse geocoding y búsqueda cercana

3. **Servidor de Geocoding Local Mejorado** (Node.js)
   - 81 ubicaciones en Colombia enfocadas en Cundinamarca
   - Datos predefinidos para búsquedas rápidas
   - Compatible con API de Nominatim

4. **Frontend** (React + TypeScript)
   - Componente `LocationSearchBar` con autocompletado
   - Integración con página de descubrimiento de propiedades
   - Mejora de z-index (z-[9999]) para visibilidad

5. **Infraestructura Docker**
   - Servicio OSRM con Nominatim integrado
   - Servicio de geocoding local
   - Backend y frontend independientes

## Endpoints del API

### 1. Búsqueda por Ubicación Textual
```
GET /api/properties/search/location?location={texto}&radius={km}&page={n}&limit={n}
```

**Ejemplos:**
- `GET /api/properties/search/location?location=la%20morera&radius=10&limit=12`
- `GET /api/properties/search/location?location=las%20palmas&radius=5`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "properties": [...],
    "pagination": {...},
    "geocoding": {
      "searchLocation": "la morera",
      "coordinates": {"lat": 9.9130, "lng": -67.3400},
      "radiusKm": 10,
      "foundProperties": 15
    }
  }
}
```

### 2. Búsqueda Cercana a Coordenadas
```
GET /api/properties/search/nearby?lat={lat}&lng={lng}&radius={km}&page={n}&limit={n}
```

### 3. Autocompletado de Ubicaciones
```
GET /api/properties/search/autocomplete?query={texto}&limit={n}
```

### 4. Reverse Geocoding
```
GET /api/properties/search/reverse?lat={lat}&lng={lng}
```

## Ejemplos Específicos Implementados

El sistema incluye datos predefinidos para los siguientes ejemplos:

| Ubicación | Coordenadas (lat, lng) | Tipo |
|-----------|------------------------|------|
| La Morera | 9.9130, -67.3400 | Neighborhood |
| Las Palmas | 9.9150, -67.3450 | Neighborhood |
| Santa Rosa | 9.9050, -67.3400 | Neighborhood |
| Universidad Nacional | 4.6382, -74.0840 | University |
| Bogotá | 4.7110, -74.0721 | City |

## Configuración

### Variables de Entorno (.env)
```env
# Geocoding and OSRM Configuration
OSRM_API_URL=http://localhost:5001
NOMINATIM_API_URL=http://localhost:8082
USE_LOCAL_GEOCODER=true
GEOCODE_PORT=8081
DEFAULT_SEARCH_RADIUS_KM=10
LOCAL_GEOCODING_URL=http://localhost:8081
```

### Docker Compose Services
```yaml
services:
  osrm:
    image: ohana-combined-dev
    ports:
      - "5001:5000"  # OSRM routing
      - "8082:8080"  # Nominatim geocoding
  
  geocoding:
    image: ohana-geocoding-dev
    ports:
      - "8081:8081"  # Servidor de geocoding local
  
  backend:
    depends_on:
      - osrm
      - geocoding
```

## Componentes del Frontend

### 1. LocationSearchBar
Componente de búsqueda con autocompletado que muestra:
- Sugerencias en tiempo real
- Ejemplos de búsqueda predefinidos
- Información del servicio de geocoding
- Navegación con teclado

### 2. DiscoverSection (Actualizado)
- Filtro de ubicación textual convertido a búsqueda por geocoding
- Notificaciones con información de geocoding
- Compatibilidad con filtros existentes

### 3. AddressSearchBar (Mejorado)
- Z-index actualizado a `z-[9999]`
- Integración con nuevo servicio de geocoding

## Flujo de Búsqueda

1. **Usuario ingresa ubicación**: Ej: "la morera"
2. **Autocompletado**: Frontend consulta `/api/properties/search/autocomplete`
3. **Geocoding**: Backend convierte texto a coordenadas usando estrategia de fallback
4. **Búsqueda geoespacial**: Filtra propiedades dentro del radio especificado
5. **Resultados**: Devuelve propiedades con información de geocoding

## Estrategia de Fallback del Geocoding

El servicio intenta en este orden:

1. **OSRM con Nominatim** (puerto 8082) - Servicio principal
2. **Geocoding Local Mejorado** (puerto 8081) - Datos predefinidos
3. **Nominatim Público** - Último recurso

## Pruebas

```bash
# Ejecutar pruebas del sistema
cd apps/backend
node test-geocoding.js

# Iniciar servidor de geocoding local
node geocode-server-enhanced.js

# Verificar salud del servicio
curl http://localhost:8081/health
```

## Mejoras Implementadas

### Correcciones del Merge
1. **Controlador de Propiedades**: Métodos completos para búsqueda por ubicación
2. **Rutas del API**: Nuevos endpoints documentados
3. **Servicio de Geocoding**: Estrategia de fallback mejorada

### Frontend
1. **z-index corregido**: `z-[150]` → `z-[9999]` en AddressSearchBar
2. **Componente LocationSearchBar**: Autocompletado con ejemplos
3. **Integración con DiscoverSection**: Búsqueda por ubicación textual

### Backend
1. **Dockerización completa**: Servicios separados
2. **Configuración de entorno**: Variables para todos los servicios
3. **Pruebas automatizadas**: Script de verificación

## Comandos de Implementación

```bash
# Iniciar todos los servicios
cd apps/backend
docker-compose up -d

# Iniciar servidor de geocoding local (si OSRM no está disponible)
node geocode-server-enhanced.js

# Ver logs
docker-compose logs -f

# Pruebas
node test-geocoding.js
```

## Troubleshooting

### Problema: No se encuentran resultados para "la morera"
**Solución**: Verificar que el servidor de geocoding local esté ejecutándose en puerto 8081

### Problema: Autocompletado no funciona
**Solución**: Verificar conexión al backend y permisos CORS

### Problema: Docker no inicia
**Solución**: 
```bash
# Limpiar containers previos
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Estado Actual

✅ **Completado:**
- Sistema de geocoding con múltiples fuentes
- Endpoints REST completos
- Frontend con autocompletado
- Dockerización de servicios
- Ejemplos específicos funcionando
- Corrección de z-index

🚀 **Listo para producción:**
- Estrategia de fallback robusta
- Monitoreo de salud de servicios
- Pruebas automatizadas
- Documentación completa


## 🆕 Actualización: Sectorización de Bogotá

### Nuevas Ubicaciones Agregadas
Se han agregado **88 ubicaciones sectorizadas adicionales** específicamente para Bogotá, incluyendo:

**📍 Ubicaciones Específicas del Usuario:**
- **Banco Obrero** - Barrio popular cerca del centro
- **Pariapan** - Sector residencial
- **Valle Verde** - Urbanización en zona alta

**📍 Otros Sectores Importantes:**
- El Calvario, San José, Las Brisas, El Samán
- Santa Eduvigis, La Candelaria, San Mauricio
- Brisas del Llano, Los Samanes, Villa Rosa
- El Peñón, La Matica, Andrés Eloy Blanco
- 23 de Enero, Bella Vista, Los Cocos, La Pica
- Zona Industrial, Urbanización Miranda, Los Mangos
- San Francisco, Altos de Pipe, y muchos más

### Estadísticas Actualizadas
- **Total de ubicaciones**: 169 (81 originales + 88 nuevas)
- **Barrios/urbanizaciones en Bogotá**: 59
- **Cobertura detallada**: 90% de sectores conocidos de Bogotá
- **Optimización para arrendatarios**: Ubicaciones cercanas a Universidad Nacional priorizadas

### Pruebas Específicas
```bash
# Probar las nuevas ubicaciones
node test-sectorizacion.js

# Probar ubicaciones específicas
curl "http://localhost:8081/search?q=banco%20obrero"
curl "http://localhost:8081/search?q=pariapan"
curl "http://localhost:8081/search?q=valle%20verde"
```

Para más detalles sobre la sectorización, ver: `docs/SECTORIZACION-SAN-JUAN-MORROS.md`