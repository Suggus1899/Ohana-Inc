const http = require('http');
const url = require('url');

// Datos de ubicaciones en Colombia - incluye ciudades, barrios, universidades y landmarks
const locations = [
  // Colombia (país)
  { id: 1, name: 'Colombia', state: '', country: 'Colombia', lat: 4.5709, lng: -74.2973, type: 'country' },

  // Departamentos
  { id: 2, name: 'Cundinamarca', state: 'Cundinamarca', country: 'Colombia', lat: 4.8600, lng: -74.0500, type: 'state' },
  { id: 3, name: 'Departamento de Cundinamarca', state: 'Cundinamarca', country: 'Colombia', lat: 4.8600, lng: -74.0500, type: 'state' },
  { id: 4, name: 'Antioquia', state: 'Antioquia', country: 'Colombia', lat: 6.7000, lng: -75.5000, type: 'state' },
  { id: 5, name: 'Departamento de Antioquia', state: 'Antioquia', country: 'Colombia', lat: 6.7000, lng: -75.5000, type: 'state' },
  { id: 6, name: 'Valle del Cauca', state: 'Valle del Cauca', country: 'Colombia', lat: 3.8000, lng: -76.5000, type: 'state' },
  { id: 7, name: 'Departamento del Valle del Cauca', state: 'Valle del Cauca', country: 'Colombia', lat: 3.8000, lng: -76.5000, type: 'state' },
  { id: 8, name: 'Atlántico', state: 'Atlántico', country: 'Colombia', lat: 10.7000, lng: -74.9000, type: 'state' },
  { id: 9, name: 'Departamento del Atlántico', state: 'Atlántico', country: 'Colombia', lat: 10.7000, lng: -74.9000, type: 'state' },

  // Ciudades principales
  { id: 10, name: 'Bogotá DC', state: 'Cundinamarca', country: 'Colombia', lat: 4.7110, lng: -74.0721, type: 'city', population: 7200000 },
  { id: 11, name: 'Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2442, lng: -75.5812, type: 'city', population: 2500000 },
  { id: 12, name: 'Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4516, lng: -76.5320, type: 'city', population: 2200000 },
  { id: 13, name: 'Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 10.9685, lng: -74.7813, type: 'city', population: 1300000 },

  // Barrios de Bogotá
  { id: 14, name: 'Chapinero, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6501, lng: -74.0592, type: 'neighborhood', alias: ['chapinero', 'barrio chapinero'] },
  { id: 15, name: 'Teusaquillo, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6548, lng: -74.0750, type: 'neighborhood', alias: ['teusaquillo', 'barrio teusaquillo'] },
  { id: 16, name: 'La Candelaria, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.5972, lng: -74.0705, type: 'neighborhood', alias: ['la candelaria', 'centro historico bogota'] },
  { id: 17, name: 'Suba, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.7474, lng: -74.0925, type: 'neighborhood', alias: ['suba', 'barrio suba'] },
  { id: 18, name: 'Usaquén, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.7012, lng: -74.0357, type: 'neighborhood', alias: ['usaquen', 'barrio usaquen'] },
  { id: 19, name: 'Kennedy, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6286, lng: -74.1561, type: 'neighborhood', alias: ['kennedy', 'barrio kennedy'] },
  { id: 20, name: 'Engativá, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.7036, lng: -74.1107, type: 'neighborhood', alias: ['engativa', 'barrio engativa'] },
  { id: 21, name: 'Bosa, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6270, lng: -74.1935, type: 'neighborhood', alias: ['bosa', 'barrio bosa'] },
  { id: 22, name: 'Ciudad Bolívar, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.5705, lng: -74.1561, type: 'neighborhood', alias: ['ciudad bolivar', 'barrio ciudad bolivar'] },
  { id: 23, name: 'Rafael Uribe Uribe, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.5772, lng: -74.1088, type: 'neighborhood', alias: ['rafael uribe', 'rafael uribe uribe'] },
  { id: 24, name: 'Los Mártires, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6107, lng: -74.0817, type: 'neighborhood', alias: ['los martires', 'barrio los martires'] },
  { id: 25, name: 'Santa Fe, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.5920, lng: -74.0770, type: 'neighborhood', alias: ['santa fe bogota', 'barrio santa fe'] },
  { id: 26, name: 'Barrios Unidos, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6686, lng: -74.0590, type: 'neighborhood', alias: ['barrios unidos', 'barrio barrios unidos'] },
  { id: 27, name: 'Quinta Paredes, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6376, lng: -74.0828, type: 'neighborhood', alias: ['quinta paredes', 'barrio quinta paredes'] },

  // Universidades de Bogotá
  { id: 28, name: 'Universidad Nacional de Colombia, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6381, lng: -74.0840, type: 'university', alias: ['unal', 'nacional', 'universidad nacional'] },
  { id: 29, name: 'Universidad de los Andes', state: 'Cundinamarca', country: 'Colombia', lat: 4.6027, lng: -74.0659, type: 'university', alias: ['uniandes', 'los andes', 'universidad andes'] },
  { id: 30, name: 'Pontificia Universidad Javeriana, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6284, lng: -74.0650, type: 'university', alias: ['javeriana', 'puj', 'universidad javeriana'] },
  { id: 31, name: 'Universidad Distrital Francisco José de Caldas', state: 'Cundinamarca', country: 'Colombia', lat: 4.6032, lng: -74.0656, type: 'university', alias: ['distrital', 'universidad distrital'] },
  { id: 32, name: 'Universidad del Rosario', state: 'Cundinamarca', country: 'Colombia', lat: 4.5969, lng: -74.0702, type: 'university', alias: ['rosario', 'universidad rosario', 'el rosario'] },

  // Barrios de Medellín
  { id: 33, name: 'El Poblado, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2100, lng: -75.5700, type: 'neighborhood', alias: ['el poblado', 'poblado', 'barrio el poblado'] },
  { id: 34, name: 'Laureles, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2519, lng: -75.5958, type: 'neighborhood', alias: ['laureles', 'barrio laureles'] },
  { id: 35, name: 'Belén, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2176, lng: -75.6051, type: 'neighborhood', alias: ['belen', 'barrio belen'] },
  { id: 36, name: 'Envigado', state: 'Antioquia', country: 'Colombia', lat: 6.1700, lng: -75.5833, type: 'neighborhood', alias: ['envigado', 'municipio envigado'] },
  { id: 37, name: 'Sabaneta', state: 'Antioquia', country: 'Colombia', lat: 6.1497, lng: -75.6083, type: 'neighborhood', alias: ['sabaneta', 'municipio sabaneta'] },
  { id: 38, name: 'La Floresta, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2600, lng: -75.5700, type: 'neighborhood', alias: ['la floresta', 'barrio la floresta'] },
  { id: 39, name: 'Manila, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2333, lng: -75.5667, type: 'neighborhood', alias: ['manila', 'barrio manila'] },
  { id: 40, name: 'Boston, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2475, lng: -75.5697, type: 'neighborhood', alias: ['boston medellin', 'barrio boston medellin'] },
  { id: 41, name: 'Estadio, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2586, lng: -75.5897, type: 'neighborhood', alias: ['estadio', 'barrio estadio'] },
  { id: 42, name: 'Suramericana, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2619, lng: -75.5831, type: 'neighborhood', alias: ['suramericana', 'barrio suramericana'] },

  // Universidades de Medellín
  { id: 43, name: 'Universidad de Antioquia', state: 'Antioquia', country: 'Colombia', lat: 6.2678, lng: -75.5647, type: 'university', alias: ['udea', 'antioquia', 'universidad antioquia'] },
  { id: 44, name: 'Universidad Nacional de Colombia, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2620, lng: -75.5770, type: 'university', alias: ['unal medellin', 'nacional medellin'] },
  { id: 45, name: 'Universidad EAFIT', state: 'Antioquia', country: 'Colombia', lat: 6.2003, lng: -75.5764, type: 'university', alias: ['eafit', 'universidad eafit'] },
  { id: 46, name: 'Universidad de Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2317, lng: -75.6067, type: 'university', alias: ['udem', 'universidad medellin'] },
  { id: 47, name: 'Universidad Pontificia Bolivariana, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2428, lng: -75.5675, type: 'university', alias: ['upb', 'upb medellin', 'pontificia bolivariana'] },

  // Barrios de Cali
  { id: 48, name: 'Granada, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4294, lng: -76.5389, type: 'neighborhood', alias: ['granada cali', 'barrio granada'] },
  { id: 49, name: 'San Antonio, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4486, lng: -76.5417, type: 'neighborhood', alias: ['san antonio cali', 'barrio san antonio cali'] },
  { id: 50, name: 'El Peñón, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4408, lng: -76.5489, type: 'neighborhood', alias: ['el penon', 'barrio el penon'] },
  { id: 51, name: 'Santa Mónica, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4103, lng: -76.5386, type: 'neighborhood', alias: ['santa monica', 'barrio santa monica'] },
  { id: 52, name: 'Tequendama, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4383, lng: -76.5231, type: 'neighborhood', alias: ['tequendama', 'barrio tequendama'] },
  { id: 53, name: 'Ciudad Jardín, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.3733, lng: -76.5286, type: 'neighborhood', alias: ['ciudad jardin', 'barrio ciudad jardin'] },
  { id: 54, name: 'Versalles, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4597, lng: -76.5306, type: 'neighborhood', alias: ['versalles', 'barrio versalles'] },
  { id: 55, name: 'Centenario, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4694, lng: -76.5217, type: 'neighborhood', alias: ['centenario', 'barrio centenario'] },

  // Universidades de Cali
  { id: 56, name: 'Universidad del Valle', state: 'Valle del Cauca', country: 'Colombia', lat: 3.3769, lng: -76.5344, type: 'university', alias: ['univalle', 'universidad valle', 'uvalle'] },
  { id: 57, name: 'Universidad Autónoma de Occidente', state: 'Valle del Cauca', country: 'Colombia', lat: 3.3453, lng: -76.5308, type: 'university', alias: ['uao', 'autonoma occidente', 'universidad autonoma occidente'] },
  { id: 58, name: 'Pontificia Universidad Javeriana Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4019, lng: -76.5458, type: 'university', alias: ['javeriana cali', 'puj cali', 'javeriana'] },
  { id: 59, name: 'Universidad Santiago de Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4281, lng: -76.5331, type: 'university', alias: ['usc', 'santiago de cali', 'universidad santiago cali'] },

  // Barrios de Barranquilla
  { id: 60, name: 'El Prado, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 10.9989, lng: -74.8031, type: 'neighborhood', alias: ['el prado', 'barrio el prado'] },
  { id: 61, name: 'Centro, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 10.9686, lng: -74.7861, type: 'neighborhood', alias: ['centro barranquilla', 'barrio centro barranquilla'] },
  { id: 62, name: 'Alto Prado, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 11.0083, lng: -74.7950, type: 'neighborhood', alias: ['alto prado', 'barrio alto prado'] },
  { id: 63, name: 'Villa Santos, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 10.9983, lng: -74.7836, type: 'neighborhood', alias: ['villa santos', 'barrio villa santos'] },
  { id: 64, name: 'La Castellana, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 10.9989, lng: -74.7736, type: 'neighborhood', alias: ['la castellana', 'barrio la castellana'] },
  { id: 65, name: 'Riomar, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 11.0006, lng: -74.7889, type: 'neighborhood', alias: ['riomar', 'barrio riomar'] },
  { id: 66, name: 'Boston, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 10.9794, lng: -74.7892, type: 'neighborhood', alias: ['boston barranquilla', 'barrio boston barranquilla'] },
  { id: 67, name: 'La Concepción, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 10.9683, lng: -74.7819, type: 'neighborhood', alias: ['la concepcion', 'barrio la concepcion'] },

  // Universidades de Barranquilla
  { id: 68, name: 'Universidad del Atlántico', state: 'Atlántico', country: 'Colombia', lat: 10.9881, lng: -74.8022, type: 'university', alias: ['universidad atlantico', 'uatlantico'] },
  { id: 69, name: 'Universidad del Norte, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 11.0114, lng: -74.7761, type: 'university', alias: ['uninorte', 'universidad norte', 'norte'] },
  { id: 70, name: 'Universidad Simón Bolívar, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 10.9769, lng: -74.7831, type: 'university', alias: ['simon bolivar', 'usb barranquilla', 'usb'] },
  { id: 71, name: 'Corporación Universitaria de la Costa', state: 'Atlántico', country: 'Colombia', lat: 10.9925, lng: -74.7739, type: 'university', alias: ['cuc', 'corporacion costa', 'universidad de la costa'] },

  // Landmarks y puntos de interés - Bogotá
  { id: 72, name: 'Plaza de Bolívar, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.5981, lng: -74.0758, type: 'landmark' },
  { id: 73, name: 'Aeropuerto El Dorado, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.7016, lng: -74.1469, type: 'airport' },
  { id: 74, name: 'Centro Comercial Andino, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6651, lng: -74.0533, type: 'landmark' },
  { id: 75, name: 'Museo del Oro, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6019, lng: -74.0721, type: 'landmark' },
  { id: 76, name: 'Parque Simón Bolívar, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6583, lng: -74.0936, type: 'park' },
  { id: 77, name: 'Terminal de Transporte, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6750, lng: -74.0900, type: 'transport' },

  // Landmarks y puntos de interés - Medellín
  { id: 78, name: 'Parque Lleras, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2160, lng: -75.5660, type: 'landmark' },
  { id: 79, name: 'Aeropuerto Olaya Herrera, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2100, lng: -75.5900, type: 'airport' },
  { id: 80, name: 'Parque Arví, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2900, lng: -75.5000, type: 'park' },
  { id: 81, name: 'Estadio Atanasio Girardot, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2556, lng: -75.5875, type: 'landmark' },
  { id: 82, name: 'Terminal del Norte, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2820, lng: -75.5630, type: 'transport' },

  // Landmarks y puntos de interés - Cali
  { id: 83, name: 'Parque del Perro, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4347, lng: -76.5431, type: 'landmark' },
  { id: 84, name: 'Zoológico de Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4600, lng: -76.5500, type: 'landmark' },
  { id: 85, name: 'Iglesia La Ermita, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4531, lng: -76.5350, type: 'landmark' },
  { id: 86, name: 'Centro Comercial Chipichape, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4700, lng: -76.5300, type: 'landmark' },
  { id: 87, name: 'Terminal de Transportes, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4400, lng: -76.5100, type: 'transport' },

  // Landmarks y puntos de interés - Barranquilla
  { id: 88, name: 'Carnaval de Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 10.9685, lng: -74.7813, type: 'landmark' },
  { id: 89, name: 'Zoológico de Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 10.9800, lng: -74.8000, type: 'landmark' },
  { id: 90, name: 'Bocas de Ceniza, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 11.0500, lng: -74.8700, type: 'landmark' },
  { id: 91, name: 'Centro Comercial Buenavista, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 11.0000, lng: -74.8100, type: 'landmark' },
  { id: 92, name: 'Aeropuerto Ernesto Cortissoz, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 10.8894, lng: -74.7808, type: 'airport' },
  { id: 93, name: 'Terminal de Transporte, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 10.9500, lng: -74.7900, type: 'transport' },
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
      service: 'Ohana Geocoding Server',
      version: '2.0',
      locations_count: locations.length,
      uptime: process.uptime(),
      examples: ['chapinero', 'el poblado', 'granada', 'el prado', 'uniandes', 'eafit']
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
    service: 'Ohana Geocoding Server v2.0',
    description: 'Servidor de geocoding compatible con Nominatim para Colombia',
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
      focus_area: 'Colombia - Bogotá, Medellín, Cali, Barranquilla'
    },
    featured_examples: [
      'chapinero',
      'el poblado',
      'granada',
      'el prado',
      'uniandes',
      'eafit'
    ]
  }));
});

const PORT = parseInt(process.env.GEOCODE_PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`[Geocoder v2.1] Servidor de geocoding Ohana ejecutándose en http://${HOST}:${PORT}`);
  console.log(`[Geocoder] ${locations.length} ubicaciones cargadas`);
  console.log(`[Geocoder] Foco: Colombia - Bogotá, Medellín, Cali, Barranquilla`);
  console.log(`[Geocoder] Ejemplos de búsqueda: "chapinero", "el poblado", "granada", "el prado", "uniandes", "eafit"`);
  console.log(`[Geocoder] ${locations.filter(l => l.type === 'neighborhood').length} barrios cargados`);
  console.log(`[Geocoder] ${locations.filter(l => l.type === 'university').length} universidades cargadas`);
});
