import { RouteStep } from '@/services/routingService';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowRight, 
  ArrowUpRight, 
  ArrowUpLeft, 
  MapPin, 
  Navigation, 
  CornerUpLeft, 
  CornerUpRight,
  ChevronRight,
  Circle,
  Clock
} from 'lucide-react';

interface RouteInstructionsProps {
  steps: RouteStep[];
  currentStepIndex: number;
}

const RouteInstructions = ({ steps, currentStepIndex }: RouteInstructionsProps) => {
  const getIcon = (type: string, modifier?: string) => {
    if (type === 'depart') return <Navigation className="h-6 w-6 text-primary fill-primary/20" />;
    if (type === 'arrive') return <MapPin className="h-6 w-6 text-red-500 fill-red-500/20" />;
    
    switch (modifier) {
      case 'left':
      case 'sharp left':
        return <CornerUpLeft className="h-6 w-6 text-white" />;
      case 'right':
      case 'sharp right':
        return <CornerUpRight className="h-6 w-6 text-white" />;
      case 'slight left':
        return <ArrowUpLeft className="h-6 w-6 text-white/60" />;
      case 'slight right':
        return <ArrowUpRight className="h-6 w-6 text-white/60" />;
      case 'straight':
        return <Navigation className="h-6 w-6 text-white/40" />;
      default:
        return <ChevronRight className="h-6 w-6 text-white/30" />;
    }
  };

  const currentStep = steps[currentStepIndex];

  return (
    <div className="flex flex-col h-full bg-zinc-900/95 backdrop-blur-3xl border-l border-white/5">
      {/* Current Instruction Header */}
      <div className="p-10 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-3 mb-6">
           <Clock className="h-4 w-4 text-primary" />
           <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">
            Próximos Pasos
          </h3>
        </div>
        {currentStep ? (
          <div className="flex items-start gap-6 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="p-4 bg-primary rounded-2xl shadow-xl shadow-primary/20">
              {getIcon(currentStep.maneuver.type, currentStep.maneuver.modifier)}
            </div>
            <div>
              <p className="text-2xl font-black text-white leading-tight uppercase tracking-tighter">
                {currentStep.instruction}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-black text-primary uppercase">FALTAN</span>
                <span className="text-lg font-mono text-white/40">
                    {Math.round(currentStep.distance)}m
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-white/40 font-bold italic">Inicializando sistema...</p>
        )}
      </div>

      {/* Full List */}
      <Card className="flex-1 border-none shadow-none rounded-none bg-transparent">
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="p-6 space-y-2">
            {steps.map((step, index) => {
              const isPast = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div 
                  key={index} 
                  className={`group flex gap-6 p-5 rounded-[2rem] transition-all duration-500 ${
                    isCurrent 
                      ? 'bg-primary/10 border border-primary/20 scale-[1.03] shadow-2xl' 
                      : isPast 
                        ? 'opacity-20 grayscale-[1]' 
                        : 'hover:bg-white/5 opacity-80'
                  }`}
                >
                  <div className="relative flex flex-col items-center">
                    <div className={`z-10 p-2.5 rounded-xl bg-zinc-800 border border-white/5 shadow-xl transition-all ${
                      isCurrent ? 'ring-2 ring-primary ring-offset-4 ring-offset-zinc-900 scale-110' : ''
                    }`}>
                      {getIcon(step.maneuver.type, step.maneuver.modifier)}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-[2px] h-full absolute top-12 ${
                        isPast ? 'bg-primary/20' : 'bg-white/5 border-l border-dashed border-white/10'
                      }`} />
                    )}
                  </div>
                  
                  <div className="flex-1 pt-1 min-w-0">
                    <p className={`font-black text-lg transition-colors leading-tight uppercase tracking-tight ${
                      isCurrent ? 'text-white' : 'text-white/40'
                    }`}>
                      {step.instruction}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs font-black text-primary">
                        {Math.round(step.distance)}M
                      </span>
                      {step.name && step.name !== 'Calle sin nombre' && (
                        <>
                          <Circle className="h-1 w-1 fill-white/20 text-white/20" />
                          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest truncate">
                            {step.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};

export default RouteInstructions;
