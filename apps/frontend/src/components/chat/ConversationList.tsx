import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Circle, InboxIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationData, ChatParticipant, TypingUser } from "@/contexts";
import { useMemo } from "react";

interface ConversationListProps {
  conversations: ConversationData[];
  activeConversationId?: number;
  onSelect: (conversation: ConversationData) => void;
  getOtherParticipant: (conversation: ConversationData) => ChatParticipant | undefined;
  searchQuery?: string;
  emptyMessage?: string;
  typingUsers?: TypingUser[];
}

const ConversationList = ({
  conversations,
  activeConversationId,
  onSelect,
  getOtherParticipant,
  searchQuery = "",
  emptyMessage,
  typingUsers = [],
}: ConversationListProps) => {
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const other = getOtherParticipant(conv);
      const propertyTitle = conv.rentRequest?.property?.title || "";
      return (
        other?.name?.toLowerCase().includes(query) ||
        other?.email?.toLowerCase().includes(query) ||
        propertyTitle.toLowerCase().includes(query)
      );
    });
  }, [conversations, searchQuery, getOtherParticipant]);

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    }
    if (days === 1) return "Ayer";
    if (days < 7) {
      return date.toLocaleDateString("es-CO", { weekday: "short" });
    }
    return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground text-center text-sm">
          {emptyMessage ?? 'No tienes conversaciones aún'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
        {filteredConversations.map((conv) => {
          const other = getOtherParticipant(conv);
          const initials = other?.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "??";
          const isActive = activeConversationId === conv.id;
          const hasUnread = (conv.unreadCount || 0) > 0;
          const isPending = conv.isRequest === true;
          const isSomeoneTyping = typingUsers.some(u => u.conversationId === conv.id);

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={cn(
                "w-full flex items-start gap-3 p-3 text-left transition-colors border-b",
                "hover:bg-muted/50",
                isActive && "bg-primary/5 border-l-2 border-l-primary",
                hasUnread && !isActive && "bg-primary/5",
                isPending && !isActive && "bg-orange-500/5"
              )}
            >
              <div className="relative shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                {hasUnread && !isPending && (
                  <Circle className="absolute -top-0.5 -right-0.5 h-3 w-3 fill-primary text-primary" />
                )}
                {isPending && (
                  <InboxIcon className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 text-orange-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={cn("text-sm font-medium truncate", (hasUnread || isPending) && "font-semibold")}>
                    {other?.name || "Usuario"}
                  </span>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {formatTime(conv.lastMessageAt)}
                  </span>
                </div>
                {conv.rentRequest?.property?.title && (
                  <p className="text-[11px] text-primary mb-0.5 truncate">
                    {conv.rentRequest.property.title}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <p className={cn("text-xs truncate", isSomeoneTyping ? "text-primary italic" : hasUnread ? "text-foreground font-medium" : "text-muted-foreground")}>
                    {isSomeoneTyping
                      ? "Escribiendo..."
                      : isPending
                        ? "Quiere enviarte un mensaje"
                        : conv.lastMessage?.isBlocked
                          ? "Contenido bloqueado"
                          : conv.lastMessage?.content || "Sin mensajes aún"}
                  </p>
                  {isPending && (
                    <Badge variant="outline" className="ml-2 h-5 text-[10px] px-1.5 border-orange-400 text-orange-500 whitespace-nowrap">
                      Solicitud
                    </Badge>
                  )}
                  {hasUnread && !isPending && (
                    <Badge variant="default" className="ml-2 h-5 min-w-[20px] text-[10px] px-1.5">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

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

export default ConversationList;
