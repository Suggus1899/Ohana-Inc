const http = require('http');
const url = require('url');

const locations = [
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
  { id: 11, name: 'Guayabal', state: 'Guárico', country: 'Venezuela', lat: 8.5500, lng: -67.3333, type: 'town', population: 6000 },
  { id: 12, name: 'Camatagua', state: 'Guárico', country: 'Venezuela', lat: 9.7833, lng: -68.0667, type: 'town', population: 5000 },
  { id: 13, name: 'San José de Guaribe', state: 'Guárico', country: 'Venezuela', lat: 9.8667, lng: -65.8167, type: 'town', population: 5000 },
  { id: 14, name: 'Tucupido', state: 'Guárico', country: 'Venezuela', lat: 9.2833, lng: -65.7667, type: 'town', population: 4000 },
  { id: 15, name: 'Cazorla', state: 'Guárico', country: 'Venezuela', lat: 9.7000, lng: -66.3500, type: 'town', population: 3000 },
  { id: 16, name: 'Universidad Rómulo Gallegos (UNERG)', state: 'Guárico', country: 'Venezuela', lat: 9.9089, lng: -67.3406, type: 'university' },
  { id: 17, name: 'UNERG San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9089, lng: -67.3406, type: 'university' },
  { id: 18, name: 'Universidad Nacional Experimental Rómulo Gallegos', state: 'Guárico', country: 'Venezuela', lat: 9.9089, lng: -67.3406, type: 'university' },
  { id: 19, name: 'Núcleo UNERG', state: 'Guárico', country: 'Venezuela', lat: 9.9089, lng: -67.3406, type: 'university' },
  { id: 20, name: 'Avenida Bolívar, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9100, lng: -67.3600, type: 'street' },
  { id: 21, name: 'Avenida José Antonio Páez, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9095, lng: -67.3580, type: 'street' },
  { id: 22, name: 'Avenida Guárico, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9070, lng: -67.3570, type: 'street' },
  { id: 23, name: 'Avenida Universidad, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9090, lng: -67.3450, type: 'street' },
  { id: 24, name: 'Calle Independencia, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9060, lng: -67.3550, type: 'street' },
  { id: 25, name: 'Calle Comercio, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9050, lng: -67.3530, type: 'street' },
  { id: 26, name: 'Plaza Bolívar, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9070, lng: -67.3580, type: 'landmark' },
  { id: 27, name: 'Catedral San Juan Bautista, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9075, lng: -67.3585, type: 'landmark' },
  { id: 28, name: 'Hospital Israel Ranuárez, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9060, lng: -67.3610, type: 'hospital' },
  { id: 29, name: 'Mercado Municipal, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9040, lng: -67.3510, type: 'market' },
  { id: 30, name: 'Terminal de Pasajeros, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9020, lng: -67.3530, type: 'transport' },
  { id: 31, name: 'Aeropuerto San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.8970, lng: -67.3700, type: 'airport' },
  { id: 32, name: 'Parque Nacional Aguaro-Guariquito', state: 'Guárico', country: 'Venezuela', lat: 8.5000, lng: -67.0000, type: 'park' },
  { id: 33, name: 'Balneario La Pascua, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.8980, lng: -67.3500, type: 'landmark' },
  { id: 34, name: 'Urbanización Los Morros, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9120, lng: -67.3620, type: 'neighborhood' },
  { id: 35, name: 'Urbanización La Floresta, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9140, lng: -67.3550, type: 'neighborhood' },
  { id: 36, name: 'Urbanización Doña Bárbara, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9100, lng: -67.3500, type: 'neighborhood' },
  { id: 37, name: 'Barrio El Cambur, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9030, lng: -67.3560, type: 'neighborhood' },
  { id: 38, name: 'Barrio Sucre, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9080, lng: -67.3650, type: 'neighborhood' },
  { id: 39, name: 'Centro de San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9070, lng: -67.3570, type: 'neighborhood' },
  { id: 40, name: 'Caracas', state: 'Distrito Capital', country: 'Venezuela', lat: 10.4806, lng: -66.9036, type: 'city', population: 2500000 },
  { id: 41, name: 'Maracay', state: 'Aragua', country: 'Venezuela', lat: 10.2469, lng: -67.5958, type: 'city', population: 1200000 },
  { id: 42, name: 'Valencia', state: 'Carabobo', country: 'Venezuela', lat: 10.1801, lng: -68.0036, type: 'city', population: 1500000 },
  { id: 43, name: 'Barquisimeto', state: 'Lara', country: 'Venezuela', lat: 10.0739, lng: -69.3228, type: 'city', population: 1000000 },
  { id: 44, name: 'Ciudad Guayana', state: 'Bolívar', country: 'Venezuela', lat: 8.3536, lng: -62.6528, type: 'city', population: 750000 },
  { id: 45, name: 'Barcelona', state: 'Anzoátegui', country: 'Venezuela', lat: 10.1333, lng: -64.6833, type: 'city', population: 700000 },
  { id: 46, name: 'Maturín', state: 'Monagas', country: 'Venezuela', lat: 9.7458, lng: -63.1833, type: 'city', population: 500000 },
  { id: 47, name: 'Puerto La Cruz', state: 'Anzoátegui', country: 'Venezuela', lat: 10.2167, lng: -64.6167, type: 'city', population: 400000 },
  { id: 48, name: 'Tucupita', state: 'Delta Amacuro', country: 'Venezuela', lat: 9.0574, lng: -62.0499, type: 'city', population: 80000 },
  { id: 49, name: 'San Fernando de Apure', state: 'Apure', country: 'Venezuela', lat: 7.8877, lng: -67.4724, type: 'city', population: 175000 },
  { id: 50, name: 'San Carlos', state: 'Cojedes', country: 'Venezuela', lat: 9.6667, lng: -68.5833, type: 'city', population: 85000 },
  { id: 51, name: 'Guanare', state: 'Portuguesa', country: 'Venezuela', lat: 9.0419, lng: -69.7484, type: 'city', population: 190000 },
  { id: 52, name: 'Acarigua', state: 'Portuguesa', country: 'Venezuela', lat: 9.5547, lng: -69.1953, type: 'city', population: 200000 },
  { id: 53, name: 'San Felipe', state: 'Yaracuy', country: 'Venezuela', lat: 10.3398, lng: -68.7422, type: 'city', population: 100000 },
  { id: 54, name: 'Los Teques', state: 'Miranda', country: 'Venezuela', lat: 10.3448, lng: -67.0393, type: 'city', population: 250000 },
  { id: 55, name: 'La Victoria', state: 'Aragua', country: 'Venezuela', lat: 10.2262, lng: -67.3282, type: 'city', population: 150000 },
  { id: 56, name: 'Turmero', state: 'Aragua', country: 'Venezuela', lat: 10.2306, lng: -67.4756, type: 'city', population: 200000 },
  { id: 57, name: 'Cagua', state: 'Aragua', country: 'Venezuela', lat: 10.1861, lng: -67.4592, type: 'city', population: 120000 },
  { id: 58, name: 'Villa de Cura', state: 'Aragua', country: 'Venezuela', lat: 10.0383, lng: -67.4883, type: 'city', population: 70000 },
  { id: 59, name: 'San Sebastián de los Reyes', state: 'Aragua', country: 'Venezuela', lat: 9.9406, lng: -67.1833, type: 'town', population: 40000 },
  { id: 60, name: 'Barbacoas', state: 'Guárico', country: 'Venezuela', lat: 9.7833, lng: -67.0667, type: 'town', population: 5000 },
  { id: 61, name: 'Parapara', state: 'Guárico', country: 'Venezuela', lat: 9.7000, lng: -67.5000, type: 'town', population: 3000 },
  { id: 62, name: 'Venezuela', state: '', country: 'Venezuela', lat: 6.4238, lng: -66.5897, type: 'country' },
  { id: 63, name: 'Guárico', state: 'Guárico', country: 'Venezuela', lat: 8.7000, lng: -66.6000, type: 'state' },
  { id: 64, name: 'Estado Guárico', state: 'Guárico', country: 'Venezuela', lat: 8.7000, lng: -66.6000, type: 'state' },
  { id: 65, name: 'Residencias Estudiantiles San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9089, lng: -67.3406, type: 'amenity' },
  { id: 66, name: 'Embalse Camatagua', state: 'Guárico', country: 'Venezuela', lat: 9.7680, lng: -67.2600, type: 'water' },
  { id: 67, name: 'Río Guárico', state: 'Guárico', country: 'Venezuela', lat: 9.1000, lng: -67.0000, type: 'river' },
  { id: 68, name: 'Los Morros de San Juan', state: 'Guárico', country: 'Venezuela', lat: 9.9150, lng: -67.3650, type: 'landmark' },
  { id: 69, name: 'Morro El Faro', state: 'Guárico', country: 'Venezuela', lat: 9.9170, lng: -67.3630, type: 'landmark' },
  { id: 70, name: 'Residencias San Juan', state: 'Guárico', country: 'Venezuela', lat: 9.9100, lng: -67.3580, type: 'neighborhood' },
  { id: 71, name: 'La Morera', state: 'Guárico', country: 'Venezuela', lat: 9.8950, lng: -67.3450, type: 'neighborhood' },
  { id: 72, name: 'Las Palmas', state: 'Guárico', country: 'Venezuela', lat: 9.9150, lng: -67.3520, type: 'neighborhood' },
  { id: 73, name: 'Santa Rosa', state: 'Guárico', country: 'Venezuela', lat: 9.9000, lng: -67.3480, type: 'neighborhood' },
  { id: 74, name: 'Urbanización Las Palmas', state: 'Guárico', country: 'Venezuela', lat: 9.9160, lng: -67.3510, type: 'neighborhood' },
  { id: 75, name: 'Sector La Morera', state: 'Guárico', country: 'Venezuela', lat: 9.8940, lng: -67.3460, type: 'neighborhood' },
  { id: 76, name: 'Barrio Santa Rosa', state: 'Guárico', country: 'Venezuela', lat: 9.9010, lng: -67.3490, type: 'neighborhood' },
  { id: 77, name: 'Urbanización San Juan', state: 'Guárico', country: 'Venezuela', lat: 9.9120, lng: -67.3600, type: 'neighborhood' },
  { id: 78, name: 'Residencias Los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9130, lng: -67.3640, type: 'neighborhood' },
  { id: 79, name: 'Conjunto Residencial Los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9135, lng: -67.3630, type: 'neighborhood' },
  { id: 80, name: 'Urbanización San Miguel', state: 'Guárico', country: 'Venezuela', lat: 9.9180, lng: -67.3560, type: 'neighborhood' },
  { id: 81, name: 'Barrio San Miguel', state: 'Guárico', country: 'Venezuela', lat: 9.9170, lng: -67.3550, type: 'neighborhood' },
  { id: 82, name: 'El Castrero', state: 'Guárico', country: 'Venezuela', lat: 9.9200, lng: -67.3700, type: 'neighborhood' },
  { id: 83, name: 'Sector El Castrero', state: 'Guárico', country: 'Venezuela', lat: 9.9210, lng: -67.3710, type: 'neighborhood' },
  { id: 84, name: 'Parmana', state: 'Guárico', country: 'Venezuela', lat: 9.0500, lng: -67.3000, type: 'town' },
  { id: 85, name: 'Corozo Pando', state: 'Guárico', country: 'Venezuela', lat: 9.1500, lng: -67.4000, type: 'town' },
  { id: 86, name: 'El Rastro', state: 'Guárico', country: 'Venezuela', lat: 9.4167, lng: -67.4000, type: 'town' },
  { id: 87, name: 'San Francisco de Tiznados', state: 'Guárico', country: 'Venezuela', lat: 9.6500, lng: -67.8000, type: 'town' },
  { id: 88, name: 'Iguana', state: 'Guárico', country: 'Venezuela', lat: 8.9833, lng: -66.9000, type: 'town' },
  { id: 89, name: 'Lezama', state: 'Guárico', country: 'Venezuela', lat: 9.4500, lng: -67.1333, type: 'town' },
  { id: 90, name: 'Santa Rita de Manapire', state: 'Guárico', country: 'Venezuela', lat: 8.7000, lng: -66.3167, type: 'town' },
  { id: 91, name: 'El Socorro', state: 'Guárico', country: 'Venezuela', lat: 8.9833, lng: -65.7500, type: 'town' },
  { id: 92, name: 'Espino', state: 'Guárico', country: 'Venezuela', lat: 8.8500, lng: -65.7500, type: 'town' },
  { id: 93, name: 'San José de Tiznados', state: 'Guárico', country: 'Venezuela', lat: 9.6333, lng: -67.7333, type: 'town' },
  { id: 94, name: 'Avenida Bolívar, Calabozo', state: 'Guárico', country: 'Venezuela', lat: 8.9250, lng: -67.4300, type: 'street' },
  { id: 95, name: 'Avenida Industrial, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9080, lng: -67.3520, type: 'street' },
  { id: 96, name: 'Barrio El Chispero', state: 'Guárico', country: 'Venezuela', lat: 9.8980, lng: -67.3620, type: 'neighborhood' },
  { id: 97, name: 'El Chispero', state: 'Guárico', country: 'Venezuela', lat: 9.8980, lng: -67.3620, type: 'neighborhood' },
  { id: 98, name: 'Guamachal', state: 'Guárico', country: 'Venezuela', lat: 9.8850, lng: -67.3760, type: 'neighborhood' },
  { id: 99, name: 'Barrio Guamachal', state: 'Guárico', country: 'Venezuela', lat: 9.8850, lng: -67.3760, type: 'neighborhood' },
  { id: 100, name: 'La Ceiba, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9020, lng: -67.3700, type: 'neighborhood' },
  { id: 101, name: 'Sector La Ceiba', state: 'Guárico', country: 'Venezuela', lat: 9.9020, lng: -67.3700, type: 'neighborhood' },
  { id: 102, name: 'Las Acacias, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9110, lng: -67.3450, type: 'neighborhood' },
  { id: 103, name: 'Urbanización Las Acacias', state: 'Guárico', country: 'Venezuela', lat: 9.9110, lng: -67.3450, type: 'neighborhood' },
  { id: 104, name: 'El Samán, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9050, lng: -67.3480, type: 'neighborhood' },
  { id: 105, name: 'Urbanización El Samán', state: 'Guárico', country: 'Venezuela', lat: 9.9050, lng: -67.3480, type: 'neighborhood' },
  { id: 106, name: 'La Colina, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9180, lng: -67.3410, type: 'neighborhood' },
  { id: 107, name: 'Urbanización La Colina', state: 'Guárico', country: 'Venezuela', lat: 9.9180, lng: -67.3410, type: 'neighborhood' },
  { id: 108, name: 'El Rosario, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.8950, lng: -67.3550, type: 'neighborhood' },
  { id: 109, name: 'Urbanización El Rosario', state: 'Guárico', country: 'Venezuela', lat: 9.8950, lng: -67.3550, type: 'neighborhood' },
  { id: 110, name: 'Los Olivos, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9200, lng: -67.3470, type: 'neighborhood' },
  { id: 111, name: 'Urbanización Los Olivos', state: 'Guárico', country: 'Venezuela', lat: 9.9200, lng: -67.3470, type: 'neighborhood' },
  { id: 112, name: 'Brisas del Llano', state: 'Guárico', country: 'Venezuela', lat: 9.8960, lng: -67.3400, type: 'neighborhood' },
  { id: 113, name: 'Urbanización Brisas del Llano', state: 'Guárico', country: 'Venezuela', lat: 9.8960, lng: -67.3400, type: 'neighborhood' },
  { id: 114, name: 'San Antonio, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9030, lng: -67.3650, type: 'neighborhood' },
  { id: 115, name: 'Barrio San Antonio', state: 'Guárico', country: 'Venezuela', lat: 9.9030, lng: -67.3650, type: 'neighborhood' },
  { id: 116, name: 'Las Flores, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9010, lng: -67.3590, type: 'neighborhood' },
  { id: 117, name: 'Barrio Las Flores', state: 'Guárico', country: 'Venezuela', lat: 9.9010, lng: -67.3590, type: 'neighborhood' },
  { id: 118, name: 'Los Jabillos, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9140, lng: -67.3450, type: 'neighborhood' },
  { id: 119, name: 'Urbanización Los Jabillos', state: 'Guárico', country: 'Venezuela', lat: 9.9140, lng: -67.3450, type: 'neighborhood' },
  { id: 120, name: 'Cantarrana, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9220, lng: -67.3410, type: 'neighborhood' },
  { id: 121, name: 'Urbanización Cantarrana', state: 'Guárico', country: 'Venezuela', lat: 9.9220, lng: -67.3410, type: 'neighborhood' },
  { id: 122, name: '23 de Enero, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9100, lng: -67.3720, type: 'neighborhood' },
  { id: 123, name: 'Barrio 23 de Enero', state: 'Guárico', country: 'Venezuela', lat: 9.9100, lng: -67.3720, type: 'neighborhood' },
  { id: 124, name: '12 de Octubre, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9080, lng: -67.3700, type: 'neighborhood' },
  { id: 125, name: 'Barrio 12 de Octubre', state: 'Guárico', country: 'Venezuela', lat: 9.9080, lng: -67.3700, type: 'neighborhood' },
  { id: 126, name: 'Pueblo Nuevo, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9060, lng: -67.3420, type: 'neighborhood' },
  { id: 127, name: 'Las Delicias, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9130, lng: -67.3480, type: 'neighborhood' },
  { id: 128, name: 'Urbanización Las Delicias', state: 'Guárico', country: 'Venezuela', lat: 9.9130, lng: -67.3480, type: 'neighborhood' },
  { id: 129, name: 'Santa Eduvigis, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9170, lng: -67.3520, type: 'neighborhood' },
  { id: 130, name: 'Barrio Santa Eduvigis', state: 'Guárico', country: 'Venezuela', lat: 9.9170, lng: -67.3520, type: 'neighborhood' },
  { id: 131, name: 'La Guamita', state: 'Guárico', country: 'Venezuela', lat: 9.8920, lng: -67.3670, type: 'neighborhood' },
  { id: 132, name: 'La Coromoto, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.8950, lng: -67.3580, type: 'neighborhood' },
  { id: 133, name: 'El Recreo, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9000, lng: -67.3520, type: 'neighborhood' },
  { id: 134, name: 'Los Chorritos', state: 'Guárico', country: 'Venezuela', lat: 9.9110, lng: -67.3550, type: 'neighborhood' },
  { id: 135, name: 'Sector Los Chorritos', state: 'Guárico', country: 'Venezuela', lat: 9.9110, lng: -67.3550, type: 'neighborhood' },
  { id: 136, name: 'San Vicente, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9070, lng: -67.3470, type: 'neighborhood' },
  { id: 137, name: 'Barrio San Vicente', state: 'Guárico', country: 'Venezuela', lat: 9.9070, lng: -67.3470, type: 'neighborhood' },
  { id: 138, name: 'La Cruz, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9160, lng: -67.3660, type: 'neighborhood' },
  { id: 139, name: 'El Calvario, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.8860, lng: -67.3730, type: 'neighborhood' },
  { id: 140, name: 'Simón Bolívar, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9090, lng: -67.3750, type: 'neighborhood' },
  { id: 141, name: 'Barrio Simón Bolívar', state: 'Guárico', country: 'Venezuela', lat: 9.9090, lng: -67.3750, type: 'neighborhood' },
  { id: 142, name: 'El Carmen, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.8960, lng: -67.3500, type: 'neighborhood' },
  { id: 143, name: 'San José, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9120, lng: -67.3740, type: 'neighborhood' },
  { id: 144, name: 'Barrio San José', state: 'Guárico', country: 'Venezuela', lat: 9.9120, lng: -67.3740, type: 'neighborhood' },
  { id: 145, name: 'La Libertad, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9040, lng: -67.3780, type: 'neighborhood' },
  { id: 146, name: 'Las Américas, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.8990, lng: -67.3460, type: 'neighborhood' },
  { id: 147, name: 'Urbanización Las Américas', state: 'Guárico', country: 'Venezuela', lat: 9.8990, lng: -67.3460, type: 'neighborhood' },
  { id: 148, name: 'Avenida Fuerzas Armadas, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9070, lng: -67.3560, type: 'street' },
  { id: 149, name: 'Avenida Juan Germán Roscio, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9090, lng: -67.3540, type: 'street' },
  { id: 150, name: 'Avenida Libertador, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9060, lng: -67.3600, type: 'street' },
  { id: 151, name: 'Avenida San Juan', state: 'Guárico', country: 'Venezuela', lat: 9.9100, lng: -67.3490, type: 'street' },
  { id: 152, name: 'Avenida Caracas, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9050, lng: -67.3620, type: 'street' },
  { id: 153, name: 'Calle Miranda, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9070, lng: -67.3570, type: 'street' },
  { id: 154, name: 'Calle Páez, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9060, lng: -67.3560, type: 'street' },
  { id: 155, name: 'Calle Sucre, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9080, lng: -67.3590, type: 'street' },
  { id: 156, name: 'Calle Urdaneta, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9050, lng: -67.3590, type: 'street' },
  { id: 157, name: 'Avenida Los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9130, lng: -67.3610, type: 'street' },
  { id: 158, name: 'Calle Girardot, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9070, lng: -67.3580, type: 'street' },
  { id: 159, name: 'Calle Carabobo, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9090, lng: -67.3600, type: 'street' },
  { id: 160, name: 'Avenida Las Palmas, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9140, lng: -67.3500, type: 'street' },
  { id: 161, name: 'Avenida Los Llanos, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9110, lng: -67.3440, type: 'street' },
  { id: 162, name: 'Calle Vargas, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9060, lng: -67.3570, type: 'street' },
  { id: 163, name: 'Calle Rondón, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9080, lng: -67.3560, type: 'street' },
  { id: 164, name: 'Calle Ricaurte, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9070, lng: -67.3550, type: 'street' },
  { id: 165, name: 'Estadio Olímpico de San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9110, lng: -67.3400, type: 'landmark' },
  { id: 166, name: 'Parque La Bandera, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9160, lng: -67.3430, type: 'landmark' },
  { id: 167, name: 'Parque El Guárico', state: 'Guárico', country: 'Venezuela', lat: 9.9000, lng: -67.3540, type: 'landmark' },
  { id: 168, name: 'Hospital San Juan de Dios', state: 'Guárico', country: 'Venezuela', lat: 9.9090, lng: -67.3650, type: 'hospital' },
  { id: 169, name: 'Palacio de la Gobernación de Guárico', state: 'Guárico', country: 'Venezuela', lat: 9.9060, lng: -67.3570, type: 'government' },
  { id: 170, name: 'Gobernación de Guárico', state: 'Guárico', country: 'Venezuela', lat: 9.9060, lng: -67.3570, type: 'government' },
  { id: 171, name: 'Parque Ferial San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9130, lng: -67.3380, type: 'landmark' },
  { id: 172, name: 'Mercado Principal de San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9040, lng: -67.3520, type: 'market' },
  { id: 173, name: 'Polideportivo de San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9150, lng: -67.3370, type: 'landmark' },
  { id: 174, name: 'CDI San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9020, lng: -67.3630, type: 'hospital' },
  { id: 175, name: 'INIA San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9140, lng: -67.3580, type: 'government' },
  { id: 176, name: 'Estación de Servicio Los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9100, lng: -67.3590, type: 'landmark' },
  { id: 177, name: 'Sector Guamachal', state: 'Guárico', country: 'Venezuela', lat: 9.8850, lng: -67.3780, type: 'neighborhood' },
  { id: 178, name: 'Sector El Calvario', state: 'Guárico', country: 'Venezuela', lat: 9.8860, lng: -67.3740, type: 'neighborhood' },
  { id: 179, name: 'Barrio La Ceiba', state: 'Guárico', country: 'Venezuela', lat: 9.9025, lng: -67.3710, type: 'neighborhood' },
  { id: 180, name: 'Liceo José Félix Ribas, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9050, lng: -67.3600, type: 'school' },
  { id: 181, name: 'Liceo San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9060, lng: -67.3550, type: 'school' },
  { id: 182, name: 'Escuela Básica Los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9080, lng: -67.3530, type: 'school' },
  { id: 183, name: 'Plaza Los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9150, lng: -67.3620, type: 'landmark' },
  { id: 184, name: 'Plaza Bolívar de Calabozo', state: 'Guárico', country: 'Venezuela', lat: 8.9250, lng: -67.4280, type: 'landmark' },
  { id: 185, name: 'Aeropuerto de Calabozo', state: 'Guárico', country: 'Venezuela', lat: 8.9280, lng: -67.4350, type: 'airport' },
  { id: 186, name: 'Embalse de Guárico', state: 'Guárico', country: 'Venezuela', lat: 8.9000, lng: -67.0000, type: 'water' },
  { id: 187, name: 'Maracay, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9090, lng: -67.3580, type: 'neighborhood' },
  { id: 188, name: 'Barrio Maracay', state: 'Guárico', country: 'Venezuela', lat: 9.9090, lng: -67.3580, type: 'neighborhood' },
  { id: 189, name: 'Sector El Viñedo', state: 'Guárico', country: 'Venezuela', lat: 9.8970, lng: -67.3430, type: 'neighborhood' },
  { id: 190, name: 'Barrio San Juan de Dios', state: 'Guárico', country: 'Venezuela', lat: 9.9100, lng: -67.3660, type: 'neighborhood' },
  { id: 191, name: 'Calle Real de San Juan', state: 'Guárico', country: 'Venezuela', lat: 9.9060, lng: -67.3550, type: 'street' },
  { id: 192, name: 'Calle El Comercio, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9055, lng: -67.3540, type: 'street' },
  { id: 193, name: 'Sector Guamita Arriba', state: 'Guárico', country: 'Venezuela', lat: 9.8900, lng: -67.3650, type: 'neighborhood' },
  { id: 194, name: 'Sector Guamita Abajo', state: 'Guárico', country: 'Venezuela', lat: 9.8940, lng: -67.3690, type: 'neighborhood' },
  { id: 195, name: 'Barrio Guamita', state: 'Guárico', country: 'Venezuela', lat: 9.8930, lng: -67.3680, type: 'neighborhood' },
  { id: 196, name: 'Sector El Faro', state: 'Guárico', country: 'Venezuela', lat: 9.9175, lng: -67.3635, type: 'neighborhood' },
  { id: 197, name: 'Residencias Doña Bárbara', state: 'Guárico', country: 'Venezuela', lat: 9.9105, lng: -67.3505, type: 'neighborhood' },
  { id: 198, name: 'Urbanización Doña Bárbara II', state: 'Guárico', country: 'Venezuela', lat: 9.9110, lng: -67.3490, type: 'neighborhood' },
  { id: 199, name: 'Conjunto Residencial La Floresta', state: 'Guárico', country: 'Venezuela', lat: 9.9150, lng: -67.3530, type: 'neighborhood' },
  { id: 200, name: 'Barrio El Recreo II', state: 'Guárico', country: 'Venezuela', lat: 9.8990, lng: -67.3510, type: 'neighborhood' },
  { id: 201, name: 'Sector La Guamita Alta', state: 'Guárico', country: 'Venezuela', lat: 9.8880, lng: -67.3640, type: 'neighborhood' },
  { id: 202, name: 'Pueblo Nuevo Sur', state: 'Guárico', country: 'Venezuela', lat: 9.9040, lng: -67.3410, type: 'neighborhood' },
  { id: 203, name: 'Sector Brisas del Llano II', state: 'Guárico', country: 'Venezuela', lat: 9.8970, lng: -67.3390, type: 'neighborhood' },
  { id: 204, name: 'Los Morros II', state: 'Guárico', country: 'Venezuela', lat: 9.9160, lng: -67.3680, type: 'neighborhood' },
  { id: 205, name: 'Calle 5 de Julio, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9080, lng: -67.3540, type: 'street' },
  { id: 206, name: 'Calle 19 de Abril, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9070, lng: -67.3545, type: 'street' },
  { id: 207, name: 'Puente Real, San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9040, lng: -67.3500, type: 'landmark' },
  { id: 208, name: 'Iglesia San Juan Bautista', state: 'Guárico', country: 'Venezuela', lat: 9.9075, lng: -67.3580, type: 'church' },
  { id: 209, name: 'Catedral de San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9075, lng: -67.3585, type: 'church' },
  { id: 210, name: 'Iglesia El Carmen', state: 'Guárico', country: 'Venezuela', lat: 9.8960, lng: -67.3505, type: 'church' },
  { id: 211, name: 'Iglesia Santa Eduvigis', state: 'Guárico', country: 'Venezuela', lat: 9.9175, lng: -67.3525, type: 'church' },
  { id: 212, name: 'Capilla San Vicente', state: 'Guárico', country: 'Venezuela', lat: 9.9075, lng: -67.3475, type: 'church' },
  { id: 213, name: 'Iglesia San José', state: 'Guárico', country: 'Venezuela', lat: 9.9125, lng: -67.3745, type: 'church' },
  { id: 214, name: 'Redoma Los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9160, lng: -67.3640, type: 'landmark' },
  { id: 215, name: 'Redoma de San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9140, lng: -67.3600, type: 'landmark' },
  { id: 216, name: 'Distribuidor San Juan', state: 'Guárico', country: 'Venezuela', lat: 9.9130, lng: -67.3590, type: 'landmark' },
  { id: 217, name: 'Urbanización Las Flores', state: 'Guárico', country: 'Venezuela', lat: 9.9000, lng: -67.3580, type: 'neighborhood' },
  { id: 218, name: 'Sector Los Chaguaramos', state: 'Guárico', country: 'Venezuela', lat: 9.9190, lng: -67.3460, type: 'neighborhood' },
  { id: 219, name: 'Sector El Progreso', state: 'Guárico', country: 'Venezuela', lat: 9.9040, lng: -67.3660, type: 'neighborhood' },
  { id: 220, name: 'Barrio El Progreso', state: 'Guárico', country: 'Venezuela', lat: 9.9040, lng: -67.3660, type: 'neighborhood' },
  { id: 221, name: 'Sector La Haciendita', state: 'Guárico', country: 'Venezuela', lat: 9.8990, lng: -67.3700, type: 'neighborhood' },
  { id: 222, name: 'Sector Banco Obrero', state: 'Guárico', country: 'Venezuela', lat: 9.9100, lng: -67.3560, type: 'neighborhood' },
  { id: 223, name: 'Barrio Banco Obrero', state: 'Guárico', country: 'Venezuela', lat: 9.9100, lng: -67.3560, type: 'neighborhood' },
  { id: 224, name: 'Sector La Lucha', state: 'Guárico', country: 'Venezuela', lat: 9.9020, lng: -67.3560, type: 'neighborhood' },
  { id: 225, name: 'Sector San Antonio Abajo', state: 'Guárico', country: 'Venezuela', lat: 9.9010, lng: -67.3660, type: 'neighborhood' },
  { id: 226, name: 'Sector San Antonio Arriba', state: 'Guárico', country: 'Venezuela', lat: 9.9050, lng: -67.3670, type: 'neighborhood' },
  { id: 227, name: 'Sector La Laguna', state: 'Guárico', country: 'Venezuela', lat: 9.9000, lng: -67.3500, type: 'neighborhood' },
  { id: 228, name: 'Sector Andrés Eloy Blanco', state: 'Guárico', country: 'Venezuela', lat: 9.8950, lng: -67.3610, type: 'neighborhood' },
  { id: 229, name: 'Barrio Andrés Eloy Blanco', state: 'Guárico', country: 'Venezuela', lat: 9.8950, lng: -67.3610, type: 'neighborhood' },
  { id: 230, name: 'Urbanización Andrés Eloy Blanco', state: 'Guárico', country: 'Venezuela', lat: 9.8950, lng: -67.3610, type: 'neighborhood' },
  { id: 231, name: 'Sector Las Palmas II', state: 'Guárico', country: 'Venezuela', lat: 9.9165, lng: -67.3500, type: 'neighborhood' },
  { id: 232, name: 'Sector Los Morritos', state: 'Guárico', country: 'Venezuela', lat: 9.9200, lng: -67.3620, type: 'neighborhood' },
  { id: 233, name: 'Barrio San Juan de los Morros Centro', state: 'Guárico', country: 'Venezuela', lat: 9.9070, lng: -67.3575, type: 'neighborhood' },
  { id: 234, name: 'Casco Central de San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9070, lng: -67.3575, type: 'neighborhood' },
  { id: 235, name: 'Museo de Los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9140, lng: -67.3630, type: 'landmark' },
  { id: 236, name: 'Concha Acústica de San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9120, lng: -67.3410, type: 'landmark' },
  { id: 237, name: 'Banco Central de Venezuela - San Juan', state: 'Guárico', country: 'Venezuela', lat: 9.9070, lng: -67.3570, type: 'landmark' },
  { id: 238, name: 'Hotel Los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9090, lng: -67.3570, type: 'hotel' },
  { id: 239, name: 'Hotel Venetur San Juan', state: 'Guárico', country: 'Venezuela', lat: 9.9080, lng: -67.3550, type: 'hotel' },
  { id: 240, name: 'Posada Los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9110, lng: -67.3610, type: 'hotel' },
  { id: 241, name: 'Centro Comercial Los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9130, lng: -67.3620, type: 'landmark' },
  { id: 242, name: 'Centro Comercial San Juan', state: 'Guárico', country: 'Venezuela', lat: 9.9090, lng: -67.3560, type: 'landmark' },
  { id: 243, name: 'Abasto San Juan', state: 'Guárico', country: 'Venezuela', lat: 9.9060, lng: -67.3580, type: 'landmark' },
  { id: 244, name: 'Mercado Municipal de San Juan', state: 'Guárico', country: 'Venezuela', lat: 9.9040, lng: -67.3510, type: 'market' },
  { id: 245, name: 'Zona Industrial San Juan de los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9200, lng: -67.3400, type: 'industrial' },
  { id: 246, name: 'Zona Industrial', state: 'Guárico', country: 'Venezuela', lat: 9.9200, lng: -67.3400, type: 'industrial' },
  { id: 247, name: 'Urbanización Industrial', state: 'Guárico', country: 'Venezuela', lat: 9.9200, lng: -67.3400, type: 'industrial' },
  { id: 248, name: 'Sector Industrial Los Morros', state: 'Guárico', country: 'Venezuela', lat: 9.9200, lng: -67.3400, type: 'industrial' },
  { id: 249, name: 'Maracay', state: 'Aragua', country: 'Venezuela', lat: 10.2469, lng: -67.5958, type: 'city' },
  { id: 250, name: 'El Limón, Maracay', state: 'Aragua', country: 'Venezuela', lat: 10.2980, lng: -67.6500, type: 'town' },
  { id: 251, name: 'Santa Rita, Maracay', state: 'Aragua', country: 'Venezuela', lat: 10.2500, lng: -67.5500, type: 'town' },
  { id: 252, name: 'Palo Negro, Maracay', state: 'Aragua', country: 'Venezuela', lat: 10.1710, lng: -67.5600, type: 'town' },
  { id: 253, name: 'San Mateo, Maracay', state: 'Aragua', country: 'Venezuela', lat: 10.2010, lng: -67.4600, type: 'town' },
  { id: 254, name: 'Las Tejerías', state: 'Aragua', country: 'Venezuela', lat: 10.2480, lng: -67.1700, type: 'town' },
  { id: 255, name: 'Colonia Tovar', state: 'Aragua', country: 'Venezuela', lat: 10.4100, lng: -67.2900, type: 'town' },
  { id: 256, name: 'Ocumare de la Costa', state: 'Aragua', country: 'Venezuela', lat: 10.4600, lng: -67.7700, type: 'town' },
  { id: 257, name: 'Choroní', state: 'Aragua', country: 'Venezuela', lat: 10.5100, lng: -67.6100, type: 'town' },
  { id: 258, name: 'Caracas', state: 'Distrito Capital', country: 'Venezuela', lat: 10.4806, lng: -66.9036, type: 'city' },
  { id: 259, name: 'El Hatillo', state: 'Miranda', country: 'Venezuela', lat: 10.4300, lng: -66.8200, type: 'town' },
  { id: 260, name: 'Petare', state: 'Miranda', country: 'Venezuela', lat: 10.4750, lng: -66.8100, type: 'neighborhood' },
  { id: 261, name: 'Chacao', state: 'Miranda', country: 'Venezuela', lat: 10.4960, lng: -66.8500, type: 'neighborhood' },
  { id: 262, name: 'Baruta', state: 'Miranda', country: 'Venezuela', lat: 10.4700, lng: -66.8700, type: 'neighborhood' },
  { id: 263, name: 'El Paraíso, Caracas', state: 'Distrito Capital', country: 'Venezuela', lat: 10.4900, lng: -66.9300, type: 'neighborhood' },
  { id: 264, name: 'Sabana Grande, Caracas', state: 'Distrito Capital', country: 'Venezuela', lat: 10.4970, lng: -66.8520, type: 'neighborhood' },
  { id: 265, name: 'La Candelaria, Caracas', state: 'Distrito Capital', country: 'Venezuela', lat: 10.5010, lng: -66.9000, type: 'neighborhood' },
  { id: 266, name: 'Los Chaguaramos, Caracas', state: 'Distrito Capital', country: 'Venezuela', lat: 10.4870, lng: -66.8760, type: 'neighborhood' },
  { id: 267, name: 'Altamira, Caracas', state: 'Miranda', country: 'Venezuela', lat: 10.5090, lng: -66.8500, type: 'neighborhood' },
  { id: 268, name: 'Los Palos Grandes, Caracas', state: 'Miranda', country: 'Venezuela', lat: 10.5060, lng: -66.8400, type: 'neighborhood' },
  { id: 269, name: 'Valencia', state: 'Carabobo', country: 'Venezuela', lat: 10.1801, lng: -68.0036, type: 'city' },
  { id: 270, name: 'Naguanagua', state: 'Carabobo', country: 'Venezuela', lat: 10.2500, lng: -68.0200, type: 'town' },
  { id: 271, name: 'Puerto Cabello', state: 'Carabobo', country: 'Venezuela', lat: 10.4730, lng: -68.0120, type: 'city' },
  { id: 272, name: 'Guacara', state: 'Carabobo', country: 'Venezuela', lat: 10.2260, lng: -67.8790, type: 'city' },
  { id: 273, name: 'San Diego, Valencia', state: 'Carabobo', country: 'Venezuela', lat: 10.2350, lng: -67.9600, type: 'town' },
  { id: 274, name: 'Los Guayos', state: 'Carabobo', country: 'Venezuela', lat: 10.1900, lng: -67.9200, type: 'town' },
  { id: 275, name: 'Mariara', state: 'Carabobo', country: 'Venezuela', lat: 10.2980, lng: -67.7200, type: 'town' },
  { id: 276, name: 'Barquisimeto', state: 'Lara', country: 'Venezuela', lat: 10.0739, lng: -69.3228, type: 'city' },
  { id: 277, name: 'Cabudare', state: 'Lara', country: 'Venezuela', lat: 10.0230, lng: -69.2700, type: 'town' },
  { id: 278, name: 'Quíbor', state: 'Lara', country: 'Venezuela', lat: 9.9290, lng: -69.6200, type: 'town' },
  { id: 279, name: 'El Tocuyo', state: 'Lara', country: 'Venezuela', lat: 9.7890, lng: -69.7800, type: 'town' },
  { id: 280, name: 'Carora', state: 'Lara', country: 'Venezuela', lat: 10.1760, lng: -70.0800, type: 'city' },
  { id: 281, name: 'Duaca', state: 'Lara', country: 'Venezuela', lat: 10.2900, lng: -69.1700, type: 'town' },
  { id: 282, name: 'Maracaibo', state: 'Zulia', country: 'Venezuela', lat: 10.6545, lng: -71.6580, type: 'city' },
  { id: 283, name: 'San Francisco, Maracaibo', state: 'Zulia', country: 'Venezuela', lat: 10.5600, lng: -71.6500, type: 'town' },
  { id: 284, name: 'Cabimas', state: 'Zulia', country: 'Venezuela', lat: 10.3870, lng: -71.4520, type: 'city' },
  { id: 285, name: 'Ciudad Ojeda', state: 'Zulia', country: 'Venezuela', lat: 10.2080, lng: -71.3000, type: 'city' },
  { id: 286, name: 'Lagunillas', state: 'Zulia', country: 'Venezuela', lat: 10.1400, lng: -71.2600, type: 'town' },
  { id: 287, name: 'Machiques', state: 'Zulia', country: 'Venezuela', lat: 10.0600, lng: -72.5500, type: 'town' },
  { id: 288, name: 'Santa Bárbara del Zulia', state: 'Zulia', country: 'Venezuela', lat: 8.9900, lng: -71.9300, type: 'town' },
  { id: 289, name: 'La Cañada de Urdaneta', state: 'Zulia', country: 'Venezuela', lat: 10.5200, lng: -71.7300, type: 'town' },
  { id: 290, name: 'Villa del Rosario', state: 'Zulia', country: 'Venezuela', lat: 10.3200, lng: -72.3100, type: 'town' },
  { id: 291, name: 'Caja Seca', state: 'Zulia', country: 'Venezuela', lat: 9.2300, lng: -71.0200, type: 'town' },
  { id: 292, name: 'Mérida', state: 'Mérida', country: 'Venezuela', lat: 8.5900, lng: -71.1400, type: 'city' },
  { id: 293, name: 'Ejido, Mérida', state: 'Mérida', country: 'Venezuela', lat: 8.5450, lng: -71.2400, type: 'town' },
  { id: 294, name: 'El Vigía', state: 'Mérida', country: 'Venezuela', lat: 8.6200, lng: -71.6500, type: 'town' },
  { id: 295, name: 'Tovar, Mérida', state: 'Mérida', country: 'Venezuela', lat: 8.3300, lng: -71.7600, type: 'town' },
  { id: 296, name: 'Mucuchíes', state: 'Mérida', country: 'Venezuela', lat: 8.7500, lng: -70.9100, type: 'town' },
  { id: 297, name: 'Apartaderos, Mérida', state: 'Mérida', country: 'Venezuela', lat: 8.7800, lng: -70.8800, type: 'town' },
  { id: 298, name: 'San Cristóbal', state: 'Táchira', country: 'Venezuela', lat: 7.7710, lng: -72.2250, type: 'city' },
  { id: 299, name: 'Táriba', state: 'Táchira', country: 'Venezuela', lat: 7.8200, lng: -72.2200, type: 'town' },
  { id: 300, name: 'San Antonio del Táchira', state: 'Táchira', country: 'Venezuela', lat: 7.8130, lng: -72.4430, type: 'town' },
  { id: 301, name: 'Rubio', state: 'Táchira', country: 'Venezuela', lat: 7.7000, lng: -72.3500, type: 'town' },
  { id: 302, name: 'La Grita', state: 'Táchira', country: 'Venezuela', lat: 8.1310, lng: -71.9810, type: 'town' },
  { id: 303, name: 'Colón, Táchira', state: 'Táchira', country: 'Venezuela', lat: 8.0550, lng: -72.2700, type: 'town' },
  { id: 304, name: 'Ciudad Bolívar', state: 'Bolívar', country: 'Venezuela', lat: 8.1200, lng: -63.5500, type: 'city' },
  { id: 305, name: 'Ciudad Guayana', state: 'Bolívar', country: 'Venezuela', lat: 8.3536, lng: -62.6528, type: 'city' },
  { id: 306, name: 'Puerto Ordaz', state: 'Bolívar', country: 'Venezuela', lat: 8.3200, lng: -62.7100, type: 'town' },
  { id: 307, name: 'San Félix, Ciudad Guayana', state: 'Bolívar', country: 'Venezuela', lat: 8.3470, lng: -62.7000, type: 'town' },
  { id: 308, name: 'Upata', state: 'Bolívar', country: 'Venezuela', lat: 8.0090, lng: -62.4000, type: 'town' },
  { id: 309, name: 'Caicara del Orinoco', state: 'Bolívar', country: 'Venezuela', lat: 7.6300, lng: -66.1600, type: 'town' },
  { id: 310, name: 'Santa Elena de Uairén', state: 'Bolívar', country: 'Venezuela', lat: 4.6000, lng: -61.1100, type: 'town' },
  { id: 311, name: 'Canaima', state: 'Bolívar', country: 'Venezuela', lat: 6.2300, lng: -62.8500, type: 'town' },
  { id: 312, name: 'Maturín', state: 'Monagas', country: 'Venezuela', lat: 9.7458, lng: -63.1833, type: 'city' },
  { id: 313, name: 'Punta de Mata', state: 'Monagas', country: 'Venezuela', lat: 9.6700, lng: -63.6100, type: 'town' },
  { id: 314, name: 'Temblador', state: 'Monagas', country: 'Venezuela', lat: 9.0100, lng: -62.6100, type: 'town' },
  { id: 315, name: 'Cumaná', state: 'Sucre', country: 'Venezuela', lat: 10.4600, lng: -64.1700, type: 'city' },
  { id: 316, name: 'Carúpano', state: 'Sucre', country: 'Venezuela', lat: 10.6700, lng: -63.2500, type: 'city' },
  { id: 317, name: 'El Pilar, Sucre', state: 'Sucre', country: 'Venezuela', lat: 10.5500, lng: -63.1500, type: 'town' },
  { id: 318, name: 'Barcelona', state: 'Anzoátegui', country: 'Venezuela', lat: 10.1333, lng: -64.6833, type: 'city' },
  { id: 319, name: 'Puerto La Cruz', state: 'Anzoátegui', country: 'Venezuela', lat: 10.2167, lng: -64.6167, type: 'city' },
  { id: 320, name: 'Lechería', state: 'Anzoátegui', country: 'Venezuela', lat: 10.1950, lng: -64.6950, type: 'town' },
  { id: 321, name: 'Anaco', state: 'Anzoátegui', country: 'Venezuela', lat: 9.4300, lng: -64.4700, type: 'city' },
  { id: 322, name: 'El Tigre', state: 'Anzoátegui', country: 'Venezuela', lat: 8.8870, lng: -64.2550, type: 'city' },
  { id: 323, name: 'Cantaura', state: 'Anzoátegui', country: 'Venezuela', lat: 9.3100, lng: -64.3600, type: 'town' },
  { id: 324, name: 'Píritu, Anzoátegui', state: 'Anzoátegui', country: 'Venezuela', lat: 10.0600, lng: -65.0400, type: 'town' },
  { id: 325, name: 'San Tomé', state: 'Anzoátegui', country: 'Venezuela', lat: 8.9500, lng: -64.1500, type: 'town' },
  { id: 326, name: 'Tucupita', state: 'Delta Amacuro', country: 'Venezuela', lat: 9.0574, lng: -62.0499, type: 'city' },
  { id: 327, name: 'San Fernando de Apure', state: 'Apure', country: 'Venezuela', lat: 7.8877, lng: -67.4724, type: 'city' },
  { id: 328, name: 'Guasdualito', state: 'Apure', country: 'Venezuela', lat: 7.2450, lng: -70.7300, type: 'town' },
  { id: 329, name: 'Achaguas', state: 'Apure', country: 'Venezuela', lat: 7.7700, lng: -68.2200, type: 'town' },
  { id: 330, name: 'Elorza', state: 'Apure', country: 'Venezuela', lat: 7.0600, lng: -69.5000, type: 'town' },
  { id: 331, name: 'Birúa', state: 'Apure', country: 'Venezuela', lat: 7.9100, lng: -67.5600, type: 'town' },
  { id: 332, name: 'San Carlos', state: 'Cojedes', country: 'Venezuela', lat: 9.6667, lng: -68.5833, type: 'city' },
  { id: 333, name: 'Tinaquillo', state: 'Cojedes', country: 'Venezuela', lat: 9.9200, lng: -68.3100, type: 'town' },
  { id: 334, name: 'Las Vegas, Cojedes', state: 'Cojedes', country: 'Venezuela', lat: 9.7000, lng: -68.3400, type: 'town' },
  { id: 335, name: 'Guanare', state: 'Portuguesa', country: 'Venezuela', lat: 9.0419, lng: -69.7484, type: 'city' },
  { id: 336, name: 'Acarigua', state: 'Portuguesa', country: 'Venezuela', lat: 9.5547, lng: -69.1953, type: 'city' },
  { id: 337, name: 'Araure', state: 'Portuguesa', country: 'Venezuela', lat: 9.5570, lng: -69.2300, type: 'town' },
  { id: 338, name: 'Píritu, Portuguesa', state: 'Portuguesa', country: 'Venezuela', lat: 9.3700, lng: -69.2000, type: 'town' },
  { id: 339, name: 'Ospino', state: 'Portuguesa', country: 'Venezuela', lat: 9.3000, lng: -69.0200, type: 'town' },
  { id: 340, name: 'Villa Bruzual', state: 'Portuguesa', country: 'Venezuela', lat: 9.3400, lng: -69.1200, type: 'town' },
  { id: 341, name: 'San Felipe', state: 'Yaracuy', country: 'Venezuela', lat: 10.3398, lng: -68.7422, type: 'city' },
  { id: 342, name: 'Yaritagua', state: 'Yaracuy', country: 'Venezuela', lat: 10.0800, lng: -69.1400, type: 'town' },
  { id: 343, name: 'Chivacoa', state: 'Yaracuy', country: 'Venezuela', lat: 10.1600, lng: -68.8700, type: 'town' },
  { id: 344, name: 'Aroa', state: 'Yaracuy', country: 'Venezuela', lat: 10.4300, lng: -68.8900, type: 'town' },
  { id: 345, name: 'Cocorote', state: 'Yaracuy', country: 'Venezuela', lat: 10.3100, lng: -68.7800, type: 'town' },
  { id: 346, name: 'Los Teques', state: 'Miranda', country: 'Venezuela', lat: 10.3448, lng: -67.0393, type: 'city' },
  { id: 347, name: 'Charallave', state: 'Miranda', country: 'Venezuela', lat: 10.2430, lng: -66.8600, type: 'town' },
  { id: 348, name: 'Santa Teresa del Tuy', state: 'Miranda', country: 'Venezuela', lat: 10.2300, lng: -66.6700, type: 'town' },
  { id: 349, name: 'Ocumare del Tuy', state: 'Miranda', country: 'Venezuela', lat: 10.1100, lng: -66.7800, type: 'town' },
  { id: 350, name: 'Cúa', state: 'Miranda', country: 'Venezuela', lat: 10.1600, lng: -66.8900, type: 'town' },
  { id: 351, name: 'Guarenas', state: 'Miranda', country: 'Venezuela', lat: 10.4700, lng: -66.6100, type: 'city' },
  { id: 352, name: 'Guatire', state: 'Miranda', country: 'Venezuela', lat: 10.4700, lng: -66.5400, type: 'town' },
  { id: 353, name: 'Higuerote', state: 'Miranda', country: 'Venezuela', lat: 10.4900, lng: -66.1000, type: 'town' },
  { id: 354, name: 'Río Chico, Miranda', state: 'Miranda', country: 'Venezuela', lat: 10.3200, lng: -65.9800, type: 'town' },
  { id: 355, name: 'La Victoria', state: 'Aragua', country: 'Venezuela', lat: 10.2262, lng: -67.3282, type: 'city' },
  { id: 356, name: 'Turmero', state: 'Aragua', country: 'Venezuela', lat: 10.2306, lng: -67.4756, type: 'city' },
  { id: 357, name: 'Cagua', state: 'Aragua', country: 'Venezuela', lat: 10.1861, lng: -67.4592, type: 'city' },
  { id: 358, name: 'Villa de Cura', state: 'Aragua', country: 'Venezuela', lat: 10.0383, lng: -67.4883, type: 'city' },
  { id: 359, name: 'San Sebastián de los Reyes', state: 'Aragua', country: 'Venezuela', lat: 9.9406, lng: -67.1833, type: 'town' },
  { id: 360, name: 'Barbacoas', state: 'Guárico', country: 'Venezuela', lat: 9.7833, lng: -67.0667, type: 'town' },
  { id: 361, name: 'Parapara', state: 'Guárico', country: 'Venezuela', lat: 9.7000, lng: -67.5000, type: 'town' },
  { id: 362, name: 'Camatagua', state: 'Guárico', country: 'Venezuela', lat: 9.7889, lng: -66.9083, type: 'town' },
  { id: 363, name: 'Venezuela', state: '', country: 'Venezuela', lat: 6.4238, lng: -66.5897, type: 'country' },
  { id: 364, name: 'Guárico', state: 'Guárico', country: 'Venezuela', lat: 8.7000, lng: -66.6000, type: 'state' },
  { id: 365, name: 'Estado Guárico', state: 'Guárico', country: 'Venezuela', lat: 8.7000, lng: -66.6000, type: 'state' },
  { id: 366, name: 'Estado Aragua', state: 'Aragua', country: 'Venezuela', lat: 9.8500, lng: -67.2000, type: 'state' },
  { id: 367, name: 'Aragua', state: 'Aragua', country: 'Venezuela', lat: 9.8500, lng: -67.2000, type: 'state' },
  { id: 368, name: 'Carabobo', state: 'Carabobo', country: 'Venezuela', lat: 10.2000, lng: -68.0000, type: 'state' },
  { id: 369, name: 'Estado Carabobo', state: 'Carabobo', country: 'Venezuela', lat: 10.2000, lng: -68.0000, type: 'state' },
  { id: 370, name: 'Lara', state: 'Lara', country: 'Venezuela', lat: 10.0700, lng: -69.3200, type: 'state' },
  { id: 371, name: 'Estado Lara', state: 'Lara', country: 'Venezuela', lat: 10.0700, lng: -69.3200, type: 'state' },
  { id: 372, name: 'Zulia', state: 'Zulia', country: 'Venezuela', lat: 10.6500, lng: -71.6500, type: 'state' },
  { id: 373, name: 'Estado Zulia', state: 'Zulia', country: 'Venezuela', lat: 10.6500, lng: -71.6500, type: 'state' },
  { id: 374, name: 'Mérida (Estado)', state: 'Mérida', country: 'Venezuela', lat: 8.5900, lng: -71.1400, type: 'state' },
  { id: 375, name: 'Táchira', state: 'Táchira', country: 'Venezuela', lat: 7.7700, lng: -72.2200, type: 'state' },
  { id: 376, name: 'Estado Táchira', state: 'Táchira', country: 'Venezuela', lat: 7.7700, lng: -72.2200, type: 'state' },
  { id: 377, name: 'Bolívar (Estado)', state: 'Bolívar', country: 'Venezuela', lat: 7.1300, lng: -64.3500, type: 'state' },
  { id: 378, name: 'Monagas', state: 'Monagas', country: 'Venezuela', lat: 9.7400, lng: -63.1800, type: 'state' },
  { id: 379, name: 'Estado Monagas', state: 'Monagas', country: 'Venezuela', lat: 9.7400, lng: -63.1800, type: 'state' },
  { id: 380, name: 'Anzoátegui', state: 'Anzoátegui', country: 'Venezuela', lat: 9.5000, lng: -64.0000, type: 'state' },
  { id: 381, name: 'Estado Anzoátegui', state: 'Anzoátegui', country: 'Venezuela', lat: 9.5000, lng: -64.0000, type: 'state' },
  { id: 382, name: 'Sucre (Estado)', state: 'Sucre', country: 'Venezuela', lat: 10.4600, lng: -63.5000, type: 'state' },
  { id: 383, name: 'Miranda (Estado)', state: 'Miranda', country: 'Venezuela', lat: 10.2500, lng: -66.4300, type: 'state' },
  { id: 384, name: 'Distrito Capital', state: 'Distrito Capital', country: 'Venezuela', lat: 10.4800, lng: -66.9000, type: 'state' },
  { id: 385, name: 'Apure', state: 'Apure', country: 'Venezuela', lat: 7.8800, lng: -67.4700, type: 'state' },
  { id: 386, name: 'Estado Apure', state: 'Apure', country: 'Venezuela', lat: 7.8800, lng: -67.4700, type: 'state' },
  { id: 387, name: 'Portuguesa', state: 'Portuguesa', country: 'Venezuela', lat: 9.0400, lng: -69.7500, type: 'state' },
  { id: 388, name: 'Estado Portuguesa', state: 'Portuguesa', country: 'Venezuela', lat: 9.0400, lng: -69.7500, type: 'state' },
  { id: 389, name: 'Cojedes', state: 'Cojedes', country: 'Venezuela', lat: 9.6600, lng: -68.5800, type: 'state' },
  { id: 390, name: 'Estado Cojedes', state: 'Cojedes', country: 'Venezuela', lat: 9.6600, lng: -68.5800, type: 'state' },
  { id: 391, name: 'Yaracuy', state: 'Yaracuy', country: 'Venezuela', lat: 10.3400, lng: -68.7400, type: 'state' },
  { id: 392, name: 'Estado Yaracuy', state: 'Yaracuy', country: 'Venezuela', lat: 10.3400, lng: -68.7400, type: 'state' },
  { id: 393, name: 'Delta Amacuro', state: 'Delta Amacuro', country: 'Venezuela', lat: 9.0500, lng: -62.0500, type: 'state' },
  { id: 394, name: 'Estado Delta Amacuro', state: 'Delta Amacuro', country: 'Venezuela', lat: 9.0500, lng: -62.0500, type: 'state' },
  { id: 395, name: 'Nueva Esparta', state: 'Nueva Esparta', country: 'Venezuela', lat: 11.0000, lng: -64.0000, type: 'state' },
  { id: 396, name: 'Porlamar', state: 'Nueva Esparta', country: 'Venezuela', lat: 10.9600, lng: -63.8500, type: 'city' },
  { id: 397, name: 'La Asunción, Nueva Esparta', state: 'Nueva Esparta', country: 'Venezuela', lat: 11.0300, lng: -63.8600, type: 'town' },
  { id: 398, name: 'Juan Griego', state: 'Nueva Esparta', country: 'Venezuela', lat: 11.0800, lng: -63.9700, type: 'town' },
  { id: 399, name: 'Pampatar', state: 'Nueva Esparta', country: 'Venezuela', lat: 10.9900, lng: -63.8000, type: 'town' },
  { id: 400, name: 'Punta de Piedras, Nueva Esparta', state: 'Nueva Esparta', country: 'Venezuela', lat: 10.9000, lng: -64.1000, type: 'town' },
  { id: 401, name: 'El Valle del Espíritu Santo', state: 'Nueva Esparta', country: 'Venezuela', lat: 10.9900, lng: -63.9000, type: 'town' },
  { id: 402, name: 'Falcón', state: 'Falcón', country: 'Venezuela', lat: 11.4000, lng: -69.6800, type: 'state' },
  { id: 403, name: 'Coro', state: 'Falcón', country: 'Venezuela', lat: 11.4000, lng: -69.6800, type: 'city' },
  { id: 404, name: 'Punto Fijo', state: 'Falcón', country: 'Venezuela', lat: 11.6900, lng: -70.1800, type: 'city' },
  { id: 405, name: 'La Vela de Coro', state: 'Falcón', country: 'Venezuela', lat: 11.4600, lng: -69.5700, type: 'town' },
  { id: 406, name: 'Churuguara', state: 'Falcón', country: 'Venezuela', lat: 10.8100, lng: -69.5400, type: 'town' },
  { id: 407, name: 'Dabajuro', state: 'Falcón', country: 'Venezuela', lat: 11.0300, lng: -70.6700, type: 'town' },
  { id: 408, name: 'Puerto Cumarebo', state: 'Falcón', country: 'Venezuela', lat: 11.4900, lng: -69.3500, type: 'town' },
  { id: 409, name: 'Tucacas', state: 'Falcón', country: 'Venezuela', lat: 10.7900, lng: -68.3200, type: 'town' },
  { id: 410, name: 'Morón, Falcón', state: 'Falcón', country: 'Venezuela', lat: 10.4900, lng: -68.2000, type: 'town' },
  { id: 411, name: 'Amazonas (Estado)', state: 'Amazonas', country: 'Venezuela', lat: 3.5000, lng: -66.0000, type: 'state' },
  { id: 412, name: 'Puerto Ayacucho', state: 'Amazonas', country: 'Venezuela', lat: 5.6600, lng: -67.6300, type: 'city' },
  { id: 413, name: 'San Fernando de Atabapo', state: 'Amazonas', country: 'Venezuela', lat: 4.0500, lng: -67.7000, type: 'town' },
  { id: 414, name: 'Maroa', state: 'Amazonas', country: 'Venezuela', lat: 2.7200, lng: -67.5600, type: 'town' },
  { id: 415, name: 'Vargas (Estado)', state: 'La Guaira', country: 'Venezuela', lat: 10.6000, lng: -66.8500, type: 'state' },
  { id: 416, name: 'La Guaira', state: 'La Guaira', country: 'Venezuela', lat: 10.6000, lng: -66.9300, type: 'city' },
  { id: 417, name: 'Macuto', state: 'La Guaira', country: 'Venezuela', lat: 10.6100, lng: -66.9000, type: 'town' },
  { id: 418, name: 'Caraballeda', state: 'La Guaira', country: 'Venezuela', lat: 10.6100, lng: -66.8500, type: 'town' },
  { id: 419, name: 'Naiguatá', state: 'La Guaira', country: 'Venezuela', lat: 10.6200, lng: -66.7400, type: 'town' },
  { id: 420, name: 'Catia La Mar', state: 'La Guaira', country: 'Venezuela', lat: 10.6000, lng: -67.0300, type: 'town' },
  { id: 421, name: 'Maiquetía', state: 'La Guaira', country: 'Venezuela', lat: 10.6000, lng: -66.9600, type: 'town' },
];

function normalize(text) {
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
    let score = 0;
    for (const term of terms) {
      let termScore = 0;
      if (name.includes(term)) termScore = Math.max(termScore, 30);
      if (state.includes(term)) termScore = Math.max(termScore, 15);
      if (country.includes(term)) termScore = Math.max(termScore, 5);
      if (name === term) termScore = Math.max(termScore, 100);
      if (name.startsWith(term) || name.endsWith(term)) termScore = Math.max(termScore, 50);
      if (termScore === 0) return null;
      score += termScore;
    }
    return { ...loc, score };
  }).filter(Boolean);

  return scored.sort((a, b) => b.score - a.score).slice(0, 10);
}

function buildDisplayName(loc) {
  const parts = [loc.name];
  if (loc.state) parts.push(loc.state);
  parts.push(loc.country);
  return parts.join(', ');
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const path = parsed.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (path === '/search') {
    const q = parsed.query.q || parsed.query.address || '';
    const format = parsed.query.format || 'json';
    const limit = parseInt(parsed.query.limit, 10) || 5;
    const results = searchLocations(q).slice(0, limit);

    if (format === 'json') {
      const json = results.map(loc => ({
        place_id: loc.id,
        lat: loc.lat.toString(),
        lon: loc.lng.toString(),
        display_name: buildDisplayName(loc),
        type: loc.type,
        importance: loc.score / 100,
        class: 'place',
      }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
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
    let closest = null;
    let minDist = Infinity;
    for (const loc of locations) {
      const d = Math.sqrt(Math.pow(loc.lat - lat, 2) + Math.pow(loc.lng - lon, 2));
      if (d < minDist) { minDist = d; closest = loc; }
    }
    if (closest && minDist < 0.1) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        place_id: closest.id,
        lat: closest.lat.toString(),
        lon: closest.lng.toString(),
        display_name: buildDisplayName(closest),
      }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No results' }));
    }
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    service: 'Habitas Nominatim-compatible Geocoder',
    version: '1.0',
    area: 'Venezuela / Guárico',
    locations_count: locations.length,
  }));
});

const PORT = parseInt(process.env.GEOCODE_PORT || '8080', 10);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Geocoder] Habitas Nominatim-compatible server running on port ${PORT}`);
  console.log(`[Geocoder] ${locations.length} locations loaded (Venezuela / Guárico)`);
});
