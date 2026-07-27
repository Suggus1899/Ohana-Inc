import { useState, useEffect, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, 
  Search, 
  Send, 
  User,
  MoreVertical,
  Loader2,
  Building,
  BadgeCheck,
} from "lucide-react";
import { api, Conversation, Message } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const ConversationsSection = () => {
  const { user: currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchConversations = async () => {
    setIsLoading(true);
    const response = await api.getConversations();
    if (response.success && response.data) {
      setConversations(response.data);
    }
    setIsLoading(false);
  };

  const fetchMessages = async (userId: number | string) => {
    const response = await api.getChatHistory(userId);
    if (response.success && response.data) {
      setMessages(response.data);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.user.id);
      const interval = setInterval(() => fetchMessages(selectedChat.user.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    setIsSending(true);
    const response = await api.sendMessage(selectedChat.user.id, newMessage);
    if (response.success) {
      setNewMessage("");
      fetchMessages(selectedChat.user.id);
    }
    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-6">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-bold">Mensajería</h1>
            <p className="text-muted-foreground mt-1">Chat en tiempo real con usuarios y propietarios</p>
         </div>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Sidebar: Conversations */}
        <Card className="w-full md:w-80 border-none shadow-lg flex flex-col">
          <CardHeader className="pb-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar chat..." 
                  className="pl-9 bg-zinc-50 border-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-thin">
            {isLoading ? (
               <div className="flex items-center justify-center p-12">
                  <Loader2 className="animate-spin opacity-20" />
               </div>
            ) : conversations.length === 0 ? (
               <div className="text-center p-12 text-muted-foreground italic">No hay conversaciones</div>
            ) : (
               conversations.map((conv, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedChat(conv)}
                    className={cn(
                      "p-4 border-b cursor-pointer transition-colors hover:bg-zinc-50 flex items-center gap-3",
                      selectedChat?.user.id === conv.user.id ? "bg-zinc-50 border-r-4 border-r-primary" : ""
                    )}
                  >
                    <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden border">
                       {conv.user.profilePhotoUrl ? <img src={conv.user.profilePhotoUrl} alt="" className="object-cover" /> : <User className="h-5 w-5 text-zinc-400" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                       <div className="flex items-center justify-between">
                           <p className="font-bold text-sm truncate">{conv.user.name}{conv.user.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500 inline ml-1" />}</p>
                          <span className="text-[10px] text-zinc-400">{new Date(conv.lastMessage.createdAt).getHours()}:{new Date(conv.lastMessage.createdAt).getMinutes()}</span>
                       </div>
                       <p className="text-xs text-muted-foreground truncate">{conv.lastMessage.content}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                       <div className="h-4 w-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-black">
                          {conv.unreadCount}
                       </div>
                    )}
                  </div>
               ))
            )}
          </CardContent>
        </Card>

        {/* Main: Chat View */}
        <Card className="flex-1 border-none shadow-xl flex flex-col bg-white">
           {selectedChat ? (
             <>
               <CardHeader className="border-b py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden border">
                        {selectedChat.user.profilePhotoUrl ? <img src={selectedChat.user.profilePhotoUrl} alt="" className="object-cover" /> : <User className="h-5 w-5 text-zinc-400" />}
                      </div>
                      <div>
                        <p className="font-bold">{selectedChat.user.name}{selectedChat.user.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500 inline ml-1" />}</p>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                          En línea ahora
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                  </div>
               </CardHeader>
               <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/30 scrollbar-thin">
                  {messages.map((msg, i) => (
                    <div key={i} className={cn("flex flex-col", msg.senderId === currentUser?.id ? "items-end" : "items-start")}>
                      <div className={cn(
                        "max-w-[70%] p-4 rounded-3xl text-sm shadow-sm",
                        msg.senderId === currentUser?.id ? "bg-zinc-900 text-white rounded-tr-none" : "bg-white text-zinc-800 rounded-tl-none border border-zinc-100"
                      )}>
                        {msg.property && (
                           <div className="mb-2 p-2 bg-black/10 rounded-xl flex items-center gap-2 border border-white/5">
                              <Building className="h-3 w-3" />
                              <span className="text-[10px] font-bold truncate">Ref: {msg.property.title}</span>
                           </div>
                        )}
                        <p className="leading-relaxed">{msg.content}</p>
                      </div>
                      <span className="text-[9px] text-zinc-400 mt-1 uppercase font-bold tracking-tighter px-2">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
               </CardContent>
               <div className="p-4 border-t bg-white rounded-b-3xl">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input 
                      placeholder="Escribe un mensaje..." 
                      className="bg-zinc-50 border-none h-11 rounded-2xl"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button size="icon" className="h-11 w-11 rounded-2xl shadow-lg shadow-primary/20" disabled={!newMessage.trim() || isSending}>
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
               </div>
             </>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-30">
                <div className="h-24 w-24 rounded-full bg-zinc-100 flex items-center justify-center mb-6">
                   <MessageSquare className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold">Tus Mensajes</h3>
                <p className="text-sm max-w-xs">Selecciona una conversación del panel izquierdo para comenzar a chatear.</p>
             </div>
           )}
        </Card>
      </div>
    </div>
  );
};

const cn = (...inputs: unknown[]) => inputs.filter(Boolean).join(' ');

export default memo(ConversationsSection);
