import { useEffect, useCallback, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, ArrowLeft, UserPlus, X, Ban } from "lucide-react";
import { useChatContext } from "@/contexts";
import type { ConversationData } from "@/contexts";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import { BlockedMessageAlert } from "@/components/chat/BlockedMessageAlert";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface UserSearchResult {
  id: number;
  name: string;
  email: string;
  role: string;
  profilePhotoUrl?: string;
  isBlockedByMe?: boolean;
}

interface SearchResult {
  type: 'conversation' | 'user';
  conversation?: ConversationData;
  user?: UserSearchResult;
}

const MessagesSection = () => {
  const {
    conversations,
    activeConversation,
    messages,
    isLoading,
    isLoadingMessages,
    typingUsers,
    blockedMessages,
    fetchConversations,
    openConversation,
    closeConversation,
    sendMessage,
    sendTyping,
    startDirectConversation,
    getOtherParticipant,
    clearBlockedMessage,
    unblockUser,
    pendingRequests,
  } = useChatContext();

  const { toast } = useToast();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'inbox' | 'requests'>('inbox');

  // Buscador universal
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cargar conversaciones al montar o si hay un conversationId pendiente
  useEffect(() => {
    const state = location.state as { conversationId?: number };
    if (state?.conversationId || conversations.length === 0) {
      fetchConversations();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Abrir conversación automáticamente si viene en el state de navegación (solo una vez)
  const hasAutoOpened = useRef(false);
  const stateConvId = (location.state as { conversationId?: number })?.conversationId;
  useEffect(() => {
    if (stateConvId && conversations.length > 0 && !hasAutoOpened.current) {
      const conv = conversations.find(c => c.id === stateConvId);
      if (conv) {
        hasAutoOpened.current = true;
        openConversation(conv);
      }
    }
  }, [conversations, stateConvId, openConversation]);

  // Buscador universal con debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results: SearchResult[] = [];
        
        // Buscar en conversaciones existentes
        const matchingConversations = conversations.filter(c => {
          const other = getOtherParticipant(c);
          return other?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 other?.email?.toLowerCase().includes(searchQuery.toLowerCase());
        });
        
        // Agregar conversaciones coincidentes
        matchingConversations.forEach(conv => {
          results.push({ type: 'conversation', conversation: conv });
        });
        
        // Buscar usuarios en backend (incluye email)
        const response = await api.searchUsersForChat(searchQuery);
        if (response.success && response.data) {
          const existingIds = new Set(matchingConversations.map(c => {
            const other = getOtherParticipant(c);
            return other?.id;
          }));
          
          const users = (response.data.users as unknown) as UserSearchResult[];
          const newUsers = users.filter(u => !existingIds.has(u.id));
          
          // Agregar usuarios nuevos
          newUsers.forEach(user => {
            results.push({ type: 'user', user });
          });
        }
        
        setSearchResults(results);
        setShowSearchResults(true);
      } catch {
        // Silent fail
      } finally {
        setIsSearching(false);
      }
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, conversations, getOtherParticipant]);

  const handleOpenConversation = useCallback(
    async (conv: ConversationData) => {
      await openConversation(conv);
      setSearchQuery("");
      setShowSearchResults(false);
    },
    [openConversation]
  );

  const handleUnblockUser = useCallback(
    async (userId: number, userName: string) => {
      try {
        await unblockUser(userId);
        // Actualizar estado local del resultado
        setSearchResults(prev =>
          prev.map(r =>
            r.type === 'user' && r.user?.id === userId
              ? { ...r, user: { ...r.user!, isBlockedByMe: false } }
              : r
          )
        );
        toast({ title: `${userName} desbloqueado`, description: "Ahora puedes enviarle mensajes" });
      } catch {
        toast({ title: "Error", description: "No se pudo desbloquear", variant: "destructive" });
      }
    },
    [unblockUser, toast]
  );

  const handleSelectSearchResult = useCallback(
    async (result: SearchResult) => {
      if (result.type === 'conversation' && result.conversation) {
        await handleOpenConversation(result.conversation);
      } else if (result.type === 'user' && result.user) {
        if (result.user.isBlockedByMe) {
          await handleUnblockUser(result.user.id, result.user.name);
          return;
        }
        setIsSearching(true);
        try {
          const conv = await startDirectConversation(result.user.id);
          if (conv) {
            toast({
              title: "Conversación iniciada",
              description: `Ahora puedes chatear con ${result.user.name}`,
            });
          }
        } catch {
          toast({
            title: "Error",
            description: "No se pudo iniciar la conversación",
            variant: "destructive",
          });
        } finally {
          setIsSearching(false);
          setSearchQuery("");
          setShowSearchResults(false);
        }
      }
    },
    [handleOpenConversation, handleUnblockUser, startDirectConversation, toast]
  );

  const handleCloseSearch = () => {
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      {/* Header fijo */}
      <div className="flex items-center justify-between py-3 px-1 flex-shrink-0">
        <div className="flex items-center gap-3">
          {activeConversation && (
            <Button
              variant="ghost"
              size="icon"
              onClick={closeConversation}
              className="lg:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-xl font-semibold">Mensajes</h1>
            <p className="text-sm text-muted-foreground">
              {activeConversation 
                ? `Chat con ${getOtherParticipant(activeConversation)?.name || '...'}`
                : "Comunicación con propietarios e inquilinos"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Alertas de mensajes bloqueados */}
      {blockedMessages.length > 0 && (
        <div className="space-y-2 flex-shrink-0 mb-3">
          {blockedMessages.map((blocked) => (
            <BlockedMessageAlert
              key={blocked.messageId}
              reason={blocked.reason}
              violations={blocked.violations}
              riskScore={blocked.riskScore}
              onDismiss={() => clearBlockedMessage(blocked.messageId)}
            />
          ))}
        </div>
      )}

      {/* Área de Chat Fija */}
      <Card className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex h-full">
          {/* Lista de Conversaciones */}
          <div className={`w-full lg:w-80 border-r flex flex-col ${activeConversation ? "hidden lg:flex" : "flex"} min-h-0`}>
            {/* Buscador Universal */}
            <div className="p-3 border-b flex-shrink-0">
              <div className="relative">
                <Input
                  ref={searchInputRef}
                  placeholder="Buscar conversación o usuario..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-8"
                />
                {searchQuery && (
                  <button
                    onClick={handleCloseSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {isSearching && (
                  <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              
            </div>
            
            {/* Tabs: Mensajes / Solicitudes */}
            <div className="flex border-b flex-shrink-0">
              <button
                onClick={() => setActiveTab('inbox')}
                className={`flex-1 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === 'inbox'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Mensajes
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === 'requests'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Solicitudes
                {pendingRequests.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1.5 h-4 min-w-[16px] text-[10px] px-1"
                  >
                    {pendingRequests.length}
                  </Badge>
                )}
              </button>
            </div>

            {/* Lista de conversaciones con scroll oculto */}
            <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : showSearchResults && searchQuery.length >= 2 ? (
                searchResults.length > 0 ? (
                  <div className="divide-y">
                    {searchResults.map((result) => {
                      if (result.type === 'conversation' && result.conversation) {
                        const other = getOtherParticipant(result.conversation);
                        return (
                          <button
                            key={`conv-${result.conversation.id}`}
                            onClick={() => handleSelectSearchResult(result)}
                            className="w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-3 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-sm font-semibold text-primary">
                                {other?.name?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-medium truncate text-sm">{other?.name}</p>
                                {result.conversation.lastMessage?.createdAt && (
                                  <span className="text-xs text-muted-foreground shrink-0">
                                    {new Date(result.conversation.lastMessage.createdAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{other?.email}</p>
                              {result.conversation.lastMessage && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {result.conversation.lastMessage.content}
                                </p>
                              )}
                            </div>
                            {result.conversation.unreadCount > 0 && (
                              <span className="bg-primary text-primary-foreground text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shrink-0">
                                {result.conversation.unreadCount}
                              </span>
                            )}
                          </button>
                        );
                      }
                      if (result.type === 'user' && result.user) {
                        const isBlocked = result.user.isBlockedByMe;
                        return (
                          <button
                            key={`user-${result.user.id}`}
                            onClick={() => handleSelectSearchResult(result)}
                            className="w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-3 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                              {isBlocked
                                ? <Ban className="h-5 w-5 text-destructive" />
                                : <UserPlus className="h-5 w-5 text-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-sm truncate ${isBlocked ? 'text-muted-foreground' : ''}`}>
                                {result.user.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{result.user.email}</p>
                            </div>
                            {isBlocked ? (
                              <span className="text-xs text-destructive font-medium shrink-0">Desbloquear</span>
                            ) : (
                              <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded shrink-0">Iniciar chat</span>
                            )}
                          </button>
                        );
                      }
                      return null;
                    })}
                  </div>
                ) : (
                  !isSearching && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">No se encontraron usuarios con ese nombre o email</p>
                    </div>
                  )
                )
              ) : conversations.filter(c => activeTab === 'requests' ? c.isRequest === true : c.isRequest !== true).length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <h3 className="text-sm font-medium mb-1">
                    {activeTab === 'requests' ? 'No tienes solicitudes' : 'No tienes conversaciones'}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                    {activeTab === 'requests'
                      ? 'Cuando recibas una solicitud de chat, aparecerá aquí'
                      : 'Busca un usuario arriba para iniciar una conversación'
                    }
                  </p>
                  {activeTab !== 'requests' && (
                    <Button size="sm" variant="outline" onClick={() => searchInputRef.current?.focus()}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Iniciar chat
                    </Button>
                  )}
                </div>
              ) : (
                <ConversationList
                  conversations={
                    activeTab === 'requests'
                      ? conversations.filter(c => c.isRequest === true)
                      : conversations.filter(c => c.isRequest !== true)
                  }
                  activeConversationId={activeConversation?.id}
                  onSelect={handleOpenConversation}
                  getOtherParticipant={getOtherParticipant}
                  searchQuery={searchQuery}
                  typingUsers={typingUsers}
                  emptyMessage={
                    activeTab === 'requests'
                      ? 'No tienes solicitudes de chat pendientes'
                      : undefined
                  }
                />
              )}
            </div>
          </div>

          {/* Ventana de Chat */}
          <div className={`flex-1 flex flex-col min-h-0 ${activeConversation ? "flex" : "hidden lg:flex"}`}>
            {activeConversation ? (
              <ChatWindow
                conversation={activeConversation}
                messages={messages}
                isLoading={isLoadingMessages}
                typingUsers={typingUsers}
                otherParticipant={getOtherParticipant(activeConversation)}
                onSendMessage={sendMessage}
                onTyping={sendTyping}
                onBack={closeConversation}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-1">Selecciona una conversación</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Busca un usuario arriba o selecciona una conversación existente para empezar a chatear
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MessagesSection;

// Estilos CSS para scrollbar oculto
const scrollbarStyles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// Agregar estilos al documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = scrollbarStyles;
  document.head.appendChild(styleSheet);
}
