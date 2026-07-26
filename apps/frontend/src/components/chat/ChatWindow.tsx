import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Send, AlertTriangle, Check, CheckCheck, Loader2,
  MoreVertical, Trash2, Ban, Smile, RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useChatContext } from "@/contexts";
import type { MessageData as ChatMessageData, ConversationData, ChatParticipant, TypingUser } from "@/contexts";

const EMOJI_LIST = ["😀","😂","🥰","😍","🤔","😮","😢","😡","👍","👎","🙏","🎉","🔥","❤️","✅","🚀"];

interface ChatWindowProps {
  conversation: ConversationData;
  messages: ChatMessageData[];
  isLoading: boolean;
  typingUsers: TypingUser[];
  otherParticipant?: ChatParticipant | null;
  onSendMessage: (content: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  onBack?: () => void;
}

const ChatWindow = ({
  conversation,
  messages,
  isLoading,
  typingUsers,
  otherParticipant,
  onSendMessage,
  onTyping,
  onBack,
}: ChatWindowProps) => {
  const { user } = useAuth();
  const { deleteMessage, deleteConversation, blockUser, acceptChatRequest, rejectChatRequest } = useChatContext();

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [confirmDeleteChat, setConfirmDeleteChat] = useState(false);
  const [msgContextMenu, setMsgContextMenu] = useState<{ msgId: number; x: number; y: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversation.id]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    setIsSending(true);
    try {
      await onSendMessage(input.trim());
      setInput("");
      onTyping(false);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    onTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      onTyping(false);
    }, 2100);
  };

  const handleEmojiSelect = (emoji: string) => {
    const el = inputRef.current;
    if (el) {
      const start = el.selectionStart ?? input.length;
      const end = el.selectionEnd ?? input.length;
      const newVal = input.slice(0, start) + emoji + input.slice(end);
      setInput(newVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setInput(prev => prev + emoji);
    }
    setShowEmoji(false);
  };

  // Cerrar emoji picker al hacer click fuera
  useEffect(() => {
    if (!showEmoji) return;
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmoji]);

  // Cerrar menú contextual al hacer click fuera
  useEffect(() => {
    if (!msgContextMenu) return;
    const handler = () => setMsgContextMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [msgContextMenu]);

  const handleMsgContextMenu = (e: React.MouseEvent, msgId: number) => {
    e.preventDefault();
    setMsgContextMenu({ msgId, x: e.clientX, y: e.clientY });
  };

  const handleDeleteMsg = async (msgId: number) => {
    setMsgContextMenu(null);
    await deleteMessage(msgId);
  };

  const handleBlockUser = async () => {
    if (!otherParticipant) return;
    await blockUser(otherParticipant.id);
    setConfirmBlock(false);
    onBack?.();
  };

  const handleDeleteChat = async () => {
    await deleteConversation(conversation.id);
    setConfirmDeleteChat(false);
    onBack?.();
  };

  const handleAcceptRequest = async () => {
    await acceptChatRequest(conversation.id);
  };

  const handleRejectRequest = async () => {
    await rejectChatRequest(conversation.id);
    onBack?.();
  };

  const isOtherTyping = otherParticipant
    ? typingUsers.some(u => u.userId === otherParticipant.id)
    : typingUsers.length > 0;

  const initials = otherParticipant?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Hoy";
    if (date.toDateString() === yesterday.toDateString()) return "Ayer";
    return date.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessageData[] }[] = [];
  let currentDate = "";

  for (const msg of messages) {
    const msgDate = new Date(msg.createdAt).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msg.createdAt, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b bg-background">
        {onBack && (
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{otherParticipant?.name || "Usuario"}</p>
          {isOtherTyping ? (
            <p className="text-[11px] text-primary font-medium animate-pulse">escribiendo...</p>
          ) : conversation.rentRequest?.property?.title ? (
            <p className="text-[11px] text-muted-foreground truncate">
              {conversation.rentRequest.property.title}
            </p>
          ) : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setConfirmDeleteChat(true)} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar conversación
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setConfirmBlock(true)} className="text-destructive focus:text-destructive">
              <Ban className="h-4 w-4 mr-2" />
              Bloquear a {otherParticipant?.name || "usuario"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Banner solicitud pendiente */}
      {conversation.status === 'pending' && (
        conversation.participant2Id === user?.id ? (
          <div className="flex items-center justify-between gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-950/20 border-b text-sm">
            <p className="text-muted-foreground">
              <strong>{otherParticipant?.name}</strong> quiere enviarte un mensaje
            </p>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="default" onClick={handleAcceptRequest}>Aceptar</Button>
              <Button size="sm" variant="outline" onClick={handleRejectRequest}>Rechazar</Button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-2 bg-muted/50 border-b text-sm text-muted-foreground text-center">
            Solicitud enviada — esperando que <strong>{otherParticipant?.name}</strong> acepte
          </div>
        )
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground text-sm">
              Inicia la conversación con {otherParticipant?.name || "el usuario"}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Los mensajes con datos de contacto externo serán bloqueados por seguridad
            </p>
          </div>
        ) : (
          groupedMessages.map((group, gi) => (
            <div key={gi}>
              <div className="flex justify-center my-3">
                <span className="bg-muted px-3 py-1 rounded-full text-[11px] text-muted-foreground">
                  {formatDateSeparator(group.date)}
                </span>
              </div>
              {group.messages.map((msg) => {
                const isMine = msg.senderId === user?.id;
                const isDeleted = !!msg.deletedAt;
                return (
                  <div
                    key={msg.id}
                    className={cn("flex mb-1.5", isMine ? "justify-end" : "justify-start")}
                    onContextMenu={!isDeleted && msg.id <= 2_147_483_647 ? (e) => handleMsgContextMenu(e, msg.id) : undefined}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md",
                        msg.isBlocked && "border border-yellow-300 bg-yellow-50",
                        isDeleted && "opacity-60",
                        msg.isFailed && "border border-destructive/50"
                      )}
                    >
                      {msg.isBlocked && !isDeleted && (
                        <div className="flex items-center gap-1 mb-1">
                          <AlertTriangle className="h-3 w-3 text-yellow-600" />
                          <span className="text-[10px] text-yellow-600 font-medium">Contenido filtrado</span>
                        </div>
                      )}
                      <p className={cn(
                        "whitespace-pre-wrap break-words",
                        msg.isBlocked && !isDeleted && "text-yellow-800",
                        isDeleted && "italic text-muted-foreground"
                      )}>
                        {msg.content}
                      </p>
                      <div className={cn("flex items-center gap-1 mt-0.5", isMine ? "justify-end" : "justify-start")}>
                        <span className={cn("text-[10px]", isMine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                          {formatTime(msg.createdAt)}
                        </span>
                        {isMine && !msg.isFailed && (
                          msg.readAt
                            ? <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                            : <Check className="h-3 w-3 text-primary-foreground/70" />
                        )}
                        {msg.isFailed && (
                          <span className="text-[10px] text-destructive flex items-center gap-0.5">
                            <RefreshCcw className="h-3 w-3" /> Error
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {isOtherTyping && (
          <div className="flex justify-start mb-1.5 items-end gap-2">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
              <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "400ms" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3">
        {!conversation.isActive ? (
          <p className="text-center text-sm text-muted-foreground py-2">Esta conversación está cerrada</p>
        ) : conversation.isRequest && conversation.participant2Id === user?.id ? (
          <p className="text-center text-sm text-muted-foreground py-2">Acepta la solicitud para responder</p>
        ) : (
          <div className="relative flex items-center gap-2">
            {/* Emoji picker */}
            <div className="relative" ref={emojiRef}>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-9 w-9"
                onClick={() => setShowEmoji(prev => !prev)}
                type="button"
              >
                <Smile className="h-4 w-4 text-muted-foreground" />
              </Button>
              {showEmoji && (
                <div className="absolute bottom-10 left-0 z-50 bg-popover border rounded-xl shadow-lg p-2 w-64">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJI_LIST.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-xl hover:bg-accent rounded p-0.5 leading-none"
                        type="button"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              className="flex-1"
              maxLength={1000}
            />
            <Button size="icon" onClick={handleSend} disabled={!input.trim() || isSending}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>

      {/* Menú contextual de mensaje */}
      {msgContextMenu && (
        <div
          className="fixed z-50 bg-popover border rounded-md shadow-md py-1 min-w-[150px]"
          style={{ top: msgContextMenu.y, left: msgContextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-destructive hover:bg-accent"
            onClick={() => handleDeleteMsg(msgContextMenu.msgId)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar mensaje
          </button>
        </div>
      )}

      {/* Dialog: bloquear usuario */}
      <AlertDialog open={confirmBlock} onOpenChange={setConfirmBlock}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquear a {otherParticipant?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              No podrán enviarte mensajes y la conversación desaparecerá para ambos. Esta acción se puede revertir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlockUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Bloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: eliminar conversación */}
      <AlertDialog open={confirmDeleteChat} onOpenChange={setConfirmDeleteChat}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar conversación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el historial solo para ti. El otro participante aún podrá ver los mensajes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatWindow;

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
