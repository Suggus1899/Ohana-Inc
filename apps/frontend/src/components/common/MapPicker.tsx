import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Loader2, Crosshair } from 'lucide-react';
import { geocodingService, GeocodeResult } from '@/services/geocoding.service';
import { cn } from '@/lib/utils';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIconRetina, shadowUrl: markerShadow });

export interface MapPickerValue {
  lat: number;
  lng: number;
  address: string;
  city?: string;
  state?: string;
}

interface MapPickerProps {
  value?: MapPickerValue;
  onChange: (value: MapPickerValue) => void;
  className?: string;
  height?: number;
}

const DEFAULT_CENTER: [number, number] = [9.9111, -67.3583]; // San Juan de los Morros
const DEFAULT_ZOOM = 12;

export function MapPicker({ value, onChange, className, height = 320 }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selected, setSelected] = useState<MapPickerValue | null>(value ?? null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    setSearchError(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      const results = await geocodingService.autocomplete(value.trim(), 5);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 350);
  };

  const handleSelectSuggestion = (suggestion: GeocodeResult) => {
    setSearchQuery(suggestion.displayName);
    setShowSuggestions(false);
    setSuggestions([]);
    setMarker(suggestion.lat, suggestion.lng, suggestion);
  };

  const setMarker = useCallback(
    (lat: number, lng: number, result?: GeocodeResult, skipOnChange = false) => {
      if (!mapRef.current) return;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);

        markerRef.current.on('dragend', async () => {
          const pos = markerRef.current!.getLatLng();
          setGeocoding(true);
          const geo = await geocodingService.coordsToAddress(pos.lat, pos.lng);
          setGeocoding(false);
          const val: MapPickerValue = {
            lat: pos.lat,
            lng: pos.lng,
            address: geo?.displayName ?? `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`,
            city: geo?.city,
            state: geo?.state,
          };
          setSelected(val);
          onChange(val);
        });
      }

      mapRef.current.setView([lat, lng], 15, { animate: false });

      const val: MapPickerValue = {
        lat,
        lng,
        address: result?.displayName ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        city: result?.city,
        state: result?.state,
      };
      setSelected(val);
      if (!skipOnChange) {
        onChange(val);
      }
    },
    [onChange]
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = value
      ? [value.lat, value.lng]
      : DEFAULT_CENTER;

    mapRef.current = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: DEFAULT_ZOOM,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    mapRef.current.on('click', async (e: L.LeafletMouseEvent) => {
      setGeocoding(true);
      const geo = await geocodingService.coordsToAddress(e.latlng.lat, e.latlng.lng);
      setGeocoding(false);
      setMarker(e.latlng.lat, e.latlng.lng, geo ?? undefined);
    });

    if (value) {
      setMarker(value.lat, value.lng, undefined, true);
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError(null);

    try {
      const result = await geocodingService.addressToCoords(searchQuery);
      if (!result) {
        setSearchError('No se encontró la dirección. Intenta ser más específico.');
        return;
      }
      setMarker(result.lat, result.lng, result);
    } catch {
      setSearchError('Error al buscar la dirección. Verifica la conexión.');
    } finally {
      setSearching(false);
    }
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      setSearchError('Tu navegador no soporta la geolocalización.');
      return;
    }
    setLocating(true);
    setSearchError(null);

    const onSuccess = async (position: GeolocationPosition) => {
      try {
        const { latitude, longitude } = position.coords;
        setGeocoding(true);
        let geo: any;
        try {
          geo = await geocodingService.coordsToAddress(latitude, longitude);
        } catch {
          // Si falla el reverse geocoding, igual colocamos el marcador con coordenadas
        }
        setMarker(latitude, longitude, geo ?? undefined);
      } catch {
        setSearchError('Error al procesar la ubicación. Intenta buscar manualmente.');
      } finally {
        setGeocoding(false);
        setLocating(false);
      }
    };

    const onError = (error: GeolocationPositionError) => {
      // Si falla con alta precisión (timeout), reintentar con baja precisión
      if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
          enableHighAccuracy: false,
          timeout: 5000,
        });
        return;
      }
      setLocating(false);
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setSearchError('Permiso de ubicación denegado. Puedes buscar la dirección manualmente.');
          break;
        default:
          setSearchError('No se pudo obtener tu ubicación. Intenta buscar manualmente.');
      }
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 5000,
    });
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Ubicación en el mapa</span>
        {geocoding && (
          <span className="flex items-center gap-1 text-xs text-blue-600">
            <Loader2 className="h-3 w-3 animate-spin" /> Geocodificando...
          </span>
        )}
      </div>

      {/* Search bar */}
      <div className="flex gap-2 relative" ref={searchRef}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            placeholder="Buscar zona, urbanización o dirección..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <span className="font-medium">{s.displayName}</span>
                  {s.city && <span className="text-gray-500 ml-1">- {s.city}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
        </button>
      </div>

      {searchError && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{searchError}</p>
      )}

      {/* My Location button */}
      <button
        type="button"
        onClick={handleMyLocation}
        disabled={locating}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
      >
        {locating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Crosshair className="h-4 w-4" />
        )}
        {locating ? 'Obteniendo ubicación...' : 'Mi ubicación'}
      </button>

      {/* Map */}
      <div
        ref={mapContainerRef}
        style={{ height }}
        className="rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0"
      />

      {/* Selected location */}
      {selected && (
        <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
          <MapPin className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
          <span className="line-clamp-2">{selected.address}</span>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Haz clic en el mapa o arrastra el marcador para ajustar la ubicación exacta.
      </p>
    </div>
  );
}
