import { Card, CardContent } from '@/components/ui/card';
import {
  Crosshair,
  X,
  Footprints,
  Bike,
  Car,
  Map as MapIcon,
  Navigation,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationControlsProps {
  onStop: () => void;
  onCenter: () => void;
  onModeChange: (mode: 'foot' | 'bike' | 'car') => void;
  currentMode: 'foot' | 'bike' | 'car';
  distanceRemaining: number;
  timeRemaining: number;
  onToggleList: () => void;
  isListOpen: boolean;
}

const NavigationControls = ({
  onStop,
  onCenter,
  onModeChange,
  currentMode,
  distanceRemaining,
  timeRemaining,
  onToggleList,
  isListOpen
}: NavigationControlsProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 1) return 'Llegada inmediata';
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl z-[1000] flex flex-col gap-4 animate-in slide-in-from-bottom-10 duration-700">
      <Card className="shadow-[0_25px_60px_rgba(0,0,0,0.4)] border-white/10 backdrop-blur-3xl bg-zinc-900/80 rounded-[2.5rem] overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-6">
            {/* Stats Section */}
            <div className="flex items-center gap-5">
              <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/30">
                <Navigation className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white tracking-tighter leading-none">
                  {formatTime(timeRemaining)}
                </span>
                <span className="text-sm font-bold text-white/50 mt-1">
                  {formatDistance(distanceRemaining)} • {currentMode === 'foot' ? 'Caminando' : currentMode === 'bike' ? 'En bici' : 'En auto'}
                </span>
              </div>
            </div>

            {/* Mode & Tools Selector */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex bg-white/5 p-1 rounded-2xl border border-white/5">
                {[
                  { id: 'foot', icon: Footprints },
                  { id: 'bike', icon: Bike },
                  { id: 'car', icon: Car }
                ].map((mode) => (
                  <Button
                    key={mode.id}
                    variant="ghost"
                    size="icon"
                    className={`h-11 w-11 rounded-xl transition-all ${
                      currentMode === mode.id 
                        ? 'bg-primary text-white shadow-lg' 
                        : 'text-white/40 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={() => onModeChange(mode.id as 'foot' | 'bike' | 'car')}
                  >
                    <mode.icon className="h-5 w-5" />
                  </Button>
                ))}
              </div>

              <div className="h-8 w-[1px] bg-white/10 hidden sm:block mx-1" />

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={onCenter}
                  className="h-12 w-12 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <Crosshair className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={onToggleList}
                  className={`h-12 w-12 rounded-2xl border-white/10 bg-white/5 text-white transition-all ${isListOpen ? 'bg-primary border-none' : 'hover:bg-white/10'}`}
                >
                  <MapIcon className="h-5 w-5" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  onClick={onStop}
                  className="h-12 w-12 rounded-2xl shadow-lg shadow-destructive/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Small handle indicator for drawer feeling */}
      {!isListOpen && (
        <button 
          onClick={onToggleList}
          className="self-center flex flex-col items-center gap-1 group opacity-50 hover:opacity-100 transition-opacity"
        >
          <ChevronUp className="h-4 w-4 text-white animate-bounce" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Ver Hoja de Ruta</span>
        </button>
      )}
    </div>
  );
};

export default NavigationControls;
