import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Loader2, MessageCircle, User } from "lucide-react";
import { api } from "@/services/api";
import { toast } from "sonner";
import { debounce } from "@/lib/utils";

interface UserSearchResult {
  id: number;
  name: string;
  email: string;
  profilePhotoUrl?: string;
  role: string;
}

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateConversation: (userId: number) => Promise<any>;
}

export function NewConversationModal({
  isOpen,
  onClose,
  onCreateConversation,
}: NewConversationModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState<number | null>(null);
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const searchUsers = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setUsers([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await api.request<{ users: UserSearchResult[] }>(
        `/chat/search-users?query=${encodeURIComponent(query.trim())}`
      );

      if (response.success && response.data) {
        setUsers(response.data.users);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setUsers([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce((query: string) => searchUsers(query), 300),
    [searchUsers]
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleCreateConversation = async (userId: number) => {
    setIsCreating(userId);
    try {
      await onCreateConversation(userId);
      onClose();
      setSearchQuery("");
      setUsers([]);
      setHasSearched(false);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Error al crear la conversación");
    } finally {
      setIsCreating(null);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setUsers([]);
      setHasSearched(false);
      setIsCreating(null);
    }
  }, [isOpen]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "propietario":
        return "Propietario";
      case "cliente":
        return "Estudiante";
      case "operator":
        return "Operador";
      default:
        return role;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Nueva Conversación
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Results */}
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {!hasSearched ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Escribe al menos 2 caracteres para buscar usuarios</p>
              </div>
            ) : isSearching ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Buscando...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No se encontraron usuarios</p>
                <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user.name}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground">
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleCreateConversation(user.id)}
                    disabled={isCreating === user.id}
                  >
                    {isCreating === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Chatear"
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Info */}
          <p className="text-xs text-muted-foreground text-center">
            Solo puedes iniciar conversaciones con propietarios, estudiantes y operadores
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
