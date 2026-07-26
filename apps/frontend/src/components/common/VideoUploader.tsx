import { useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { Video, X, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoUploaderProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  maxDurationSeconds?: number;
  className?: string;
}

const MAX_SIZE_BYTES = 100 * 1024 * 1024;
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];

export function VideoUploader({
  value,
  onChange,
  maxDurationSeconds = 120,
  className,
}: VideoUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(
    value ? URL.createObjectURL(value) : null
  );
  const [duration, setDuration] = useState<number | null>(null);
  const [validating, setValidating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const validateAndSet = useCallback(
    async (file: File) => {
      setError(null);
      setValidating(true);

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Formato no permitido. Use MP4 o MOV.');
        setValidating(false);
        return;
      }

      if (file.size > MAX_SIZE_BYTES) {
        setError('El video supera el tamaño máximo de 100MB.');
        setValidating(false);
        return;
      }

      const url = URL.createObjectURL(file);
      const videoDuration = await getVideoDuration(url);

      if (videoDuration > maxDurationSeconds) {
        URL.revokeObjectURL(url);
        setError(
          `El video dura ${Math.round(videoDuration)}s. El máximo permitido es ${maxDurationSeconds}s (2 minutos).`
        );
        setValidating(false);
        return;
      }

      setDuration(videoDuration);
      setPreview(url);
      onChange(file);
      setValidating(false);
    },
    [maxDurationSeconds, onChange]
  );

  const getVideoDuration = (url: string): Promise<number> =>
    new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.onerror = () => resolve(0);
      video.src = url;
    });

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSet(file);
    },
    [validateAndSet]
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSet(file);
    e.target.value = '';
  };

  const removeVideo = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setDuration(null);
    setError(null);
    onChange(null);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const isValid = preview && !error;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Video de presentación</span>
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
          isValid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
          {isValid ? '✓ Video listo' : 'Opcional'}
        </span>
      </div>

      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-all duration-200',
            dragging
              ? 'border-violet-500 bg-violet-50 scale-[1.01]'
              : 'border-gray-300 bg-gray-50 hover:border-violet-400 hover:bg-violet-50/40'
          )}
        >
          <div className={cn('p-3 rounded-full transition-colors',
            dragging ? 'bg-violet-100' : 'bg-gray-100')}>
            {validating ? (
              <div className="h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Video className={cn('h-6 w-6', dragging ? 'text-violet-500' : 'text-gray-400')} />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {validating ? 'Validando video...' : dragging ? 'Suelta aquí' : 'Arrastra tu video o haz clic'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">MP4, MOV · Máx. 2 min · Máx. 100MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo"
            className="hidden"
            onChange={handleChange}
          />
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-black border border-gray-200">
          <video
            ref={videoRef}
            src={preview}
            controls
            className="w-full max-h-52 object-contain"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            {duration !== null && (
              <span className="bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                {formatDuration(duration)}
              </span>
            )}
            <button
              type="button"
              onClick={removeVideo}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-green-500/90 text-white text-xs px-2 py-1 rounded-full">
            <CheckCircle className="h-3 w-3" />
            Video válido
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <p className="text-xs text-gray-400">
        El video debe mostrar la propiedad completa. Máximo 2 minutos.
      </p>
    </div>
  );
}
