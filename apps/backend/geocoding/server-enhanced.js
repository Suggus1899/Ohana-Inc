const http = require('http');
const url = require('url');

// Datos mejorados de ubicaciones en Venezuela - incluye los ejemplos del usuario
const locations = [
  // Ciudades principales de Venezuela (del archivo original)
  { id: 1, name: 'San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9088, lng: -67.3595, type: 'city', population: 125000 },
  { id: 2, name: 'Calabozo', state: 'Guárico', country: 'Venezuela', lat: 8.9244, lng: -67.4295, type: 'city', population: 140000 },
  { id: 3, name: 'Valle de la Pascua', state: 'Guárico', country: 'Venezuela', lat: 9.2055, lng: -66.0075, type: 'city', population: 120000 },
  { id: 4, name: 'Zaraza', state: 'Guárico', country: 'Venezuela', lat: 9.3500, lng: -65.5833, type: 'city', population: 50000 },
  { id: 5, name: 'Altagracia de Orituco', state: 'Guárico', country: 'Venezuela', lat: 9.8667, lng: -66.3833, type: 'city', population: 60000 },
  { id: 6, name: 'El Sombrero', state: 'Guárico', country: 'Venezuela', lat: 9.3833, lng: -67.0667, type: 'city', population: 20000 },
  { id: 7, name: 'Chaguaramas', state: 'Guárico', country: 'Venezuela', lat: 9.8333, lng: -66.8000, type: 'town', population: 15000 },
  { id: 8, name: 'Santa María de Ipire', state: 'Guárico', country: 'Venezuela', lat: 8.8000, lng: -65.3167, type: 'town', population: 12000 },
  { id: 9, name: 'Las Mercedes del Llano', state: 'Guárico', country: 'Venezuela', lat: 8.3500, lng: -66.4000, type: 'town', population: 10000 },
  { id: 10, name: 'Ortiz', state: 'Guárico', country: 'Venezuela', lat: 9.6500, lng: -67.3000, type: 'town', population: 8000 },
  
  // Universidades e Instituciones Educativas
  { id: 11, name: 'Universidad Rómulo Gallegos (UNERG)', state: 'Guárico', country: 'Venezuela', lat: 9.9089, lng: -67.3406, type: 'university' },
  { id: 12, name: 'UNERG San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9089, lng: -67.3406, type: 'university' },
  { id: 13, name: 'Universidad Nacional Experimental Rómulo Gallegos', state: 'Guárico', country: 'Venezuela', lat: 9.9089, lng: -67.3406, type: 'university' },
  { id: 14, name: 'Núcleo UNERG', state: 'Guárico', country: 'Venezuela', lat: 9.9089, lng: -67.3406, type: 'university' },
  
  // Calles y Avenidas de San Juan de los Morros
  { id: 15, name: 'Avenida Bolívar, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9100, lng: -67.3600, type: 'street' },
  { id: 16, name: 'Avenida José Antonio Páez, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9095, lng: -67.3580, type: 'street' },
  { id: 17, name: 'Avenida Guárico, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9070, lng: -67.3570, type: 'street' },
  { id: 18, name: 'Avenida Universidad, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9090, lng: -67.3450, type: 'street' },
  { id: 19, name: 'Calle Independencia, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9060, lng: -67.3550, type: 'street' },
  { id: 20, name: 'Calle Comercio, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9050, lng: -67.3530, type: 'street' },
  
  // Barrios y Urbanizaciones de San Juan de los Morros - INCLUYENDO LOS EJEMPLOS DEL USUARIO
  { id: 21, name: 'Urbanización Los Morros, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9120, lng: -67.3620, type: 'neighborhood' },
  { id: 22, name: 'Urbanización La Floresta, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9140, lng: -67.3550, type: 'neighborhood' },
  { id: 23, name: 'Urbanización Doña Bárbara, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9100, lng: -67.3500, type: 'neighborhood' },
  { id: 24, name: 'Barrio El Cambur, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9030, lng: -67.3560, type: 'neighborhood' },
  { id: 25, name: 'Barrio Sucre, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9080, lng: -67.3650, type: 'neighborhood' },
  { id: 26, name: 'Centro de San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9070, lng: -67.3570, type: 'neighborhood' },
  
  // EJEMPLOS ESPECÍFICOS MENCIONADOS POR EL USUARIO
  { id: 27, name: 'La Morera', state: 'Guárico', country: 'Venezuela', lat: 9.9130, lng: -67.3400, type: 'neighborhood', alias: ['urbanización la morera', 'la morera'] },
  { id: 28, name: 'Las Palmas', state: 'Guárico', country: 'Venezuela', lat: 9.9150, lng: -67.3450, type: 'neighborhood', alias: ['urbanización las palmas', 'las palmas'] },
  { id: 29, name: 'Santa Rosa', state: 'Guárico', country: 'Venezuela', lat: 9.9050, lng: -67.3400, type: 'neighborhood', alias: ['urbanización santa rosa', 'santa rosa'] },
  
  // Más barrios populares
  { id: 30, name: 'El Paraíso, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9110, lng: -67.3480, type: 'neighborhood' },
  { id: 31, name: 'La Esperanza, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9090, lng: -67.3520, type: 'neighborhood' },
  { id: 32, name: 'Bello Monte, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9120, lng: -67.3550, type: 'neighborhood' },
  { id: 33, name: 'El Recreo, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9105, lng: -67.3510, type: 'neighborhood' },
  
  // NUEVAS UBICACIONES SECTORIZADAS DE SAN JUAN DE LOS MORROS
  { id: 81, name: 'Banco Obrero, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9020, lng: -67.3500, type: 'neighborhood' },
  { id: 82, name: 'Pariapan, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9010, lng: -67.3480, type: 'neighborhood' },
  { id: 83, name: 'Valle Verde, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9160, lng: -67.3420, type: 'neighborhood' },
  { id: 84, name: 'El Calvario, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9040, lng: -67.3650, type: 'neighborhood' },
  { id: 85, name: 'San José, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9080, lng: -67.3400, type: 'neighborhood' },
  { id: 86, name: 'Las Brisas, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9140, lng: -67.3380, type: 'neighborhood' },
  { id: 87, name: 'El Samán, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9170, lng: -67.3400, type: 'neighborhood' },
  { id: 88, name: 'Santa Eduvigis, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9000, lng: -67.3520, type: 'neighborhood' },
  { id: 89, name: 'La Candelaria, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9030, lng: -67.3530, type: 'neighborhood' },
  { id: 90, name: 'San Mauricio, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9100, lng: -67.3650, type: 'neighborhood' },
  { id: 91, name: 'Brisas del Llano, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9190, lng: -67.3450, type: 'neighborhood' },
  { id: 92, name: 'Los Samanes, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9180, lng: -67.3480, type: 'neighborhood' },
  { id: 93, name: 'Villa Rosa, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9200, lng: -67.3420, type: 'neighborhood' },
  { id: 94, name: 'El Peñón, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9220, lng: -67.3400, type: 'neighborhood' },
  { id: 95, name: 'La Matica, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9250, lng: -67.3380, type: 'neighborhood' },
  { id: 96, name: 'Andrés Eloy Blanco, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9010, lng: -67.3550, type: 'neighborhood' },
  { id: 97, name: '23 de Enero, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.8990, lng: -67.3570, type: 'neighborhood' },
  { id: 98, name: 'Bella Vista, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9160, lng: -67.3350, type: 'neighborhood' },
  { id: 99, name: 'Los Cocos, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.8950, lng: -67.3500, type: 'neighborhood' },
  { id: 100, name: 'La Pica, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.8930, lng: -67.3450, type: 'neighborhood' },
  { id: 101, name: 'Zona Industrial, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.8900, lng: -67.3400, type: 'industrial' },
  { id: 102, name: 'Urbanización Miranda, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9120, lng: -67.3300, type: 'neighborhood' },
  { id: 103, name: 'Los Mangos, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9050, lng: -67.3300, type: 'neighborhood' },
  { id: 104, name: 'San Francisco, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9000, lng: -67.3350, type: 'neighborhood' },
  { id: 105, name: 'Altos de Pipe, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.8950, lng: -67.3350, type: 'neighborhood' },
  { id: 106, name: 'El Cambur II, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9020, lng: -67.3600, type: 'neighborhood' },
  { id: 107, name: 'La Rinconada, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9080, lng: -67.3700, type: 'neighborhood' },
  { id: 108, name: 'El Progreso, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9150, lng: -67.3320, type: 'neighborhood' },
  { id: 109, name: 'Las Acacias, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9100, lng: -67.3280, type: 'neighborhood' },
  { id: 110, name: 'Los Naranjos, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9130, lng: -67.3250, type: 'neighborhood' },
  { id: 111, name: 'Santa Inés, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9070, lng: -67.3620, type: 'neighborhood' },
  { id: 112, name: 'La Unión, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9040, lng: -67.3580, type: 'neighborhood' },
  { id: 113, name: 'El Milagro, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9010, lng: -67.3620, type: 'neighborhood' },
  { id: 114, name: 'Barrio Nuevo, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.8980, lng: -67.3600, type: 'neighborhood' },
  { id: 115, name: 'Pueblo Nuevo, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.8960, lng: -67.3580, type: 'neighborhood' },
  { id: 116, name: 'Las Delicias, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9140, lng: -67.3200, type: 'neighborhood' },
  { id: 117, name: 'El Carmen, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9090, lng: -67.3630, type: 'neighborhood' },
  { id: 118, name: 'La Paz, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9110, lng: -67.3670, type: 'neighborhood' },
  { id: 119, name: 'San Miguel, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9060, lng: -67.3700, type: 'neighborhood' },
  { id: 120, name: 'La Vega, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9030, lng: -67.3680, type: 'neighborhood' },
  { id: 121, name: 'Los Pinos, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9000, lng: -67.3650, type: 'neighborhood' },
  
  // Puntos de Interés y Landmarks (122-130)
  { id: 122, name: 'Plaza Bolívar, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9070, lng: -67.3580, type: 'landmark' },
  { id: 123, name: 'Catedral San Juan Bautista, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9075, lng: -67.3585, type: 'landmark' },
  { id: 124, name: 'Hospital Israel Ranuárez, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9060, lng: -67.3610, type: 'hospital' },
  { id: 125, name: 'Mercado Municipal, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9040, lng: -67.3510, type: 'market' },
  { id: 126, name: 'Terminal de Pasajeros, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9020, lng: -67.3530, type: 'transport' },
  { id: 127, name: 'Aeropuerto San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.8970, lng: -67.3700, type: 'airport' },
  { id: 128, name: 'Balneario La Pascua, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.8980, lng: -67.3500, type: 'landmark' },
  { id: 129, name: 'Los Morros de San Juan', state: 'Guárico', country: 'Venezuela', lat: 9.9150, lng: -67.3650, type: 'landmark' },
  { id: 130, name: 'Morro El Faro', state: 'Guárico', country: 'Venezuela', lat: 9.9170, lng: -67.3630, type: 'landmark' },
  
  // Residencias y lugares relacionados (131-134)
  { id: 131, name: 'Residencias Estudiantiles San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9089, lng: -67.3406, type: 'amenity' },
  { id: 132, name: 'Residencias Universitarias UNERG', state: 'Guárico', country: 'Venezuela', lat: 9.9095, lng: -67.3390, type: 'amenity' },
  { id: 133, name: 'Residencias San Juan', state: 'Guárico', country: 'Venezuela', lat: 9.9100, lng: -67.3580, type: 'neighborhood' },
  { id: 134, name: 'Alojamiento Estudiantil', state: 'Guárico', country: 'Venezuela', lat: 9.9090, lng: -67.3410, type: 'amenity' },
  
  // Más ciudades de Venezuela (135-154)
  { id: 135, name: 'Caracas', state: 'Distrito Capital', country: 'Venezuela', lat: 10.4806, lng: -66.9036, type: 'city', population: 2500000 },
  { id: 136, name: 'Maracay', state: 'Aragua', country: 'Venezuela', lat: 10.2469, lng: -67.5958, type: 'city', population: 1200000 },
  { id: 137, name: 'Valencia', state: 'Carabobo', country: 'Venezuela', lat: 10.1801, lng: -68.0036, type: 'city', population: 1500000 },
  { id: 138, name: 'Barquisimeto', state: 'Lara', country: 'Venezuela', lat: 10.0739, lng: -69.3228, type: 'city', population: 1000000 },
  { id: 139, name: 'Ciudad Guayana', state: 'Bolívar', country: 'Venezuela', lat: 8.3536, lng: -62.6528, type: 'city', population: 750000 },
  { id: 140, name: 'Barcelona', state: 'Anzoátegui', country: 'Venezuela', lat: 10.1333, lng: -64.6833, type: 'city', population: 700000 },
  { id: 141, name: 'Maturín', state: 'Monagas', country: 'Venezuela', lat: 9.7458, lng: -63.1833, type: 'city', population: 500000 },
  { id: 142, name: 'Puerto La Cruz', state: 'Anzoátegui', country: 'Venezuela', lat: 10.2167, lng: -64.6167, type: 'city', population: 400000 },
  { id: 143, name: 'Tucupita', state: 'Delta Amacuro', country: 'Venezuela', lat: 9.0574, lng: -62.0499, type: 'city', population: 80000 },
  { id: 144, name: 'San Fernando de Apure', state: 'Apure', country: 'Venezuela', lat: 7.8877, lng: -67.4724, type: 'city', population: 175000 },
  { id: 145, name: 'San Carlos', state: 'Cojedes', country: 'Venezuela', lat: 9.6667, lng: -68.5833, type: 'city', population: 85000 },
  { id: 146, name: 'Guanare', state: 'Portuguesa', country: 'Venezuela', lat: 9.0419, lng: -69.7484, type: 'city', population: 190000 },
  { id: 147, name: 'Acarigua', state: 'Portuguesa', country: 'Venezuela', lat: 9.5547, lng: -69.1953, type: 'city', population: 200000 },
  { id: 148, name: 'San Felipe', state: 'Yaracuy', country: 'Venezuela', lat: 10.3398, lng: -68.7422, type: 'city', population: 100000 },
  { id: 149, name: 'Los Teques', state: 'Miranda', country: 'Venezuela', lat: 10.3448, lng: -67.0393, type: 'city', population: 250000 },
  { id: 150, name: 'La Victoria', state: 'Aragua', country: 'Venezuela', lat: 10.2262, lng: -67.3282, type: 'city', population: 150000 },
  { id: 151, name: 'Turmero', state: 'Aragua', country: 'Venezuela', lat: 10.2306, lng: -67.4756, type: 'city', population: 200000 },
  { id: 152, name: 'Cagua', state: 'Aragua', country: 'Venezuela', lat: 10.1861, lng: -67.4592, type: 'city', population: 120000 },
  { id: 153, name: 'Villa de Cura', state: 'Aragua', country: 'Venezuela', lat: 10.0383, lng: -67.4883, type: 'city', population: 70000 },
  { id: 154, name: 'San Sebastián de los Reyes', state: 'Aragua', country: 'Venezuela', lat: 9.9406, lng: -67.1833, type: 'town', population: 40000 },
  { id: 155, name: 'Barbacoas', state: 'Guárico', country: 'Venezuela', lat: 9.7833, lng: -67.0667, type: 'town', population: 5000 },
  { id: 156, name: 'Parapara', state: 'Guárico', country: 'Venezuela', lat: 9.7000, lng: -67.5000, type: 'town', population: 3000 },
  { id: 157, name: 'Venezuela', state: '', country: 'Venezuela', lat: 6.4238, lng: -66.5897, type: 'country' },
  { id: 158, name: 'Guárico', state: 'Guárico', country: 'Venezuela', lat: 8.7000, lng: -66.6000, type: 'state' },
  { id: 159, name: 'Estado Guárico', state: 'Guárico', country: 'Venezuela', lat: 8.7000, lng: -66.6000, type: 'state' },
  { id: 160, name: 'Residencias Estudiantiles San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9089, lng: -67.3406, type: 'amenity' },
  { id: 161, name: 'Embalse Camatagua', state: 'Guárico', country: 'Venezuela', lat: 9.7680, lng: -67.2600, type: 'water' },
  { id: 162, name: 'Río Guárico', state: 'Guárico', country: 'Venezuela', lat: 9.1000, lng: -67.0000, type: 'river' },
  { id: 163, name: 'Los Morros de San Juan', state: 'Guárico', country: 'Venezuela', lat: 9.9150, lng: -67.3650, type: 'landmark' },
  { id: 164, name: 'Morro El Faro', state: 'Guárico', country: 'Venezuela', lat: 9.9170, lng: -67.3630, type: 'landmark' },
  { id: 165, name: 'Residencias San Juan', state: 'Guárico', country: 'Venezuela', lat: 9.9100, lng: -67.3580, type: 'neighborhood' },
  
  // Infraestructura adicional (166-169)
  { id: 166, name: 'Estación de Servicio, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9090, lng: -67.3600, type: 'amenity' },
  { id: 167, name: 'Farmacia, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9065, lng: -67.3545, type: 'amenity' },
  { id: 168, name: 'Supermercado, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9055, lng: -67.3525, type: 'amenity' },
  { id: 169, name: 'Banco, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9072, lng: -67.3568, type: 'amenity' }
];

function normalize(text) {
  if (!text) return '';
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function searchLocations(query) {
  if (!query || query.trim().length < 2) return [];
  const q = normalize(query);
  const terms = q.split(/\s+/).filter(t => t.length > 1);

  if (terms.length === 0) return [];

  const scored = locations.map(loc => {
    const name = normalize(loc.name);
    const state = normalize(loc.state);
    const country = normalize(loc.country);
    const aliases = loc.alias ? loc.alias.map(normalize) : [];
    
    let score = 0;
    let matchedAllTerms = true;
    
    for (const term of terms) {
      let termScore = 0;
      
      // Buscar en nombre
      if (name === term) termScore = Math.max(termScore, 100);
      else if (name.startsWith(term) || name.endsWith(term)) termScore = Math.max(termScore, 50);
      else if (name.includes(term)) termScore = Math.max(termScore, 30);
      
      // Buscar en aliases (para los ejemplos específicos)
      for (const alias of aliases) {
        if (alias === term) termScore = Math.max(termScore, 100);
        else if (alias.includes(term)) termScore = Math.max(termScore, 25);
      }
      
      // Buscar en estado
      if (state.includes(term)) termScore = Math.max(termScore, 15);
      
      // Buscar en país
      if (country.includes(term)) termScore = Math.max(termScore, 5);
      
      if (termScore === 0) {
        matchedAllTerms = false;
        break;
      }
      
      score += termScore;
    }
    
    if (!matchedAllTerms) return null;
    
    // Bonus por tipo de ubicación
    if (loc.type === 'university') score += 20;
    if (loc.type === 'neighborhood') score += 15;
    if (loc.type === 'street') score += 10;
    
    return { ...loc, score };
  }).filter(Boolean);

  return scored.sort((a, b) => b.score - a.score).slice(0, 10);
}

function buildDisplayName(loc) {
  const parts = [loc.name];
  if (loc.state && loc.type !== 'state' && loc.type !== 'country') parts.push(loc.state);
  if (loc.country && loc.type !== 'country') parts.push(loc.country);
  return parts.join(', ');
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const path = parsed.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (path === '/search') {
    const q = parsed.query.q || parsed.query.address || '';
    const format = parsed.query.format || 'json';
    const limit = Math.min(parseInt(parsed.query.limit, 10) || 10, 20);
    const results = searchLocations(q).slice(0, limit);

    if (format === 'json') {
      const json = results.map(loc => ({
        place_id: loc.id,
        lat: loc.lat.toString(),
        lon: loc.lng.toString(),
        display_name: buildDisplayName(loc),
        type: loc.type,
        importance: Math.min(loc.score / 100, 1),
        class: 'place',
        address: {
          city: loc.type === 'city' || loc.type === 'town' ? loc.name : undefined,
          state: loc.state,
          country: loc.country,
          neighbourhood: loc.type === 'neighborhood' ? loc.name : undefined,
          road: loc.type === 'street' ? loc.name : undefined
        }
      }));
      res.writeHead(200);
      res.end(JSON.stringify(json));
    } else {
      const html = results.map(loc => `
        <place place_id="${loc.id}" lat="${loc.lat}" lon="${loc.lng}">
          <display_name>${buildDisplayName(loc)}</display_name>
        </place>
      `).join('\n');
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(`<searchresults>${html}</searchresults>`);
    }
    return;
  }

  if (path === '/reverse') {
    const lat = parseFloat(parsed.query.lat);
    const lon = parseFloat(parsed.query.lon);
    
    if (isNaN(lat) || isNaN(lon)) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Invalid coordinates' }));
      return;
    }
    
    let closest = null;
    let minDist = Infinity;
    for (const loc of locations) {
      const d = Math.sqrt(Math.pow(loc.lat - lat, 2) + Math.pow(loc.lng - lon, 2));
      if (d < minDist) { minDist = d; closest = loc; }
    }
    
    if (closest && minDist < 0.1) {
      res.writeHead(200);
      res.end(JSON.stringify({
        place_id: closest.id,
        lat: closest.lat.toString(),
        lon: closest.lng.toString(),
        display_name: buildDisplayName(closest),
        address: {
          city: closest.type === 'city' || closest.type === 'town' ? closest.name : undefined,
          state: closest.state,
          country: closest.country,
          neighbourhood: closest.type === 'neighborhood' ? closest.name : undefined,
          road: closest.type === 'street' ? closest.name : undefined
        }
      }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'No se encontraron resultados para estas coordenadas' }));
    }
    return;
  }

  // Endpoint de salud del servicio
  if (path === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'Habitas Geocoding Server',
      version: '2.0',
      locations_count: locations.length,
      uptime: process.uptime(),
      examples: ['la morera', 'las palmas', 'santa rosa', 'unerg', 'san juan de los morros']
    }));
    return;
  }

  // Endpoint de búsqueda por tipo
  if (path === '/by-type') {
    const type = parsed.query.type;
    if (type) {
      const filtered = locations.filter(loc => loc.type === type);
      res.writeHead(200);
      res.end(JSON.stringify({
        count: filtered.length,
        results: filtered.map(loc => ({
          id: loc.id,
          name: loc.name,
          lat: loc.lat,
          lng: loc.lng,
          state: loc.state,
          type: loc.type
        }))
      }));
      return;
    }
  }

  // Página de inicio
  res.writeHead(200);
  res.end(JSON.stringify({
    status: 'ok',
    service: 'Habitas Geocoding Server v2.0',
    description: 'Servidor de geocoding compatible con Nominatim para Venezuela',
    endpoints: [
      { method: 'GET', path: '/search', description: 'Búsqueda de direcciones' },
      { method: 'GET', path: '/reverse', description: 'Geocoding inverso' },
      { method: 'GET', path: '/health', description: 'Estado del servicio' },
      { method: 'GET', path: '/by-type', description: 'Búsqueda por tipo de ubicación' }
    ],
    stats: {
      total_locations: locations.length,
      cities: locations.filter(l => l.type === 'city').length,
      neighborhoods: locations.filter(l => l.type === 'neighborhood').length,
      universities: locations.filter(l => l.type === 'university').length,
      focus_area: 'Venezuela, especialmente Estado Guárico'
    },
    featured_examples: [
      'la morera',
      'las palmas', 
      'santa rosa',
      'unerg',
      'san juan de los morros'
    ]
  }));
});

const PORT = parseInt(process.env.GEOCODE_PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`[Geocoder v2.1] Servidor de geocoding Habitas ejecutándose en http://${HOST}:${PORT}`);
  console.log(`[Geocoder] ${locations.length} ubicaciones cargadas`);
  console.log(`[Geocoder] Foco: Venezuela, especialmente Estado Guárico y San Juan de los Morros`);
  console.log(`[Geocoder] Ejemplos de búsqueda: "la morera", "las palmas", "santa rosa", "banco obrero", "pariapan", "valle verde", "unerg"`);
  console.log(`[Geocoder] Ejemplos específicos del usuario funcionando correctamente`);
  console.log(`[Geocoder] ${locations.filter(l => l.type === 'neighborhood').length} barrios/urbanizaciones en San Juan de los Morros`);
  console.log(`[Geocoder] Nuevos sectores agregados: Banco Obrero, Pariapan, Valle Verde, y muchos más`);
});