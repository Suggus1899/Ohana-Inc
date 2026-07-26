import { useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { X, ImagePlus, GripVertical, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

interface ImageUploaderProps {
  value?: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  minFiles?: number;
  className?: string;
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 11);
};

export function ImageUploader({
  value,
  onChange,
  maxFiles = 20,
  minFiles = 5,
  className,
}: ImageUploaderProps) {
  const [images, setImages] = useState<ImageFile[]>(() =>
    (value ?? []).map((f) => ({ id: generateId(), file: f, preview: URL.createObjectURL(f) }))
  );
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (files: File[]) => {
      setError(null);
      const remaining = maxFiles - images.length;
      const toAdd = files.slice(0, remaining);
      const invalid = toAdd.filter((f) => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_SIZE_BYTES);
      if (invalid.length > 0) {
        setError(`Algunos archivos no son válidos (max 10MB, formato JPEG/PNG/WebP)`);
        return;
      }
      const newImages: ImageFile[] = toAdd.map((f) => ({
        id: generateId(),
        file: f,
        preview: URL.createObjectURL(f),
      }));
      const updated = [...images, ...newImages];
      setImages(updated);
      onChange(updated.map((i) => i.file));
    },
    [images, maxFiles, onChange]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    },
    [processFiles]
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const removeImage = (id: string) => {
    const updated = images.filter((i) => i.id !== id);
    setImages(updated);
    onChange(updated.map((i) => i.file));
  };

  const handleItemDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDragSourceIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleItemDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleItemDrop = (e: DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (dragSourceIndex === null || dragSourceIndex === targetIndex) return;
    const reordered = [...images];
    const [moved] = reordered.splice(dragSourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setImages(reordered);
    onChange(reordered.map((i) => i.file));
    setDragSourceIndex(null);
    setDragOverIndex(null);
  };

  const hasMinimum = images.length >= minFiles;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Imágenes ({images.length}/{maxFiles})
        </span>
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
          hasMinimum ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
          {hasMinimum ? '✓ Mínimo cumplido' : `Mín. ${minFiles} requeridas`}
        </span>
      </div>

      {/* Drop zone */}
      {images.length < maxFiles && (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className={cn(
            'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all duration-200',
            dragging
              ? 'border-blue-500 bg-blue-50 scale-[1.01]'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40'
          )}
        >
          <div className={cn('p-3 rounded-full transition-colors',
            dragging ? 'bg-blue-100' : 'bg-gray-100')}>
            <ImagePlus className={cn('h-6 w-6', dragging ? 'text-blue-500' : 'text-gray-400')} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {dragging ? 'Suelta aquí' : 'Arrastra imágenes o haz clic'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG, WebP · Máx. 10MB c/u</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img, index) => (
            <div
              key={img.id}
              draggable
              onDragStart={(e) => handleItemDragStart(e, index)}
              onDragOver={(e) => handleItemDragOver(e, index)}
              onDrop={(e) => handleItemDrop(e, index)}
              onDragEnd={() => { setDragSourceIndex(null); setDragOverIndex(null); }}
              className={cn(
                'relative group rounded-lg overflow-hidden aspect-square border-2 transition-all duration-150',
                dragOverIndex === index ? 'border-blue-500 scale-105' : 'border-transparent',
                index === 0 ? 'ring-2 ring-amber-400' : ''
              )}
            >
              <img
                src={img.preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Main image badge */}
              {index === 0 && (
                <div className="absolute top-1 left-1 bg-amber-400 text-white rounded px-1 py-0.5 flex items-center gap-0.5">
                  <Star className="h-2.5 w-2.5 fill-white" />
                  <span className="text-[10px] font-bold">Principal</span>
                </div>
              )}
              {/* Drag handle */}
              <div className="absolute top-1 right-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                <GripVertical className="h-4 w-4 text-white drop-shadow" />
              </div>
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
              {/* Index */}
              <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] rounded px-1">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 1 && (
        <p className="text-xs text-gray-400">
          La primera imagen será la principal. Arrastra para reordenar.
        </p>
      )}
    </div>
  );
}
