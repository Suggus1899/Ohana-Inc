import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { api, Property } from '@/services/api';
import NavigationMap from '@/components/navigation/NavigationMap';
import RouteInstructions from '@/components/navigation/RouteInstructions';
import NavigationControls from '@/components/navigation/NavigationControls';
import CurrentInstruction from '@/components/navigation/CurrentInstruction';
import AddressSearchBar from '@/components/navigation/AddressSearchBar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockProperties } from '@/data/mockProperties';

const NavigationView = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'foot' | 'bike' | 'car'>('foot');
  const [property, setProperty] = useState<Property | null>(null);
  const [customDestination, setCustomDestination] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [showFullInstructions, setShowFullInstructions] = useState(false);
  const [shouldCenter, setShouldCenter] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  useEffect(() => {
    const fetchPropertyData = async () => {
      if (!propertyId) return;
      
      try {
        // Intento 1: API Real
        const response = await api.getProperty(propertyId);
        if (response.success && response.data?.property) {
          setProperty(response.data.property);
          return;
        }
      } catch (err) {
        console.warn("API Error, intentando con mocks...", err);
      }

      // Intento 2: Mocks (Resolución de Bug 3)
      const mockFound = mockProperties.find(p => p.id === propertyId);
      if (mockFound) {
        // Normalización de datos mock -> API real
        const normalizedProperty: Property = {
          ...mockFound as any,
          lat: mockFound.coordinates.lat,
          lng: mockFound.coordinates.lng,
          authorId: Number(mockFound.authorId),
          price: mockFound.priceNumber,
          furnished: false,
          status: 'approved',
          createdAt: mockFound.createdAt,
          updatedAt: mockFound.createdAt
        };
        setProperty(normalizedProperty);
      } else {
        console.error("Propiedad no encontrada en ninguna fuente.");
      }
    };
    
    fetchPropertyData();
  }, [propertyId]);

  const destination = useMemo(() => {
    if (customDestination) return { lat: customDestination.lat, lng: customDestination.lng };
    return property ? { lat: property.lat, lng: property.lng } : null;
  }, [property, customDestination]);

  const {
    isNavigating,
    route,
    currentStepIndex,
    isOffRoute,
    loading,
    error,
    startNavigation,
    stopNavigation,
    recalculate,
    currentPosition,
    hasArrived
  } = useNavigation({ destination, mode });

  useEffect(() => {
    // Verificación de permisos (Resolución Funcional 2)
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as any }).then((result) => {
        setPermissionStatus(result.state as any);
        result.onchange = () => {
          setPermissionStatus(result.state as any);
        };
      });
    }
  }, []);

  useEffect(() => {
    if (destination && !isNavigating && !loading && !error) {
      startNavigation();
    }
  }, [destination, isNavigating, loading, error, startNavigation]);

  useEffect(() => {
    if (isNavigating) {
      recalculate();
    }
  }, [mode, isNavigating, recalculate]);

  const handleStop = () => {
    stopNavigation();
    navigate(`/propiedades/${propertyId}`);
  };

  const handleModeChange = (newMode: 'foot' | 'bike' | 'car') => {
    setMode(newMode);
  };

  const handleCenter = () => {
    setShouldCenter(true);
    setTimeout(() => setShouldCenter(false), 500);
  };

  const currentStep = route?.steps?.[currentStepIndex] || null;

  if (permissionStatus === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-zinc-950 p-10 text-center">
        <div className="p-6 bg-red-500/20 rounded-full border border-red-500/30">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-white text-3xl font-black tracking-tighter uppercase">GPS Bloqueado</h2>
          <p className="text-white/50 font-bold max-w-sm">
            No podemos guiarte sin acceso a tu ubicación. Por favor, habilita los permisos de geolocalización en la configuración de tu navegador.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleStop}
          className="mt-4 border-white/10 text-white hover:bg-white/5"
        >
          VOLVER AL DETALLE
        </Button>
      </div>
    );
  }

  if (!property && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-zinc-950">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-xl font-bold tracking-tight text-white/50 uppercase">Sincronizando sistema...</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Premium Glass Header */}
      <div className="absolute top-0 inset-x-0 h-24 bg-zinc-950/40 backdrop-blur-3xl border-b border-white/5 z-[100] flex items-center justify-between px-10">
        <div className="flex items-center gap-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleStop}
            className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
          >
            <ArrowLeft className="h-6 w-6 text-white" />
          </Button>

          <div className="flex flex-col border-l border-white/10 pl-8">
            <h1 className="text-white font-black text-2xl tracking-tighter leading-none mb-2 truncate max-w-md">
              {property?.title}
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest truncate max-w-sm">
                {customDestination ? customDestination.address : property?.address}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Layer */}
      <div className="absolute inset-0 z-0 pt-24">
        <NavigationMap
          currentPosition={currentPosition}
          destination={destination}
          route={route}
          shouldCenter={shouldCenter}
        />
      </div>

      {/* Address Search Overlay */}
      {!hasArrived && (
        <AddressSearchBar 
          onLocationSelected={(lat, lng, address) => {
            setCustomDestination({ lat, lng, address });
          }}
        />
      )}

      {/* Current Instruction Overlay */}
      <CurrentInstruction step={currentStep} />

      {/* Collapsible Hoja de Ruta Panel */}
      {showFullInstructions && (
        <div className="absolute inset-y-0 right-0 w-[450px] z-[500] pt-24 animate-in slide-in-from-right duration-500 shadow-[-50px_0_100px_rgba(0,0,0,0.5)]">
          <RouteInstructions
            steps={route?.steps || []}
            currentStepIndex={currentStepIndex}
          />
        </div>
      )}

      {/* Lower Controls Overlay */}
      <NavigationControls
        onStop={handleStop}
        onCenter={handleCenter}
        onModeChange={handleModeChange}
        currentMode={mode}
        distanceRemaining={route?.distance || 0}
        timeRemaining={route?.duration || 0}
        onToggleList={() => setShowFullInstructions(!showFullInstructions)}
        isListOpen={showFullInstructions}
      />

      {/* Status Notifications */}
      <div className="absolute top-64 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-[200] space-y-4">
        {loading && (
          <div className="flex items-center justify-center p-8 bg-zinc-950/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-3xl text-white">
            <Loader2 className="h-8 w-8 animate-spin mr-5 text-primary" />
            <span className="font-black text-xl tracking-tight uppercase">Sincronizando ruta...</span>
          </div>
        )}

        {isOffRoute && (
          <Alert variant="destructive" className="bg-red-950/90 text-white backdrop-blur-3xl border-red-500/20 shadow-3xl rounded-[2.5rem] p-8 animate-in slide-in-from-top-4 duration-500">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <AlertTitle className="font-black text-2xl mb-1 uppercase tracking-tighter">¡Fuera de curso!</AlertTitle>
              <AlertDescription className="text-lg font-medium opacity-80 leading-tight">
                Recalculando un nuevo punto de intersección para su ruta.
              </AlertDescription>
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="bg-red-600 text-white border-none shadow-3xl rounded-[2.5rem] p-8">
            <AlertCircle className="h-8 w-8" />
            <div className="ml-4">
              <AlertTitle className="font-black text-xl mb-2">Error Crítico</AlertTitle>
              <AlertDescription className="text-lg opacity-95">
                {error}
                <Button
                  variant="secondary"
                  size="lg"
                  className="mt-6 w-full font-black rounded-2xl h-14 text-lg bg-white text-black hover:bg-zinc-200"
                  onClick={() => startNavigation()}
                >
                  FORZAR REINTENTO
                </Button>
              </AlertDescription>
            </div>
          </Alert>
        )}
      </div>

      {/* Arrival Overlay (Resolución Funcional 1) */}
      {hasArrived && (
        <div className="absolute inset-0 z-[1000] bg-zinc-950/90 backdrop-blur-3xl flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-700">
          <div className="p-10 bg-primary/10 rounded-[3rem] border border-primary/20 mb-10 relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 p-6 bg-primary rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.6)]">
              <MapPin className="h-10 w-10 text-white fill-white/20" />
            </div>
            <h2 className="text-5xl font-black text-white tracking-tighter mb-4 mt-6">
              ¡HAS LLEGADO!
            </h2>
            <p className="text-xl font-bold text-white/50 max-w-sm mx-auto">
              Has alcanzado tu destino en {property?.title}. ¡Esperamos que tengas una excelente estadía!
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Button 
              onClick={handleStop}
              className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-2xl shadow-primary/30 flex-1"
            >
              FINALIZAR NAVEGACIÓN
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationView;
