import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import RatingStars from './RatingStars';

interface ReviewFormProps {
  targetName: string;  // "Propiedad X" o "Usuario Y"
  initialRating?: number;
  initialComment?: string;
  onSubmit: (data: { rating: number; comment?: string }) => Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
  className?: string;
}

const ReviewForm = ({
  targetName,
  initialRating = 0,
  initialComment = '',
  onSubmit,
  onCancel,
  isEditing = false,
  isLoading = false,
  className,
}: ReviewFormProps) => {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [commentLength, setCommentLength] = useState(initialComment.length);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Por favor selecciona una calificación');
      return;
    }

    await onSubmit({
      rating,
      comment: comment.trim() || undefined,
    });
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setComment(value);
    setCommentLength(value.length);
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div>
        <Label className="text-base font-medium mb-2 block">
          {isEditing ? 'Editar reseña para ' : 'Calificar a '}
          <span className="text-primary">{targetName}</span>
        </Label>
        
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">
            ¿Qué calificación le darías? *
          </p>
          <RatingStars
            value={rating}
            onChange={setRating}
            size="lg"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="comment" className="text-sm font-medium mb-2 block">
          Comentario (opcional)
          <span className="text-xs text-muted-foreground ml-2">
            {commentLength}/500 caracteres
          </span>
        </Label>
        <Textarea
          id="comment"
          placeholder="Comparte tu experiencia. ¿Qué te gustó o qué se podría mejorar?"
          value={comment}
          onChange={handleCommentChange}
          disabled={isLoading}
          maxLength={500}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Los comentarios ayudan a mejorar la experiencia para todos.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        )}
        
        <Button
          type="submit"
          disabled={isLoading || rating === 0}
        >
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? 'Guardar cambios' : 'Enviar reseña'}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground border-t pt-3">
        <p>• La calificación es obligatoria y debe estar entre 1 y 5 estrellas</p>
        <p>• Solo puedes calificar una vez por {targetName.includes('propiedad') ? 'propiedad' : 'usuario'}</p>
        <p>• Tu reseña será visible públicamente</p>
      </div>
    </form>
  );
};

// Importar cn desde utils
import { cn } from '@/lib/utils';

export default ReviewForm;