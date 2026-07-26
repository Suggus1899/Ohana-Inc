import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bed, Bath, Square, MapPin } from 'lucide-react';
import api, { Property } from '@/services/api';
import { retryWithBackoff } from '@/utils/retryWithBackoff';
import { useExchangeRate } from '../contexts/ExchangeRateContext';
import { formatDualPriceShort, usdToVes } from '../utils/formatPrice';

const iconMap: Record<string, string> = {
  Residencia: '/images/icon-maps/residencia.png',
  Apartamento: '/images/icon-maps/apartamento.png',
  Casa: '/images/icon-maps/casa.png',
  Local: '/images/icon-maps/local.png',
  Finca: '/images/icon-maps/finca.png',
  Terreno: '/images/icon-maps/terreno.png',
};

const getPropertyIcon = (type: string) => new Icon({
  iconUrl: iconMap[type] || iconMap.Residencia,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

const position: [number, number] = [9.9126704, -67.3614586];

const LocationMap = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const { rate } = useExchangeRate();

  useEffect(() => {
    retryWithBackoff(
      () => api.getProperties({ limit: 100 }).then((res) => {
        if (!res.success || !res.data) {
          throw new Error(res.error?.message || 'Error al cargar propiedades');
        }
        return res.data.properties;
      }),
      { maxRetries: 3, baseDelay: 1000, onRetry: (attempt) => console.warn(`Reintentando cargar propiedades en mapa (intento ${attempt}/3)...`) }
    ).then(setProperties).catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const legendItems = [
    { type: 'Residencia', label: 'Residencias' },
    { type: 'Apartamento', label: 'Apartamentos' },
    { type: 'Casa', label: 'Casas' },
    { type: 'Local', label: 'Locales' },
    { type: 'Finca', label: 'Fincas' },
    { type: 'Terreno', label: 'Terrenos' },
  ];

  return (
    <div>
      <div className="relative z-0 w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-lg">
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {properties.map((p) => (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={getPropertyIcon(p.type)}
            >
              <Popup>
                <div className="w-[220px]">
                  {p.images?.[0] && (
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="w-full h-28 object-cover rounded-lg mb-3"
                    />
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {p.type}
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {rate?.usdToVes ? formatDualPriceShort(p.price, usdToVes(p.price, rate.usdToVes), p.listingType === 'Alquiler' ? 'mes' : '') : `$${p.price} ${p.listingType === 'Alquiler' ? '/mes' : ''}`}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm leading-tight">{p.title}</h3>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{p.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                      <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{p.bedrooms}</span>
                      <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{p.bathrooms}</span>
                      <span className="flex items-center gap-1"><Square className="w-3 h-3" />{p.area}m²</span>
                    </div>
                    <button
                      onClick={() => window.location.href = `/propiedades/${p.id}`}
                      className="w-full mt-2 text-xs font-semibold py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Ver propiedad
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
        {legendItems.map((item) => (
          <div key={item.type} className="flex items-center gap-2">
            <img src={iconMap[item.type]} alt={item.label} className="w-5 h-5" />
            <span className="text-sm text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationMap;
