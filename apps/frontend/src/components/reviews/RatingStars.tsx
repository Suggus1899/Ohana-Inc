import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  value: number;        // 0-5
  onChange?: (rating: number) => void;  // si se pasa, modo editable
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  showValue?: boolean;  // mostrar "4.2" junto a estrellas
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const RatingStars = ({
  value,
  onChange,
  size = 'md',
  disabled = false,
  showValue = false,
  className,
}: RatingStarsProps) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  
  const starSize = sizeClasses[size];
  
  const handleClick = (rating: number) => {
    if (onChange && !disabled) {
      onChange(rating);
    }
  };

  const renderStar = (starNumber: number) => {
    const isInteractive = !!onChange && !disabled;
    const currentRating = hoveredRating !== null ? hoveredRating : value;
    const filledPercentage = currentRating >= starNumber ? 100 : 
                            currentRating >= starNumber - 0.5 ? 50 : 0;
    
    return (
      <div
        key={starNumber}
        className={cn(
          'relative inline-block',
          isInteractive && 'cursor-pointer',
          disabled && 'cursor-not-allowed opacity-60'
        )}
        onMouseEnter={() => isInteractive && setHoveredRating(starNumber)}
        onMouseLeave={() => isInteractive && setHoveredRating(null)}
        onClick={() => handleClick(starNumber)}
      >
        {/* Estrella vacía (fondo) */}
        <Star
          className={cn(
            starSize,
            'text-gray-300 dark:text-gray-600',
            'transition-colors duration-200'
          )}
          fill="currentColor"
        />
        
        {/* Estrella llena (superposición) */}
        {filledPercentage > 0 && (
          <div
            className="absolute top-0 left-0 overflow-hidden"
            style={{ width: `${filledPercentage}%` }}
          >
            <Star
              className={cn(
                starSize,
                'text-yellow-400',
                'transition-colors duration-200'
              )}
              fill="currentColor"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map(renderStar)}
      </div>
      
      {showValue && (
        <span className={cn(
          'ml-2 font-medium',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-lg'
        )}>
          {value.toFixed(1)}
        </span>
      )}
      
      {onChange && !disabled && (
        <span className="ml-2 text-sm text-muted-foreground">
          {hoveredRating !== null ? `Calificar con ${hoveredRating} estrellas` : 'Haz clic para calificar'}
        </span>
      )}
    </div>
  );
};

export default RatingStars;