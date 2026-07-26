/**
 * KYCFlow Component
 * 
 * Main orchestrator component for the complete KYC verification flow.
 * Manages a 6-step process: ID front, ID back, selfie, selfie with doc, liveness, processing.
 * 
 * Requirements: 26.1-26.12, 30.1-30.11, 31.1-31.5
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Check, Circle, Loader2, AlertCircle, ShieldCheck, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { WebcamCapture, DocumentType } from './WebcamCapture';
import { LivenessCapture } from './LivenessCapture';
import { ConsentScreen } from './ConsentScreen';
import { api } from '@/services/api';
import { retryWithBackoff } from '@/utils/retryWithBackoff';
import { formatErrorForUser, ErrorMessage } from '@/utils/kycErrorMessages';

// KYC Step enum
export enum KYCStep {
  ID_FRONT = 0,
  ID_BACK = 1,
  SELFIE = 2,
  SELFIE_WITH_DOC = 3,
  LIVENESS = 4,
  PROCESSING = 5,
}

// Step configuration
const documentTypeMap: Record<string, keyof CapturedDocuments> = {
  'id_front': 'idFront',
  'id_back': 'idBack',
  'selfie': 'selfie',
  'selfie_with_doc': 'selfieWithDoc',
};

const STEP_CONFIG = [
  {
    step: KYCStep.ID_FRONT,
    title: 'Cédula - Frontal',
    description: 'Captura el frente de tu cédula',
    documentType: 'id_front' as DocumentType,
    facingMode: 'environment' as const,
    instructions: 'Posiciona tu cédula dentro del marco. Asegúrate de que todo el texto sea claramente visible y la imagen esté bien iluminada.',
  },
  {
    step: KYCStep.ID_BACK,
    title: 'Cédula - Reverso',
    description: 'Captura el reverso de tu cédula',
    documentType: 'id_back' as DocumentType,
    facingMode: 'environment' as const,
    instructions: 'Ahora captura el reverso de tu cédula. Asegúrate de que toda la información sea legible.',
  },
  {
    step: KYCStep.SELFIE,
    title: 'Selfie',
    description: 'Toma una foto selfie',
    documentType: 'selfie' as DocumentType,
    facingMode: 'user' as const,
    instructions: 'Toma una foto clara de tu rostro. Quítate los lentes, gorras y asegúrate de tener buena iluminación.',
  },
  {
    step: KYCStep.SELFIE_WITH_DOC,
    title: 'Selfie con Cédula',
    description: 'Toma una selfie sosteniendo tu cédula',
    documentType: 'selfie_with_doc' as DocumentType,
    facingMode: 'user' as const,
    instructions: 'Sostén tu cédula junto a tu rostro. Tanto tu cara como la cédula deben ser claramente visibles.',
  },
  {
    step: KYCStep.LIVENESS,
    title: 'Detección de Vida',
    description: 'Graba un video corto',
    documentType: 'liveness_video' as DocumentType,
    facingMode: 'user' as const,
    instructions: 'Sigue las instrucciones en pantalla para realizar los gestos. Esto verifica que eres una persona real.',
  },
  {
    step: KYCStep.PROCESSING,
    title: 'Procesando',
    description: 'Verificando tus documentos',
    documentType: 'selfie' as DocumentType, // Not used
    facingMode: 'user' as const,
    instructions: 'Por favor espera mientras procesamos tu verificación...',
  },
];

interface CapturedDocuments {
  idFront?: string;
  idBack?: string;
  selfie?: string;
  selfieWithDoc?: string;
  livenessVideo?: string;
}

export interface KYCFlowProps {
  userId: number;
  onComplete: () => void;
  onError: (error: Error) => void;
}

const STORAGE_KEY = 'kyc-progress';

export const KYCFlow: React.FC<KYCFlowProps> = ({ userId, onComplete, onError }) => {
  const [showConsent, setShowConsent] = useState(true);
  const [consentTimestamp, setConsentTimestamp] = useState<Date | null>(null);
  const [currentStep, setCurrentStep] = useState<KYCStep>(KYCStep.ID_FRONT);
  const [verificationId, setVerificationId] = useState<number | null>(null);
  const [capturedDocuments, setCapturedDocuments] = useState<CapturedDocuments>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<ErrorMessage | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [showManualRetry, setShowManualRetry] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  // Handle consent acceptance
  const handleConsentAccept = useCallback((timestamp: Date) => {
    setConsentTimestamp(timestamp);
    setShowConsent(false);
  }, []);

  // Handle consent cancellation
  const handleConsentCancel = useCallback(() => {
    // User cancelled consent, call onError to close the flow
    onError(new Error('User cancelled consent'));
  }, [onError]);

  // Handle capture error
  const handleCaptureError = useCallback((errorMessage: string) => {
    const errorMsg = formatErrorForUser(new Error(errorMessage));
    setError(errorMsg);
  }, []);

  // Initialize verification
  const initializeVerification = useCallback(async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      setError(null);
      
      const response = await retryWithBackoff(
        async () => {
          const res = await api.request<{ verificationId: number; status: string }>('/kyc/start', {
            method: 'POST',
            body: JSON.stringify({
              consentedAt: consentTimestamp?.toISOString()
            })
          });
          
          if (!res.success) {
            throw new Error(res.error?.message || 'Failed to start verification');
          }
          
          return res;
        },
        {
          maxRetries: 3,
          baseDelay: 1000,
          onRetry: (attempt, err) => {
          },
        }
      );

      if (response.data) {
        setVerificationId(response.data.verificationId);
        setShowManualRetry(false);
      }
    } catch (err) {
      const errorMessage = formatErrorForUser(err instanceof Error ? err : new Error('Failed to initialize verification'));
      setError(errorMessage);
      setShowManualRetry(true);
      onError(err instanceof Error ? err : new Error('Failed to initialize verification'));
    } finally {
      setIsProcessing(false);
    }
  }, [consentTimestamp, onError, isProcessing]);

  // Upload document with retry logic
  const uploadDocument = useCallback(async (documentType: DocumentType, imageData: string): Promise<boolean> => {
    if (!verificationId || isUploading) {
      if (!verificationId) {
        const errorMsg = formatErrorForUser(new Error('VERIFICATION_NOT_FOUND'));
        setError(errorMsg);
      }
      return false;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);
      setShowManualRetry(false);

      // Convert base64 to blob
      const base64Data = imageData.split(',')[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());

      // Create FormData
      const formData = new FormData();
      formData.append('verificationId', verificationId.toString());
      formData.append('documentType', documentType);
      formData.append('file', blob, `${documentType}.jpg`);

      // Upload with progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Use retry with backoff - api.request handles Authorization automatically
      await retryWithBackoff(
        async () => {
          const data = await api.request<{ success: boolean; verificationId?: number; status?: string }>('/kyc/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!data.success) {
            throw new Error(data.error?.code || data.error?.message || 'UPLOAD_FAILED');
          }
          
          return data;
        },
        {
          maxRetries: 3,
          baseDelay: 1000,
          onRetry: (attempt, err) => {
            setRetryCount(attempt);
          },
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);
      setRetryCount(0);

      return true;
    } catch (err) {
      const errorMsg = formatErrorForUser(err instanceof Error ? err : new Error('UPLOAD_FAILED'));
      setError(errorMsg);
      setShowManualRetry(true);
      return false;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [verificationId, isUploading]);

  // Upload video blob
  const uploadVideo = useCallback(async (documentType: DocumentType, videoBlob: Blob): Promise<boolean> => {
    if (!verificationId || isUploading) {
      if (!verificationId) {
        const errorMsg = formatErrorForUser(new Error('VERIFICATION_NOT_FOUND'));
        setError(errorMsg);
      }
      return false;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);
      setShowManualRetry(false);

      // Create FormData
      const formData = new FormData();
      formData.append('verificationId', verificationId.toString());
      formData.append('documentType', documentType);
      formData.append('file', videoBlob, `${documentType}.webm`);

      // Upload with progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Use retry with backoff - api.request handles Authorization automatically
      await retryWithBackoff(
        async () => {
          const data = await api.request<{ success: boolean; verificationId?: number; status?: string }>('/kyc/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!data.success) {
            throw new Error(data.error?.code || data.error?.message || 'UPLOAD_FAILED');
          }
          
          return data;
        },
        {
          maxRetries: 3,
          baseDelay: 1000,
          onRetry: (attempt, err) => {
            setRetryCount(attempt);
          },
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);
      setRetryCount(0);

      return true;
    } catch (err) {
      const errorMsg = formatErrorForUser(err instanceof Error ? err : new Error('UPLOAD_FAILED'));
      setError(errorMsg);
      setShowManualRetry(true);
      return false;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [verificationId, isUploading]);

  // Process verification (called when all documents are uploaded)
  const processVerification = useCallback(async () => {
    if (!verificationId || isProcessing) {
      if (!verificationId) {
        const errorMsg = formatErrorForUser(new Error('VERIFICATION_NOT_FOUND'));
        setError(errorMsg);
      }
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setShowManualRetry(false);

      const response = await retryWithBackoff(
        async () => {
          const res = await api.request<{
            errors: unknown;
            status: string;
            ocrData?: Record<string, unknown>;
            scores?: Record<string, unknown>;
          }>(`/kyc/process/${verificationId}`, {
            method: 'POST',
          });

          if (!res.success) {
            throw new Error(res.error?.code || res.error?.message || 'Processing failed');
          }

          return res;
        },
        {
          maxRetries: 3,
          baseDelay: 2000,
          onRetry: (attempt, err) => {
          },
        }
      );

      if (response.success) {
        // Clear saved progress
        localStorage.removeItem(STORAGE_KEY);
        
        // Call onComplete callback
        onComplete();
      } else {
        // Handle explicit failure from backend processing with detailed errors
        const errorMsg = formatErrorForUser(new Error(response.error?.code || 'RESUBMISSION_REQUIRED'));
        if (response.data?.errors && Array.isArray(response.data.errors) && response.data.errors.length > 0) {
          errorMsg.instructions = [...(errorMsg.instructions || []), ...response.data.errors];
        }
        setError(errorMsg);
        setShowManualRetry(true);
      }
    } catch (err) {
      const errorMsg = formatErrorForUser(err instanceof Error ? err : new Error('Processing failed'));
      setError(errorMsg);
      setShowManualRetry(true);
      onError(err instanceof Error ? err : new Error('Processing failed'));
    } finally {
      setIsProcessing(false);
    }
  }, [verificationId, isProcessing, onComplete, onError]);

  // Handle document capture
  const handleCapture = useCallback(async (imageData: string) => {
    if (isUploading || isProcessing) return;

    const config = STEP_CONFIG[currentStep];
    
    // Save captured document with correct camelCase mapping (Requisito 30.1)
    const documentTypeMap: Record<string, keyof CapturedDocuments> = {
      'id_front': 'idFront',
      'id_back': 'idBack',
      'selfie': 'selfie',
      'selfie_with_doc': 'selfieWithDoc',
    };

    const documentKey = documentTypeMap[config.documentType] || config.documentType as keyof CapturedDocuments;
    setCapturedDocuments(prev => ({
      ...prev,
      [documentKey]: imageData,
    }));

    // Upload document
    const uploadSuccess = await uploadDocument(config.documentType, imageData);
    
    if (uploadSuccess) {
      setRetryCount(0); // Reset retry count on success
      
      // Move to next step (Requisito 30.2)
      if (currentStep < KYCStep.PROCESSING) {
        setCurrentStep(prev => prev + 1);
      }
    }
  }, [currentStep, isUploading, isProcessing, uploadDocument]);

  // Handle liveness video capture
  const handleLivenessCapture = useCallback(async (videoBlob: Blob) => {
    if (isUploading || isProcessing) return;

    const config = STEP_CONFIG[currentStep];
    
    // Save captured video (store as data URL for consistency)
    const videoUrl = URL.createObjectURL(videoBlob);
    setCapturedDocuments(prev => ({
      ...prev,
      livenessVideo: videoUrl,
    }));

    // Upload video
    const uploadSuccess = await uploadVideo(config.documentType, videoBlob);
    
    if (uploadSuccess) {
      setRetryCount(0); // Reset retry count on success
      
      // Move to processing step
      setCurrentStep(KYCStep.PROCESSING);
      // Start processing
      processVerification();
    }
  }, [currentStep, isUploading, isProcessing, uploadVideo, processVerification]);

  // Reset flow to start over
  const resetFlow = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentStep(KYCStep.ID_FRONT);
    setVerificationId(null);
    setCapturedDocuments({});
    setError(null);
    setShowManualRetry(false);
    initializeVerification();
  }, [initializeVerification]);

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        if (progress.userId === userId) {
          setCurrentStep(progress.currentStep || KYCStep.ID_FRONT);
          setVerificationId(progress.verificationId || null);
          setCapturedDocuments(progress.capturedDocuments || {});
          
          // If we already have a verification ID, we can skip consent (Requisito 31.6)
          if (progress.verificationId) {
            setShowConsent(false);
          }
        }
      } catch (err) {
        console.error('Failed to restore progress:', err);
      }
    }
  }, [userId]);

  // Check if user is already verified on mount
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const res = await api.request<{ status: string; verificationLevel: number }>('/kyc/status');
        if (res.success && (res.data?.status === 'approved' || res.data?.verificationLevel >= 5)) {
          setIsVerified(true);
          return;
        }
      } catch (err) {
        // No existing verification, showing normal flow
      }
      setIsVerified(false);
    };
    checkVerificationStatus();
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    const progress = {
      userId,
      currentStep,
      verificationId,
      capturedDocuments,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [userId, currentStep, verificationId, capturedDocuments]);

  // Auto-process if restored to processing step (Requisito 30.10)
  useEffect(() => {
    if (currentStep === KYCStep.PROCESSING && verificationId && !isProcessing && !error) {
      processVerification();
    }
  }, [currentStep, verificationId, isProcessing, error, processVerification]);

  // Initialize verification on mount if not already started
  useEffect(() => {
    // Only initialize if consent has been given and verification hasn't started
    if (!verificationId && consentTimestamp && !showConsent) {
      initializeVerification();
    }
  }, [consentTimestamp, showConsent, verificationId, initializeVerification]);

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / STEP_CONFIG.length) * 100;

  // Get step status
  const getStepStatus = (step: KYCStep) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  // Render step indicator
  const renderStepIndicator = (step: KYCStep, index: number) => {
    const status = getStepStatus(step);
    const config = STEP_CONFIG[index];

    return (
      <div key={step} className="flex items-center">
        <div className="flex flex-col items-center">
          <div
            className={`
              w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-colors shrink-0
              ${status === 'completed' ? 'bg-green-500 border-green-500 text-white' : ''}
              ${status === 'current' ? 'bg-blue-500 border-blue-500 text-white' : ''}
              ${status === 'pending' ? 'bg-gray-200 border-gray-300 text-gray-500' : ''}
            `}
          >
            {status === 'completed' ? (
              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Circle className="w-4 h-4 sm:w-5 sm:h-5" fill={status === 'current' ? 'currentColor' : 'none'} />
            )}
          </div>
          <span className="hidden sm:block text-[10px] sm:text-xs mt-1 sm:mt-2 text-center max-w-[80px]">{config.title}</span>
        </div>
        {index < STEP_CONFIG.length - 1 && (
          <div
            className={`
              h-0.5 w-6 sm:w-12 mx-1 sm:mx-2 transition-colors shrink-0
              ${step < currentStep ? 'bg-green-500' : 'bg-gray-300'}
            `}
          />
        )}
      </div>
    );
  };

  const currentConfig = STEP_CONFIG[currentStep];
  
  // Re-define mapping for consistency in rendering
  const documentKey = documentTypeMap[currentConfig.documentType] || currentConfig.documentType as keyof CapturedDocuments;
  const isStepComplete = currentStep < KYCStep.PROCESSING && !!capturedDocuments[documentKey];

// Show verified success page if user is already verified
  if (isVerified === true) {
    return (
      <div className="w-full px-0 sm:px-4 py-4 sm:py-6">
        <Card className="border-green-200">
          <CardHeader className="text-center pb-2 px-4 sm:px-6">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl">¡Identidad Verificada!</CardTitle>
            <CardDescription className="text-sm sm:text-base mt-1 sm:mt-2">
              Tu identidad ya ha sido verificada exitosamente. No necesitas realizar el proceso KYC nuevamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            {/* Verification details */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 space-y-2">
              <div className="flex items-start gap-2 text-green-700">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0" />
                <span className="text-sm sm:text-base font-medium">Nivel de verificación máximo alcanzado</span>
              </div>
              <div className="flex items-start gap-2 text-green-700">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0" />
                <span className="text-sm sm:text-base font-medium">Documentos validados correctamente</span>
              </div>
              <div className="flex items-start gap-2 text-green-700">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0" />
                <span className="text-sm sm:text-base font-medium">Tienes acceso a todas las funcionalidades</span>
              </div>
            </div>

            {/* Info alert */}
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="w-4 h-4 text-blue-600" />
              <AlertTitle className="text-blue-800 text-sm font-medium">Información</AlertTitle>
              <AlertDescription className="text-blue-700 text-sm">
                Si necesitas actualizar tu información de verificación, contacta al soporte.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state while checking
  if (isVerified === null) {
    return (
      <div className="w-full px-0 sm:px-4 py-4 sm:py-6">
        <Card>
          <CardContent className="py-8 sm:py-12">
            <div className="text-center space-y-3 sm:space-y-4">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin mx-auto text-blue-500" />
              <p className="text-sm sm:text-base text-muted-foreground">Verificando estado de tu identidad...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show consent screen first
  if (showConsent) {
    return (
      <ConsentScreen
        onAccept={handleConsentAccept}
        onCancel={handleConsentCancel}
      />
    );
  }

  return (
    <div className="w-full px-0 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
          <CardTitle className="text-lg sm:text-xl">Verificación de Identidad</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Completa todos los pasos para verificar tu identidad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
          {/* Step Indicators */}
          <div className="flex items-center justify-center overflow-x-auto pb-4">
            {STEP_CONFIG.map((config, index) => renderStepIndicator(config.step, index))}
          </div>

          {/* Progress Bar */}
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-sm text-center text-muted-foreground">
            Paso {currentStep + 1} de {STEP_CONFIG.length}
          </p>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{error.title}</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error.message}</p>
            {error.instructions && error.instructions.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold text-sm">¿Qué puedes hacer?</p>
                <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                  {error.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </div>
            )}
            {showManualRetry && (
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    setShowManualRetry(false);
                    if (!verificationId) {
                      initializeVerification();
                    } else if (currentStep === KYCStep.PROCESSING) {
                      processVerification();
                    }
                  }}
                  className="text-xs sm:text-sm"
                >
                  Reintentar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFlow}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs sm:text-sm"
                >
                  Reiniciar
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Step Content */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
          <CardTitle className="text-base sm:text-lg">{currentConfig.title}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{currentConfig.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
          {/* Instructions */}
          <Alert className="px-3 sm:px-4 py-2 sm:py-3">
            <AlertDescription className="text-xs sm:text-sm">{currentConfig.instructions}</AlertDescription>
          </Alert>

          {/* Step Content */}
          {currentStep < KYCStep.LIVENESS && (
            <WebcamCapture
              documentType={currentConfig.documentType}
              facingMode={currentConfig.facingMode}
              onCapture={handleCapture}
              onError={handleCaptureError}
              isUploading={isUploading}
            />
          )}

          {currentStep === KYCStep.LIVENESS && (
            <LivenessCapture
              onCapture={handleLivenessCapture}
              onError={handleCaptureError}
              isUploading={isUploading}
            />
          )}

          {currentStep === KYCStep.PROCESSING && (
            <div className="text-center py-8 sm:py-12 space-y-3 sm:space-y-4">
              <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin mx-auto text-blue-500" />
              <h3 className="text-base sm:text-lg font-semibold">Procesando tu Verificación</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Por favor espera mientras verificamos tus documentos. Esto puede tomar unos momentos...
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Subiendo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Info */}
      <Card>
        <CardContent className="px-4 sm:px-6 pt-4 sm:pt-6">
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            {currentStep < KYCStep.LIVENESS && (
              <>
                Captura una foto clara para continuar. Puedes volver a tomar la foto si es necesario.
                {isStepComplete && ' Haz clic en "Confirmar y Continuar" para proceder al siguiente paso.'}
              </>
            )}
            {currentStep === KYCStep.LIVENESS && (
              'Graba un video siguiendo las instrucciones en pantalla. Completa todos los gestos para continuar.'
            )}
            {currentStep === KYCStep.PROCESSING && (
              'No cierres esta ventana. Te notificaremos una vez que el procesamiento esté completo.'
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
