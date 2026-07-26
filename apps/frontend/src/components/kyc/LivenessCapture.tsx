import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Video, RotateCcw, Check, AlertCircle, Smile, MoveLeft, MoveRight, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

export interface LivenessCaptureProps {
  onCapture: (videoBlob: Blob) => void;
  onError: (error: string) => void;
  isUploading?: boolean;
}

type Gesture = 'smile' | 'turn_left' | 'turn_right' | 'blink';

const GESTURES: Array<{ type: Gesture; label: string; icon: React.ReactNode; instruction: string }> = [
  {
    type: 'smile',
    label: 'Smile',
    icon: <Smile className="w-6 h-6" />,
    instruction: 'Sonríe naturalmente',
  },
  {
    type: 'turn_left',
    label: 'Turn Left',
    icon: <MoveLeft className="w-6 h-6" />,
    instruction: 'Gira tu cabeza a la izquierda',
  },
  {
    type: 'turn_right',
    label: 'Turn Right',
    icon: <MoveRight className="w-6 h-6" />,
    instruction: 'Gira tu cabeza a la derecha',
  },
  {
    type: 'blink',
    label: 'Blink',
    icon: <Eye className="w-6 h-6" />,
    instruction: 'Parpadea naturalmente',
  },
];

const COUNTDOWN_SECONDS = 3;
const MAX_RECORDING_DURATION = 30;
const GESTURE_CONFIRM_FRAMES = 2; // frames consecutivos para confirmar gesto
const GESTURE_DURATION = 3; // segundos por gesto en fallback
const DETECTION_INTERVAL = 250; // ms entre detecciones

// Calcular EAR (Eye Aspect Ratio) para detección de parpadeo
function ear(landmarks: number[][], eyeIndices: number[]): number {
  const p1 = landmarks[eyeIndices[1]];
  const p2 = landmarks[eyeIndices[2]];
  const p3 = landmarks[eyeIndices[3]];
  const p4 = landmarks[eyeIndices[4]];
  const p5 = landmarks[eyeIndices[5]];
  const vertical1 = Math.hypot(p1[0] - p5[0], p1[1] - p5[1]);
  const vertical2 = Math.hypot(p2[0] - p4[0], p2[1] - p4[1]);
  const horizontal = Math.hypot(landmarks[eyeIndices[0]][0] - p3[0], landmarks[eyeIndices[0]][1] - p3[1]);
  return (vertical1 + vertical2) / (2 * horizontal);
}

// Calcular MAR (Mouth Aspect Ratio) para detección de sonrisa
function mar(landmarks: number[][]): number {
  const mouthTop = landmarks[62]; // inner mouth top
  const mouthBottom = landmarks[66]; // inner mouth bottom
  const mouthLeft = landmarks[60]; // inner mouth left corner
  const mouthRight = landmarks[64]; // inner mouth right corner
  const height = Math.hypot(mouthTop[0] - mouthBottom[0], mouthTop[1] - mouthBottom[1]);
  const width = Math.hypot(mouthLeft[0] - mouthRight[0], mouthLeft[1] - mouthRight[1]);
  return width > 0 ? height / width : 0;
}

// Detectar giro de cabeza por posición de la nariz
// Raw video (sin espejar): cuando el usuario gira a su izquierda,
// la nariz se mueve a la DERECHA en la imagen → noseRelX aumenta (→ +1)
function headTurn(landmarks: number[][]): { direction: 'left' | 'right' | 'center'; ratio: number } {
  const noseTip = landmarks[30];
  const leftCheek = landmarks[0];
  const rightCheek = landmarks[16];
  const faceWidth = Math.hypot(leftCheek[0] - rightCheek[0], leftCheek[1] - rightCheek[1]);
  if (faceWidth <= 0) return { direction: 'center', ratio: 0.5 };
  const noseRelX = (noseTip[0] - leftCheek[0]) / faceWidth;
  // noseRelX ~0.5 centrado, >0.5 nariz a la derecha = cabeza girada a la izquierda
  if (noseRelX > 0.52) return { direction: 'left', ratio: noseRelX };
  if (noseRelX < 0.48) return { direction: 'right', ratio: noseRelX };
  return { direction: 'center', ratio: noseRelX };
}

