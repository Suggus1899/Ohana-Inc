/**
 * KYCErrorBoundary Component
 * 
 * React Error Boundary specifically for KYC components.
 * Catches React errors, displays user-friendly messages, and provides retry functionality.
 * 
 * Requirements: 30.1-30.11
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class KYCErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for debugging
    console.error('KYC Error Boundary caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Reset error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;

      return (
        <div className="w-full px-0 sm:px-4 py-4 sm:py-6">
          <Card className="border-destructive">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive shrink-0" />
                <CardTitle className="text-destructive text-base sm:text-lg">Error en la Verificación</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Ha ocurrido un error inesperado durante el proceso de verificación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
              <Alert variant="destructive">
                <AlertTitle>Detalles del Error</AlertTitle>
                <AlertDescription>
                  {error?.message || 'Error desconocido'}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">¿Qué puedes hacer?</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Haz clic en "Reintentar" para volver a intentar</li>
                  <li>Recarga la página si el problema persiste</li>
                  <li>Verifica tu conexión a internet</li>
                  <li>Si el error continúa, contacta con soporte técnico</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex items-center gap-2 text-xs sm:text-sm"
                  size="sm"
                >
                  <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Reintentar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="text-xs sm:text-sm"
                  size="sm"
                >
                  Recargar
                </Button>
              </div>

              {/* Show error details in development */}
              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="mt-4 p-4 bg-muted rounded-md">
                  <summary className="cursor-pointer text-sm font-semibold mb-2">
                    Detalles Técnicos (Solo en Desarrollo)
                  </summary>
                  <pre className="text-xs overflow-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
