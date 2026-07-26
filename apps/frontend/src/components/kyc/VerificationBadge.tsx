/**
 * VerificationBadge Component
 * 
 * Displays a user's KYC verification level badge (0-5)
 * 
 * Requirements: 2.7 - Show verification level badge in user profile
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, ShieldOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VerificationBadgeProps {
  level: number; // 0-5
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const LEVEL_CONFIG = {
  0: {
    label: 'Sin verificar',
    description: 'Usuario no verificado',
    color: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
    icon: ShieldOff,
  },
  1: {
    label: 'Email verificado',
    description: 'Email confirmado',
    color: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    icon: ShieldAlert,
  },
  2: {
    label: 'Documentos enviados',
    description: 'Documentos cargados, pendiente de revisión',
    color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
    icon: ShieldAlert,
  },
  3: {
    label: 'Documentos aprobados',
    description: 'Documentos de identidad aprobados',
    color: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
    icon: ShieldCheck,
  },
  4: {
    label: 'Biometría aprobada',
    description: 'Verificación biométrica completada',
    color: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
    icon: ShieldCheck,
  },
  5: {
    label: 'Completamente verificado',
    description: 'Verificación completa aprobada por operador',
    color: 'bg-green-100 text-green-700 hover:bg-green-100',
    icon: ShieldCheck,
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ 
  level, 
  showLabel = true,
  size = 'md' 
}) => {
  // Clamp level to 0-5 range
  const clampedLevel = Math.max(0, Math.min(5, level));
  const config = LEVEL_CONFIG[clampedLevel as keyof typeof LEVEL_CONFIG];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            className={`${config.color} ${sizeClasses[size]} flex items-center gap-1.5 cursor-help`}
          >
            <Icon className={iconSizes[size]} />
            {showLabel && <span>Nivel {clampedLevel}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VerificationBadge;
