import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MoreVertical, Edit, Trash2, BadgeCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PropertyReview, UserReview } from '@/services/api';
import RatingStars from './RatingStars';

interface ReviewCardProps {
  review: PropertyReview | UserReview;
  type: 'property' | 'user';
  isOwner?: boolean;  // si es el dueño del review, muestra botón editar/eliminar
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

const ReviewCard = ({
  review,
  type,
  isOwner = false,
  onEdit,
  onDelete,
  className,
}: ReviewCardProps) => {
  // Determinar el autor del review
  const author = type === 'property' 
    ? (review as PropertyReview).author
    : (review as UserReview).reviewer;

  // Determinar el texto del target o propiedad
  const targetText = type === 'property'
    ? 'propiedad'
    : (review as UserReview).reviewed?.name || 'usuario';

  const propertyTitle = type === 'property'
    ? (review as PropertyReview).property?.title
    : undefined;

  // Formatear la fecha
  const formattedDate = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
    locale: es,
  });

  // Obtener iniciales para el avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn('border rounded-lg p-4 bg-card', className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author?.profilePhotoUrl} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {author?.name ? getInitials(author.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">
                {author?.name || 'Usuario anónimo'}
                {author?.isVerified === true ? <BadgeCheck className="h-4 w-4 text-blue-500 inline ml-1" /> : author?.isVerified === false ? <span className="text-[10px] text-muted-foreground ml-1">(no verificado)</span> : null}
              </p>
              <span className="text-xs text-muted-foreground">
                • {formattedDate}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {type === 'property' ? (
                propertyTitle ? (
                  <>Calificó tu propiedad: <span className="font-semibold text-foreground">{propertyTitle}</span></>
                ) : (
                  'Calificó una propiedad'
                )
              ) : (
                `Calificó a ${targetText}`
              )}
            </p>
          </div>
        </div>

        {isOwner && (onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar reseña
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar reseña
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mb-3">
        <RatingStars value={review.rating} size="sm" />
      </div>

      {review.comment && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm text-foreground whitespace-pre-line">
            {review.comment}
          </p>
        </div>
      )}

      {/* Información adicional basada en el tipo */}
      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
        {type === 'property' && (review as PropertyReview).rentRequestId && (
          <p>• Basado en una solicitud de alquiler completada</p>
        )}
        {type === 'user' && (review as UserReview).transactionId && (
          <p>• Basado en una transacción completada</p>
        )}
      </div>
    </div>
  );
};

// Importar cn desde utils
import { cn } from '@/lib/utils';

export default ReviewCard;