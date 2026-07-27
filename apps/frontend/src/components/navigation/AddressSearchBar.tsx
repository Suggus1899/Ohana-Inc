import { useState } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { geocodingService } from '@/services/geocoding.service';
import { toast } from '@/components/ui/use-toast';

interface AddressSearchBarProps {
  onLocationSelected: (lat: number, lng: number, address: string) => void;
}

const AddressSearchBar = ({ onLocationSelected }: AddressSearchBarProps) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const result = await geocodingService.addressToCoords(query);
      onLocationSelected(result.lat, result.lng, result.displayName);
      setIsOpen(false);
      setQuery('');
      toast({
        title: "Ubicación encontrada",
        description: `Buscando propiedades en: ${result.displayName}`,
      });
    } catch (error: unknown) {
      toast({
        title: "Error de búsqueda",
        description: error instanceof Error ? error.message : "No se pudo encontrar la ubicación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="absolute top-28 left-10 z-[9999] h-12 w-12 rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-white/10 shadow-2xl hover:bg-zinc-900 text-white"
      >
        <Search className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="absolute top-28 left-10 z-[9999] w-full max-w-md animate-in slide-in-from-left duration-300">
      <form 
        onSubmit={handleSearch}
        className="relative flex items-center p-2 bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-3xl"
      >
        <Search className="absolute left-5 h-5 w-5 text-primary" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar dirección en SJLM..."
          className="h-12 pl-12 pr-12 bg-transparent border-none text-white font-bold placeholder:text-white/30 focus-visible:ring-0"
          autoFocus
        />
        <div className="absolute right-3 flex items-center gap-1">
          {loading ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin mr-2" />
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/5 rounded-lg"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddressSearchBar;
