import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { geocodingService } from '@/services/geocoding.service';
import { toast } from '@/components/ui/use-toast';

interface LocationSearchBarProps {
  onLocationSelected: (location: string) => void;
  placeholder?: string;
  className?: string;
}

const LocationSearchBar = ({ 
  onLocationSelected, 
  placeholder = "Buscar ubicación (ej: la morera, las palmas, santa rosa)...",
  className = ""
}: LocationSearchBarProps) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ejemplos de búsqueda
  const examples = geocodingService.getExamples();

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manejar autocompletado
  const handleInputChange = async (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const results = await geocodingService.autocomplete(value.trim(), 5);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Manejar teclas para navegación
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else if (query.trim()) {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSuggestionSelect = (suggestion: any) => {
    setQuery(suggestion.displayName);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    // Llamar al callback con la ubicación seleccionada
    onLocationSelected(suggestion.displayName);
    
    toast({
      title: "Ubicación seleccionada",
      description: `Buscando en: ${suggestion.displayName}`,
    });
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setShowSuggestions(false);
    
    try {
      // Verificar si la ubicación existe usando geocoding
      const results = await geocodingService.autocomplete(query.trim(), 1);
      
      if (results.length > 0) {
        onLocationSelected(query.trim());
        
        toast({
          title: "Ubicación encontrada",
          description: `Buscando en: ${results[0].displayName}`,
        });
      } else {
        toast({
          title: "Ubicación no encontrada",
          description: "Intenta con otro nombre o revisa los ejemplos sugeridos",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error de búsqueda",
        description: error.message || "No se pudo procesar la ubicación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    onLocationSelected(example);
    
    toast({
      title: "Ejemplo aplicado",
      description: `Buscando en: ${example}`,
    });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onLocationSelected('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-4 h-5 w-5 text-muted-foreground z-10" />
        
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim().length >= 2 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-12 pr-12 py-6 text-base rounded-2xl border-2 focus-visible:ring-2 focus-visible:ring-primary"
        />
        
        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            type="button"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="h-10 px-4 rounded-full bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Sugerencias de autocompletado */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-background border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.lat}-${suggestion.lng}`}
              onClick={() => handleSuggestionSelect(suggestion)}
              className={`
                w-full text-left p-3 hover:bg-muted transition-colors border-b last:border-b-0
                ${index === selectedIndex ? 'bg-muted' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium">{suggestion.displayName}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>{suggestion.city || suggestion.state || suggestion.country}</span>
                    {suggestion.type && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                        {suggestion.type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Ejemplos de búsqueda */}
      {!query && (
        <div className="mt-3">
          <p className="text-sm text-muted-foreground mb-2">Ejemplos que funcionan:</p>
          <div className="flex flex-wrap gap-2">
            {examples.slice(0, 4).map((example, index) => (
              <Button
                key={index}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleExampleClick(example)}
                className="rounded-full text-xs h-7"
              >
                {example}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Información del servicio */}
      <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
        <Navigation className="h-3 w-3" />
        <span>Usa nuestro servicio local de geocoding para búsquedas precisas en Colombia</span>
      </div>
    </div>
  );
};

export default LocationSearchBar;