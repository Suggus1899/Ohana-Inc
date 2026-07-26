/**
 * VerificationRestrictionAlert Component
 * 
 * Displays restriction messages when user doesn't have sufficient verification level
 * 
 * Requirements: 2.1-2.7 - Show restriction messages based on verification level
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShieldAlert, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VerificationRestrictionAlertProps {
  currentLevel: number;
  requiredLevel: number;
  action: string; // e.g., "solicitar una propiedad", "publicar una propiedad", "recibir pagos"
  userRole?: 'cliente' | 'propietario' | 'operator' | 'estudiante';
}

const LEVEL_NAMES = {
  0: 'Sin verificar',
  1: 'Email verificado',
  2: 'Documentos enviados',
  3: 'Documentos aprobados',
  4: 'Biometría aprobada',
  5: 'Completamente verificado',
};

export const VerificationRestrictionAlert: React.FC<VerificationRestrictionAlertProps> = ({
  currentLevel,
  requiredLevel,
  action,
  userRole = 'cliente',
}) => {
  const navigate = useNavigate();

  const handleVerifyClick = () => {
    // Navigate to verification section based on role
    if (userRole === 'cliente') {
      navigate('/cliente');
      // TODO: Set active section to 'verificacion' after navigation
    } else if (userRole === 'estudiante') {
      navigate('/estudiante');
      // TODO: Set active section to 'verificacion' after navigation
    } else if (userRole === 'propietario') {
      navigate('/propietario');
      // TODO: Set active section to 'verificacion' after navigation
    }
  };

  const getRequiredLevelName = () => {
    return LEVEL_NAMES[requiredLevel as keyof typeof LEVEL_NAMES] || `Nivel ${requiredLevel}`;
  };

  const getCurrentLevelName = () => {
    return LEVEL_NAMES[currentLevel as keyof typeof LEVEL_NAMES] || `Nivel ${currentLevel}`;
  };

  return (
    <Alert variant="destructive" className="border-orange-200 bg-orange-50">
      <ShieldAlert className="h-5 w-5 text-orange-600" />
      <AlertTitle className="text-orange-900 font-semibold">
        Verificación Requerida
      </AlertTitle>
      <AlertDescription className="text-orange-800 space-y-3">
        <p>
          Para {action}, necesitas tener nivel de verificación <strong>{getRequiredLevelName()}</strong>.
        </p>
        <p>
          Tu nivel actual es: <strong>{getCurrentLevelName()}</strong>
        </p>
        <div className="flex items-start gap-2 mt-3">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p className="text-sm">
            Completa el proceso de verificación de identidad para acceder a esta funcionalidad.
          </p>
        </div>
        <Button 
          onClick={handleVerifyClick}
          className="mt-3 bg-orange-600 hover:bg-orange-700 text-white"
        >
          Iniciar Verificación
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default VerificationRestrictionAlert;
