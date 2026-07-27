/**
 * WebcamCapture Component
 * 
 * React component for capturing images using webcam in the KYC verification flow.
 * Supports document capture (front/back) and selfie capture with quality validation.
 * 
 * Requirements: 4.1-4.12, 6.1-6.10, 27.1-27.13
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, RotateCcw, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageQualityValidator, ValidationResult } from '@/utils/ImageQualityValidator';

export type DocumentType = 'id_front' | 'id_back' | 'selfie' | 'selfie_with_doc';

export interface WebcamCaptureProps {
  documentType: DocumentType;
  facingMode?: 'user' | 'environment';
  onCapture: (imageData: string) => void;
  onError: (error: string) => void;
  isUploading?: boolean;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  documentType,
  facingMode = 'user',
  onCapture,
  onError,
  isUploading = false,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  // Reset state when documentType changes (step change)
  useEffect(() => {
    setCapturedImage(null);
    setValidationResults([]);
    setCameraReady(false);
    // requestPermissions will run again due to facingMode dependency if it changes,
    // but we want to ensure cameraReady is reset and re-evaluated for each step.
  }, [documentType]);

  // Request camera permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode } 
        });
        // Release the stream immediately - Webcam component will request it again
        stream.getTracks().forEach(track => track.stop());
        setCameraReady(true);
      } catch (_error) {
        setPermissionDenied(true);
        onError('Permiso de cámara denegado. Por favor permite el acceso a la cámara para continuar.');
      }
    };

    requestPermissions();
  }, [facingMode, onError]);

  // Release camera stream when component unmounts or after capture
  useEffect(() => {
    const webcam = webcamRef.current;
    return () => {
      if (webcam?.stream) {
        webcam.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Determine if this is a selfie (should be mirrored)
  const isSelfie = documentType === 'selfie' || documentType === 'selfie_with_doc';

  // Get visual guide type based on document type
  const getGuideType = () => {
    if (documentType === 'selfie' || documentType === 'selfie_with_doc') {
      return 'oval'; // Face guide
    }
    return 'rectangle'; // Document guide
  };

  // Get instructions based on document type
  const getInstructions = () => {
    switch (documentType) {
      case 'id_front':
        return 'Posiciona el frente de tu cédula dentro del marco';
      case 'id_back':
        return 'Posiciona el reverso de tu cédula dentro del marco';
      case 'selfie':
        return 'Posiciona tu rostro dentro del óvalo. Quítate los lentes y gorras.';
      case 'selfie_with_doc':
        return 'Sostén tu cédula junto a tu rostro dentro del marco';
      default:
        return 'Posiciona el documento dentro del marco';
    }
  };

  // Capture photo from webcam
  const handleCapture = useCallback(async () => {
    if (!webcamRef.current) {
      onError('Cámara no lista');
      return;
    }

    try {
      // Capture image as JPEG with quality 90
      const imageSrc = webcamRef.current.getScreenshot({
        width: 1920,
        height: 1080,
      });

      if (!imageSrc) {
        onError('Error al capturar imagen');
        return;
      }

      setCapturedImage(imageSrc);
      setIsValidating(true);

      // Validate image quality
      const results = await ImageQualityValidator.validateAll(imageSrc);
      setValidationResults(results);
      setIsValidating(false);

      // Check if all validations passed
      if (!ImageQualityValidator.allValidationsPassed(results)) {
        // Show validation errors but keep the preview
        return;
      }

      // Release camera stream after successful capture
      if (webcamRef.current.stream) {
        webcamRef.current.stream.getTracks().forEach(track => track.stop());
      }
    } catch (error) {
      setIsValidating(false);
      onError(error instanceof Error ? error.message : 'Error al capturar imagen');
    }
  }, [onError]);

  // Retake photo
  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setValidationResults([]);
    setCameraReady(true);
  }, []);

  // Confirm and continue
  const handleConfirm = useCallback(() => {
    if (!capturedImage) {
      onError('No se capturó ninguna imagen');
      return;
    }

    // Check if validations passed
    if (!ImageQualityValidator.allValidationsPassed(validationResults)) {
      onError('La validación de calidad de imagen falló. Por favor vuelve a tomar la foto.');
      return;
    }

    onCapture(capturedImage);
  }, [capturedImage, validationResults, onCapture, onError]);

  // Handle webcam errors
  const handleWebcamError = useCallback((error: string | DOMException) => {
    console.error('Webcam error:', error);
    setPermissionDenied(true);
    onError('Error de cámara: ' + (typeof error === 'string' ? error : error.message));
  }, [onError]);

  // Render permission denied message
  if (permissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertCircle className="w-16 h-16 text-destructive" />
        <h3 className="text-lg font-semibold">Se Requiere Permiso de Cámara</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Por favor permite el acceso a la cámara en la configuración de tu navegador para capturar fotos para la verificación.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Instructions */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">{getInstructions()}</p>
      </div>

      {/* Webcam or Preview */}
      <div className="relative w-full max-w-2xl mx-auto aspect-video bg-black rounded-lg overflow-hidden">
        {!capturedImage ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.9}
              videoConstraints={{
                facingMode,
                width: 1920,
                height: 1080,
              }}
              mirrored={isSelfie}
              onUserMedia={() => setCameraReady(true)}
              onUserMediaError={handleWebcamError}
              className="w-full h-full object-cover"
            />
            
            {/* Visual Guide Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {getGuideType() === 'oval' ? (
                <div className="w-64 h-80 border-4 border-white/50 rounded-full" />
              ) : (
                <div className="w-96 h-60 border-4 border-white/50 rounded-lg" />
              )}
            </div>
          </>
        ) : (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Validation Results */}
      {validationResults.length > 0 && (
        <div className="space-y-2">
          {validationResults.map((result, index) => (
            <Alert
              key={index}
              variant={result.isValid ? 'default' : 'destructive'}
            >
              <AlertDescription className="flex items-center gap-2">
                {result.isValid ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {result.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {!capturedImage ? (
          <Button
            onClick={handleCapture}
            disabled={!cameraReady || isValidating || isUploading}
            size="lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            {isUploading ? 'Subiendo...' : 'Capturar'}
          </Button>
        ) : (
          <>
            <Button
              onClick={handleRetake}
              variant="outline"
              size="lg"
              disabled={isUploading}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Tomar de Nuevo
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!ImageQualityValidator.allValidationsPassed(validationResults) || isUploading}
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Confirmar y Continuar
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Loading State */}
      {isValidating && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Validando calidad de imagen...</p>
        </div>
      )}
    </div>
  );
};
