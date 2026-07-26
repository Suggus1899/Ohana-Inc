import { Card, CardContent } from '@/components/ui/card';
import {
  Navigation,
  MapPin,
  CornerUpLeft,
  CornerUpRight,
  ArrowUpLeft,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import { RouteStep } from '@/services/routingService';

interface CurrentInstructionProps {
  step: RouteStep | null;
}

const CurrentInstruction = ({ step }: CurrentInstructionProps) => {
  if (!step) return null;

  const getIcon = (type: string, modifier?: string) => {
    if (type === 'depart') return <Navigation className="h-8 w-8 text-white fill-white/20" />;
    if (type === 'arrive') return <MapPin className="h-8 w-8 text-white fill-white/20" />;

    switch (modifier) {
      case 'left':
      case 'sharp left':
        return <CornerUpLeft className="h-8 w-8 text-white" />;
      case 'right':
      case 'sharp right':
        return <CornerUpRight className="h-8 w-8 text-white" />;
      case 'slight left':
        return <ArrowUpLeft className="h-8 w-8 text-white/80" />;
      case 'slight right':
        return <ArrowUpRight className="h-8 w-8 text-white/80" />;
      default:
        return <ChevronRight className="h-8 w-8 text-white/50" />;
    }
  };

  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-xl z-[1000] animate-in slide-in-from-top-4 duration-500">
      <Card className="bg-zinc-900/90 shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-3xl rounded-[2rem] overflow-hidden text-white">
        <CardContent className="p-5 flex items-center gap-5">
          <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
            {getIcon(step.maneuver.type, step.maneuver.modifier)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-black leading-tight tracking-tight uppercase truncate">
              {step.instruction}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 opacity-60">
              <span className="text-sm font-bold">
                PRÓXIMA MANIOBRA
              </span>
              {step.name && step.name !== 'Calle sin nombre' && (
                <>
                  <span className="text-white/40 text-xs">•</span>
                  <span className="text-sm truncate italic">{step.name}</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrentInstruction;
