const http = require('http');
const url = require('url');

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
  { id: 14, name: 'Chapinero, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6501, lng: -74.0592, type: 'neighborhood' },
  { id: 15, name: 'Teusaquillo, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6548, lng: -74.0750, type: 'neighborhood' },
  { id: 16, name: 'La Candelaria, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.5972, lng: -74.0705, type: 'neighborhood' },
  { id: 17, name: 'Suba, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.7474, lng: -74.0925, type: 'neighborhood' },
  { id: 18, name: 'Usaquén, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.7012, lng: -74.0357, type: 'neighborhood' },
  { id: 19, name: 'Kennedy, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6286, lng: -74.1561, type: 'neighborhood' },
  { id: 20, name: 'Engativá, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.7036, lng: -74.1107, type: 'neighborhood' },
  { id: 21, name: 'Bosa, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6270, lng: -74.1935, type: 'neighborhood' },
  { id: 22, name: 'Ciudad Bolívar, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.5705, lng: -74.1561, type: 'neighborhood' },
  { id: 23, name: 'Rafael Uribe Uribe, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.5772, lng: -74.1088, type: 'neighborhood' },
  { id: 24, name: 'Los Mártires, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6107, lng: -74.0817, type: 'neighborhood' },
  { id: 25, name: 'Santa Fe, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.5920, lng: -74.0770, type: 'neighborhood' },
  { id: 26, name: 'Barrios Unidos, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6686, lng: -74.0590, type: 'neighborhood' },
  { id: 27, name: 'Quinta Paredes, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6376, lng: -74.0828, type: 'neighborhood' },

  // Universidades de Bogotá
  { id: 28, name: 'Universidad Nacional de Colombia, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6381, lng: -74.0840, type: 'university' },
  { id: 29, name: 'Universidad de los Andes', state: 'Cundinamarca', country: 'Colombia', lat: 4.6027, lng: -74.0659, type: 'university' },
  { id: 30, name: 'Pontificia Universidad Javeriana, Bogotá', state: 'Cundinamarca', country: 'Colombia', lat: 4.6284, lng: -74.0650, type: 'university' },
  { id: 31, name: 'Universidad Distrital Francisco José de Caldas', state: 'Cundinamarca', country: 'Colombia', lat: 4.6032, lng: -74.0656, type: 'university' },
  { id: 32, name: 'Universidad del Rosario', state: 'Cundinamarca', country: 'Colombia', lat: 4.5969, lng: -74.0702, type: 'university' },

  // Barrios de Medellín
  { id: 33, name: 'El Poblado, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2100, lng: -75.5700, type: 'neighborhood' },
  { id: 34, name: 'Laureles, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2519, lng: -75.5958, type: 'neighborhood' },
  { id: 35, name: 'Belén, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2176, lng: -75.6051, type: 'neighborhood' },
  { id: 36, name: 'Envigado', state: 'Antioquia', country: 'Colombia', lat: 6.1700, lng: -75.5833, type: 'neighborhood' },
  { id: 37, name: 'Sabaneta', state: 'Antioquia', country: 'Colombia', lat: 6.1497, lng: -75.6083, type: 'neighborhood' },
  { id: 38, name: 'La Floresta, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2600, lng: -75.5700, type: 'neighborhood' },
  { id: 39, name: 'Manila, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2333, lng: -75.5667, type: 'neighborhood' },
  { id: 40, name: 'Boston, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2475, lng: -75.5697, type: 'neighborhood' },
  { id: 41, name: 'Estadio, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2586, lng: -75.5897, type: 'neighborhood' },
  { id: 42, name: 'Suramericana, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2619, lng: -75.5831, type: 'neighborhood' },

  // Universidades de Medellín
  { id: 43, name: 'Universidad de Antioquia', state: 'Antioquia', country: 'Colombia', lat: 6.2678, lng: -75.5647, type: 'university' },
  { id: 44, name: 'Universidad Nacional de Colombia, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2620, lng: -75.5770, type: 'university' },
  { id: 45, name: 'Universidad EAFIT', state: 'Antioquia', country: 'Colombia', lat: 6.2003, lng: -75.5764, type: 'university' },
  { id: 46, name: 'Universidad de Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2317, lng: -75.6067, type: 'university' },
  { id: 47, name: 'Universidad Pontificia Bolivariana, Medellín', state: 'Antioquia', country: 'Colombia', lat: 6.2428, lng: -75.5675, type: 'university' },

  // Barrios de Cali
  { id: 48, name: 'Granada, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4294, lng: -76.5389, type: 'neighborhood' },
  { id: 49, name: 'San Antonio, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4486, lng: -76.5417, type: 'neighborhood' },
  { id: 50, name: 'El Peñón, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4408, lng: -76.5489, type: 'neighborhood' },
  { id: 51, name: 'Santa Mónica, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4103, lng: -76.5386, type: 'neighborhood' },
  { id: 52, name: 'Tequendama, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4383, lng: -76.5231, type: 'neighborhood' },
  { id: 53, name: 'Ciudad Jardín, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.3733, lng: -76.5286, type: 'neighborhood' },
  { id: 54, name: 'Versalles, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4597, lng: -76.5306, type: 'neighborhood' },
  { id: 55, name: 'Centenario, Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4694, lng: -76.5217, type: 'neighborhood' },

  // Universidades de Cali
  { id: 56, name: 'Universidad del Valle', state: 'Valle del Cauca', country: 'Colombia', lat: 3.3769, lng: -76.5344, type: 'university' },
  { id: 57, name: 'Universidad Autónoma de Occidente', state: 'Valle del Cauca', country: 'Colombia', lat: 3.3453, lng: -76.5308, type: 'university' },
  { id: 58, name: 'Pontificia Universidad Javeriana Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4019, lng: -76.5458, type: 'university' },
  { id: 59, name: 'Universidad Santiago de Cali', state: 'Valle del Cauca', country: 'Colombia', lat: 3.4281, lng: -76.5331, type: 'university' },

  // Barrios de Barranquilla
  { id: 60, name: 'El Prado, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 10.9989, lng: -74.8031, type: 'neighborhood' },
  { id: 61, name: 'Centro, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 10.9686, lng: -74.7861, type: 'neighborhood' },
  { id: 62, name: 'Alto Prado, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 11.0083, lng: -74.7950, type: 'neighborhood' },
  { id: 63, name: 'Villa Santos, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 10.9983, lng: -74.7836, type: 'neighborhood' },
  { id: 64, name: 'La Castellana, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 10.9989, lng: -74.7736, type: 'neighborhood' },
  { id: 65, name: 'Riomar, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 11.0006, lng: -74.7889, type: 'neighborhood' },
  { id: 66, name: 'Boston, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 10.9794, lng: -74.7892, type: 'neighborhood' },
  { id: 67, name: 'La Concepción, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 10.9683, lng: -74.7819, type: 'neighborhood' },

  // Universidades de Barranquilla
  { id: 68, name: 'Universidad del Atlántico', state: 'Atlántico', country: 'Colombia', lat: 10.9881, lng: -74.8022, type: 'university' },
  { id: 69, name: 'Universidad del Norte, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 11.0114, lng: -74.7761, type: 'university' },
  { id: 70, name: 'Universidad Simón Bolívar, Barranquilla', state: 'Atlántico', country: 'Colombia', lat: 10.9769, lng: -74.7831, type: 'university' },
  { id: 71, name: 'Corporación Universitaria de la Costa', state: 'Atlántico', country: 'Colombia', lat: 10.9925, lng: -74.7739, type: 'university' },

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
    service: 'Ohana Nominatim-compatible Geocoder',
    version: '1.0',
    area: 'Colombia',
    locations_count: locations.length,
  }));
});

const PORT = parseInt(process.env.GEOCODE_PORT || '8080', 10);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Geocoder] Ohana Nominatim-compatible server running on port ${PORT}`);
  console.log(`[Geocoder] ${locations.length} locations loaded (Colombia)`);
});