export const LivenessCapture: React.FC<LivenessCaptureProps> = ({
  onCapture,
  onError,
  isUploading = false,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const detectionRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const faceapiRef = useRef<any>(null);
  const modelsLoadedRef = useRef(false);
  const gestureConfirmCountRef = useRef(0);
  const blinkStateRef = useRef<'open' | 'closed'>('open');
  const blinkCountRef = useRef(0);
  const detectingRef = useRef(false);
  const currentGestureIndexRef = useRef(0); // ref sincronizada para evitar stale closures
  const gestureCooldownRef = useRef(false); // evita que el siguiente gesto se detecte inmediatamente

  const [modelsLoading, setModelsLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentGestureIndex, setCurrentGestureIndex] = useState(0);
  const [completedGestures, setCompletedGestures] = useState<Gesture[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar modelos face-api desde public/models/face-api
  useEffect(() => {
    const loadModels = async () => {
      try {
        setModelsLoading(true);
        const faceapi = await import('@vladmandic/face-api');
        faceapiRef.current = faceapi;

        const modelUrl = '/models/face-api';

        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
          faceapi.nets.faceExpressionNet.loadFromUri(modelUrl),
        ]);

        modelsLoadedRef.current = true;
        console.log('[LivenessCapture] Face-api models loaded');
      } catch (err) {
        console.warn('[LivenessCapture] Failed to load face-api models:', err);
      } finally {
        setModelsLoading(false);
      }
    };
    loadModels();
  }, []);

  const requestCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      stream.getTracks().forEach(t => t.stop());
      setCameraReady(true);
    } catch {
      setPermissionDenied(true);
      onError('Camera permission denied.');
    }
  }, [onError]);

  useEffect(() => { requestCamera(); }, [requestCamera]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
      if (detectionRef.current) clearInterval(detectionRef.current);
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      if (webcamRef.current?.stream) webcamRef.current.stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Detección en tiempo real desde la webcam
  const startDetectionLoop = useCallback(() => {
    if (detectionRef.current) clearInterval(detectionRef.current);
    detectingRef.current = true;

    detectionRef.current = setInterval(async () => {
      if (!detectingRef.current || !webcamRef.current?.video || !modelsLoadedRef.current) {
        console.log('[Liveness] ⏭ skip: detecting=', detectingRef.current, 'video=', !!webcamRef.current?.video, 'models=', modelsLoadedRef.current);
        return;
      }

      const video = webcamRef.current.video;
      if (video.readyState < 2) {
        console.log('[Liveness] ⏳ video.readyState=', video.readyState, '(esperando frames...)');
        return;
      }

      try {
        const faceapi = faceapiRef.current;
        // Detectar con landmarks + expresiones
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceExpressions();

        if (detections && detections.length > 0) {
          setFaceDetected(true);
          const det = detections[0];
          const pts = det.landmarks.positions.map((p: any) => [p.x, p.y]);
          const expressions = det.expressions || {};

          const currentType = GESTURES[currentGestureIndexRef.current]?.type;
          if (gestureCooldownRef.current) return;

          if (currentType === 'blink') {
            const leftEye = [36, 37, 38, 39, 40, 41];
            const rightEye = [42, 43, 44, 45, 46, 47];
            const leftEAR = ear(pts, leftEye);
            const rightEAR = ear(pts, rightEye);
            const avgEAR = (leftEAR + rightEAR) / 2;

            if (avgEAR < 0.3 && blinkStateRef.current === 'open') {
              blinkStateRef.current = 'closed';
            } else if (avgEAR >= 0.28 && blinkStateRef.current === 'closed') {
              blinkStateRef.current = 'open';
              blinkCountRef.current += 1;
              // Confirmar con solo 2 parpadeos
              if (blinkCountRef.current >= 2) {
                confirmGesture();
              }
            }
          } else if (currentType === 'smile') {
            const isHappy = expressions.happy > 0.7;
            // Fallback: si el modelo de expresiones no devuelve happy, usar MAR
            if (isHappy) {
              gestureConfirmCountRef.current += 1;
              if (gestureConfirmCountRef.current >= GESTURE_CONFIRM_FRAMES) {
                confirmGesture();
              }
            } else {
              const ratio = mar(pts);
              if (ratio > 0.35) {
                gestureConfirmCountRef.current += 1;
                if (gestureConfirmCountRef.current >= GESTURE_CONFIRM_FRAMES) {
                  confirmGesture();
                }
              } else {
                gestureConfirmCountRef.current = 0;
              }
            }
          } else if (currentType === 'turn_left') {
            const { direction, ratio } = headTurn(pts);
            // DEBUG: ver qué detecta al girar
            console.log('[Liveness] turn_left:', { direction, ratio: ratio.toFixed(3), pts0: pts[0][0].toFixed(0), pts16: pts[16][0].toFixed(0), pts30: pts[30][0].toFixed(0) });
            if (direction === 'left') {
              gestureConfirmCountRef.current += 1;
              if (gestureConfirmCountRef.current >= GESTURE_CONFIRM_FRAMES) {
                confirmGesture();
              }
            } else {
              gestureConfirmCountRef.current = 0;
            }
          } else if (currentType === 'turn_right') {
            const { direction, ratio } = headTurn(pts);
            console.log('[Liveness] turn_right:', { direction, ratio: ratio.toFixed(3) });
            if (direction === 'right') {
              gestureConfirmCountRef.current += 1;
              if (gestureConfirmCountRef.current >= GESTURE_CONFIRM_FRAMES) {
                confirmGesture();
              }
            } else {
              gestureConfirmCountRef.current = 0;
            }
          }
        } else {
          console.log('[Liveness] ❌ Sin detección facial (detections.length=', detections?.length, ')');
          setFaceDetected(false);
        }
      } catch (err) {
        // Silenciar errores de detección para no saturar logs
      }
    }, DETECTION_INTERVAL);
  }, []); // Vacío: usamos ref para leer el índice actual

  const stopDetectionLoop = useCallback(() => {
    detectingRef.current = false;
    if (detectionRef.current) {
      clearInterval(detectionRef.current);
      detectionRef.current = null;
    }
  }, []);

  // Confirmar gesto actual y avanzar
  const confirmGesture = useCallback(() => {
    gestureConfirmCountRef.current = 0;
    blinkCountRef.current = 0;
    blinkStateRef.current = 'open';

    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);

    // Leer el índice desde la ref (siempre actualizado)
    const idx = currentGestureIndexRef.current;
    const gestureType = GESTURES[idx]?.type;
    if (!gestureType) return;

    setCompletedGestures(prev => {
      if (prev.includes(gestureType)) return prev;
      const next = [...prev, gestureType];
      if (next.length === GESTURES.length) {
        stopRecording(false);
      }
      return next;
    });

    if (idx + 1 < GESTURES.length) {
      gestureCooldownRef.current = true;
      setTimeout(() => { gestureCooldownRef.current = false; }, 1200);
      setCurrentGestureIndex(prev => {
        const next = Math.max(prev, idx + 1);
        currentGestureIndexRef.current = next;
        return next;
      });
    }
  }, []); // Vacío: usamos ref para el índice actual

  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_SECONDS);
    setError(null);

    const ci = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(ci);
          setTimeout(() => {
            setCountdown(null);
            startRecording();
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startRecording = useCallback(() => {
    if (!webcamRef.current?.stream) {
      onError('Camera not ready');
      return;
    }

    try {
      chunksRef.current = [];
      setCompletedGestures([]);
      setCurrentGestureIndex(0);
      currentGestureIndexRef.current = 0;
      setRecordingDuration(0);
      gestureConfirmCountRef.current = 0;
      blinkCountRef.current = 0;
      blinkStateRef.current = 'open';

      const mediaRecorder = new MediaRecorder(webcamRef.current.stream, {
        mimeType: 'video/webm;codecs=vp8',
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data?.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        setIsRecording(false);
        stopDetectionLoop();
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const nd = prev + 1;
          if (nd >= MAX_RECORDING_DURATION) { stopRecording(true); return MAX_RECORDING_DURATION; }
          return nd;
        });
      }, 1000);

      // Iniciar detección face-api (si cargó) o fallback por timer
      if (modelsLoadedRef.current) {
        startDetectionLoop();
      } else {
        // Fallback: avanzar por timer si face-api no cargó
        const fallbackInterval = setInterval(() => {
          setCurrentGestureIndex(prevIndex => {
            const newIndex = prevIndex + 1;
            setCompletedGestures(prev => [...prev, GESTURES[prevIndex].type]);
            if (newIndex >= GESTURES.length) {
              clearInterval(fallbackInterval);
              stopRecording(false);
              return prevIndex;
            }
            return newIndex;
          });
        }, GESTURE_DURATION * 1000);
        gestureTimeoutRef.current = fallbackInterval as any;
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, [onError, startDetectionLoop, stopDetectionLoop]);

  const stopRecording = useCallback((timeout = false) => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    stopDetectionLoop();
    if (gestureTimeoutRef.current) { clearTimeout(gestureTimeoutRef.current); gestureTimeoutRef.current = null; }
    if (timeout) setError('Recording exceeded 30 seconds. Please try again.');
  }, [stopDetectionLoop]);

  const handleRetry = useCallback(() => {
    setVideoBlob(null);
    setError(null);
    setCompletedGestures([]);
    setCurrentGestureIndex(0);
    setRecordingDuration(0);
    setFaceDetected(false);
    chunksRef.current = [];
    blinkCountRef.current = 0;
    blinkStateRef.current = 'open';
    gestureConfirmCountRef.current = 0;
  }, []);

  const handleConfirm = useCallback(() => {
    if (!videoBlob) { onError('No video recorded'); return; }
    if (completedGestures.length < GESTURES.length) {
      setError('Not all gestures were completed. Please retry.');
      return;
    }
    onCapture(videoBlob);
  }, [videoBlob, completedGestures, onCapture, onError]);

  const handleWebcamError = useCallback((err: string | DOMException) => {
    setPermissionDenied(true);
    onError('Camera error: ' + (typeof err === 'string' ? err : err.message));
  }, [onError]);

  const progressPercentage = (completedGestures.length / GESTURES.length) * 100;
  const currentGesture = GESTURES[currentGestureIndex];

  if (permissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertCircle className="w-16 h-16 text-destructive" />
        <h3 className="text-lg font-semibold">Camera Permission Required</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Please allow camera access in your browser settings.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {modelsLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando modelo de detección facial...
        </div>
      )}

      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Detección de Vida</h3>
        <p className="text-sm text-muted-foreground">
          Sigue las instrucciones para completar los 4 gestos. Usamos IA para verificar que eres una persona real.
        </p>
      </div>

      {!videoBlob && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Gestos Completados</span>
              <span className="text-sm text-muted-foreground">
                {completedGestures.length} / {GESTURES.length}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-around">
              {GESTURES.map((gesture, index) => (
                <div
                  key={gesture.type}
                  className={`flex flex-col items-center space-y-1 ${
                    completedGestures.includes(gesture.type)
                      ? 'text-green-500'
                      : index === currentGestureIndex && isRecording
                      ? 'text-blue-500'
                      : 'text-gray-400'
                  }`}
                >
                  {gesture.icon}
                  <span className="text-xs">{gesture.label}</span>
                  {completedGestures.includes(gesture.type) && (
                    <Check className="w-4 h-4" />
                  )}
                </div>
              ))}
            </div>
            {isRecording && faceDetected && (
              <p className="text-xs text-green-600 text-center">Rostro detectado ✓</p>
            )}
            {isRecording && !faceDetected && modelsLoadedRef.current && (
              <p className="text-xs text-amber-600 text-center">Coloca tu rostro frente a la cámara</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="relative w-full max-w-2xl mx-auto aspect-video bg-black rounded-lg overflow-hidden">
        {!videoBlob ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
              mirrored={true}
              onUserMediaError={handleWebcamError}
              className="w-full h-full object-cover"
              screenshotFormat="image/jpeg"
            />

            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-8xl font-bold animate-pulse">
                  {countdown === 0 ? 'GO!' : countdown}
                </div>
              </div>
            )}

            {isRecording && (
              <>
                <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/70 px-3 py-2 rounded-full">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white text-sm font-medium">Recording</span>
                </div>
                <div className="absolute top-4 right-4 bg-black/70 px-3 py-2 rounded-full">
                  <span className="text-white text-sm font-medium">
                    {recordingDuration}s / {MAX_RECORDING_DURATION}s
                  </span>
                </div>
                {currentGesture && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-6 py-3 rounded-lg">
                    <div className="flex items-center space-x-3 text-white">
                      {currentGesture.icon}
                      <span className="text-lg font-medium">{currentGesture.instruction}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {!isRecording && countdown === null && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-80 border-4 border-white/50 rounded-full" />
              </div>
            )}
          </>
        ) : (
          <video
            src={URL.createObjectURL(videoBlob)}
            controls
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center gap-4">
        {!videoBlob && !isRecording && countdown === null && (
          <Button onClick={startCountdown} disabled={!cameraReady || isUploading} size="lg">
            <Video className="w-5 h-5 mr-2" />
            Start Recording
          </Button>
        )}
        {videoBlob && (
          <>
            <Button onClick={handleRetry} variant="outline" size="lg" disabled={isUploading}>
              <RotateCcw className="w-5 h-5 mr-2" />
              Record Again
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={completedGestures.length < GESTURES.length || isUploading}
              size="lg"
            >
              {isUploading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading...</>
              ) : (
                <><Check className="w-5 h-5 mr-2" /> Confirm and Continue</>
              )}
            </Button>
          </>
        )}
      </div>

      {!isRecording && !videoBlob && countdown === null && (
        <Alert>
          <AlertDescription>
            <strong>Instrucciones:</strong> Presiona "Start Recording" y sigue los gestos en pantalla.
            La IA detectará automáticamente cuando completes cada gesto. El proceso dura aproximadamente 10 segundos.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
