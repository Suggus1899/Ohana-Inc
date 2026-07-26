/**
 * KYCClientStatus Component
 *
 * Shows the KYC verification status in the client dashboard.
 * - not_started → iniciar verification
 * - pending → "En proceso"
 * - approved → "Completada", no re-submit
 * - rejected → motivo + reintentar
 *
 * Requirements: Previene reenvío si ya está aprobado.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, ShieldOff, ShieldAlert, Clock, CheckCircle2, XCircle, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { KYCFlow } from './KYCFlow';
import { KYCErrorBoundary } from './KYCErrorBoundary';
import { formatErrorForUser, ErrorMessage } from '@/utils/kycErrorMessages';
import { useAuth } from '@/contexts/AuthContext';

type KYCStatusValue = 'not_started' | 'documents_uploaded' | 'pending_review' | 'under_review' | 'approved' | 'rejected' | 'loading' | 'error';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; description: string }> = {
  not_started: {
    label: 'Sin verificar',
    color: 'bg-gray-100 text-gray-700',
    icon: ShieldOff,
    description: 'Aún no has iniciado el proceso de verificación.',
  },
  documents_uploaded: {
    label: 'Documentos enviados',
    color: 'bg-yellow-100 text-yellow-700',
    icon: ShieldAlert,
    description: 'Tus documentos han sido recibidos y están en espera de revisión.',
  },
  pending_review: {
    label: 'Pendiente de revisión',
    color: 'bg-yellow-100 text-yellow-700',
    icon: Clock,
    description: 'Tu verificación está siendo revisada por un operador.',
  },
  under_review: {
    label: 'En revisión',
    color: 'bg-blue-100 text-blue-700',
    icon: Loader2,
    description: 'Un operador está revisando tus documentos actualmente.',
  },
  approved: {
    label: 'Verificado',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle2,
    description: 'Tu identidad ha sido verificada exitosamente.',
  },
  rejected: {
    label: 'Rechazado',
    color: 'bg-red-100 text-red-700',
    icon: XCircle,
    description: 'Tu verificación no pudo ser completada. Revisa el motivo e intenta de nuevo.',
  },
};

interface KYCStatusData {
  verificationId: number | null;
  status: string;
  verificationLevel: number;
  createdAt: string | null;
  updatedAt: string | null;
  expiresAt: string | null;
}

export const KYCClientStatus: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<KYCStatusValue>('loading');
  const [data, setData] = useState<KYCStatusData | null>(null);
  const [showKYCFlow, setShowKYCFlow] = useState(false);
  const [error, setError] = useState<ErrorMessage | null>(null);

  const fetchStatus = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const res = await api.getKYCStatus();
      if (res.success && res.data) {
        setData(res.data);
        setStatus((res.data.status || 'not_started') as KYCStatusValue);
      } else {
        setStatus('error');
        setError({ title: 'Error', message: 'No se pudo obtener el estado de verificación.' });
      }
    } catch (err) {
      setStatus('error');
      const msg = formatErrorForUser(err instanceof Error ? err : new Error('Failed to fetch KYC status'));
      setError(msg);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleKYCComplete = useCallback(() => {
    setShowKYCFlow(false);
    fetchStatus(); // refresh status after completion
  }, [fetchStatus]);

  const handleKYCError = useCallback((_error: Error) => {
    setShowKYCFlow(false);
    fetchStatus();
  }, [fetchStatus]);

  // Show KYCFlow inline if user is starting/re-starting
  if (showKYCFlow) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setShowKYCFlow(false)} className="mb-2">
          ← Volver
        </Button>
        <KYCErrorBoundary onError={handleKYCError}>
          <KYCFlow
            userId={user?.id ?? 0} /* userId from auth context */
            onComplete={handleKYCComplete}
            onError={handleKYCError}
          />
        </KYCErrorBoundary>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando estado de verificación...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldOff className="h-5 w-5" />
            Verificación KYC
          </CardTitle>
          <CardDescription>Estado de tu verificación de identidad</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{error?.title || 'Error'}</AlertTitle>
            <AlertDescription>{error?.message || 'Error al cargar estado de verificación.'}</AlertDescription>
          </Alert>
          <Button variant="outline" className="mt-4" onClick={fetchStatus}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Verificación KYC
        </CardTitle>
        <CardDescription>Estado de tu verificación de identidad</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Status badge section */}
        <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg mb-6">
          <div className={`p-2 rounded-full ${config.color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${config.color} border-0 text-sm px-3 py-1`}>
                {config.label}
              </Badge>
              {status === 'approved' && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Nivel {data?.verificationLevel ?? 0}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {config.description}
            </p>
          </div>
        </div>

        {/* Approved: no re-submit */}
        {status === 'approved' && data && (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Verificación completada</AlertTitle>
              <AlertDescription className="text-green-700">
                Tu identidad ya ha sido verificada. No es necesario realizar otra verificación.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Estado:</span>
                <p className="font-medium capitalize">{status.replace('_', ' ')}</p>
              </div>
              {data.updatedAt && (
                <div>
                  <span className="text-muted-foreground">Aprobado el:</span>
                  <p className="font-medium">{new Date(data.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              )}
              {data.expiresAt && (
                <div>
                  <span className="text-muted-foreground">Válido hasta:</span>
                  <p className="font-medium">{new Date(data.expiresAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending: show status info, cannot re-submit */}
        {(status === 'documents_uploaded' || status === 'pending_review' || status === 'under_review') && (
          <div className="space-y-4">
            <Alert className="bg-yellow-50 border-yellow-200">
              <Clock className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Verificación en proceso</AlertTitle>
              <AlertDescription className="text-yellow-700">
                Tus documentos están siendo revisados. Te notificaremos cuando haya una actualización.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {data?.createdAt && (
                <div>
                  <span className="text-muted-foreground">Enviado el:</span>
                  <p className="font-medium">{new Date(data.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              )}
              {data?.updatedAt && (
                <div>
                  <span className="text-muted-foreground">Última actualización:</span>
                  <p className="font-medium">{new Date(data.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              No puedes iniciar una nueva verificación mientras haya una en curso.
            </p>
          </div>
        )}

        {/* Rejected: show reason + retry */}
        {status === 'rejected' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Verificación rechazada</AlertTitle>
              <AlertDescription>
                Tu verificación no pudo ser completada. Puedes intentar de nuevo con documentos corregidos.
              </AlertDescription>
            </Alert>
            <Button onClick={() => setShowKYCFlow(true)} className="w-full sm:w-auto">
              Reintentar verificación
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Not started: can start */}
        {status === 'not_started' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para acceder a todas las funciones de la plataforma, necesitas verificar tu identidad.
              El proceso toma solo unos minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => setShowKYCFlow(true)}>
                Iniciar Verificación
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KYCClientStatus;
