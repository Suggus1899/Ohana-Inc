import { useState, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Inbox, Clock, CheckCircle, XCircle, MessageSquare, Mail, Loader2, User, Star, ArrowLeft, Phone, Fingerprint, ShieldCheck, BadgeCheck } from "lucide-react";
import { api, RentalRequest, User as UserType } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { ReviewForm } from "@/components/reviews";
import { useExchangeRate } from "../../../contexts/ExchangeRateContext";
import { formatDualPrice, usdToCop } from "../../../utils/formatPrice";

const getStatusBadge = (status: RentalRequest['status']) => {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pendiente
        </Badge>
      );
    case "accepted":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Aceptada
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Rechazada
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          Cancelada
        </Badge>
      );
    case "payment_submitted":
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <Clock className="h-3 w-3 mr-1" />
          Pago Enviado
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completada
        </Badge>
      );
    default:
      return null;
  }
};

interface ReceivedRequest {
  id: number;
  tenantId: number;
  propertyId: number;
  status: 'pending' | 'viewed' | 'accepted' | 'rejected' | 'cancelled' | 'payment_submitted' | 'completed';
  message: string;
  moveInDate?: string;
  phoneNumber?: string;
  tenant?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    profilePhotoUrl?: string;
  };
  property?: {
    id: number;
    title: string;
    address?: string;
    price: number;
  };
  createdAt: string;
}

const ReceivedRequestsSection = () => {
  const { rate, loading: rateLoading } = useExchangeRate();
  const [requests, setRequests] = useState<ReceivedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; requestId: number | null }>({
    open: false,
    requestId: null,
  });
  const [rejectReason, setRejectReason] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTenant, setSelectedTenant] = useState<UserType | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  
  // Track which tenants have already been reviewed: key = "tenant-{tenantId}"
  const [submittedReviews, setSubmittedReviews] = useState<Set<string>>(new Set());

  // Review dialog state
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    targetId: number;
    targetName: string;
  } | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getReceivedRentRequests();

      if (response.success && response.data) {
        const loadedRequests = (response.data.requests as unknown) as ReceivedRequest[];
        setRequests(loadedRequests);

        // Cargar reviews existentes para solicitudes completadas
        const completedRequests = loadedRequests.filter(r => r.status === 'completed' && r.tenant);
        const reviewed = new Set<string>();

        await Promise.all(
          completedRequests.map(async (req) => {
            if (req.tenantId) {
              const tenantReview = await api.getUserReviewBetween(req.tenantId);
              if (tenantReview.success && tenantReview.data?.review) {
                reviewed.add(`tenant-${req.tenantId}`);
              }
            }
          })
        );

        setSubmittedReviews(reviewed);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (requestId: number) => {
    setIsProcessing(requestId);
    try {
      const response = await api.updateRentRequestStatus(requestId, 'accepted');

      if (response.success) {
        setRequests(prev =>
          prev.map(r => r.id === requestId ? { ...r, status: 'accepted' } : r)
        );

        toast({
          title: "Solicitud aprobada",
          description: "Se ha creado una transacción P2P. El estudiante puede proceder con el pago.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aprobar la solicitud",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRejectClick = (requestId: number) => {
    setRejectDialog({ open: true, requestId });
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectDialog.requestId) return;
    
    const requestId = rejectDialog.requestId;
    setIsProcessing(requestId);
    try {
      const response = await api.updateRentRequestStatus(requestId, 'rejected');

      if (response.success) {
        setRequests(prev =>
          prev.map(r => r.id === requestId ? { ...r, status: 'rejected', rejectReason } : r)
        );

        toast({
          title: "Solicitud rechazada",
          description: rejectReason 
            ? "Se ha notificado al estudiante con el motivo del rechazo"
            : "Se ha notificado al estudiante",
        });
        
        setRejectDialog({ open: false, requestId: null });
        setRejectReason('');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo rechazar la solicitud",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const viewTenantProfile = async (tenantId: number) => {
    setIsLoadingProfile(true);
    try {
      const response = await api.getUserById(tenantId);
      if (response.success && response.data?.user) {
        setSelectedTenant(response.data.user);
      } else {
        toast({ title: "Error", description: "No se pudo cargar el perfil", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo cargar el perfil", variant: "destructive" });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const closeTenantProfile = () => setSelectedTenant(null);

  const handleStartChat = async (requestId: number) => {
    try {
      const response = await api.createChatConversation(requestId);
      if (response.success && response.data?.conversation?.id) {
        navigate('/propietario', {
          state: { activeSection: 'messages', conversationId: response.data.conversation.id }
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo iniciar la conversación",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo iniciar la conversación",
        variant: "destructive"
      });
    }
  };

  // Review handling functions
  const handleRateTenant = (request: ReceivedRequest) => {
    if (!request.tenant) return;
    setReviewDialog({
      open: true,
      targetId: request.tenant.id,
      targetName: request.tenant.name,
    });
  };

  const handleSubmitReview = async (data: { rating: number; comment?: string }) => {
    if (!reviewDialog || !user) return;
    
    setIsSubmittingReview(true);
    try {
      const response = await api.createUserReview({
        reviewedId: reviewDialog.targetId,
        rating: data.rating,
        comment: data.comment,
      });
      
      if (response.success) {
        // Marcar este tenant como calificado en el estado local
        setSubmittedReviews(prev => new Set([...prev, `tenant-${reviewDialog.targetId}`]));

        toast({
          title: "¡Reseña enviada!",
          description: `Has calificado a ${reviewDialog.targetName}`,
        });
        setReviewDialog(null);
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "No se pudo enviar la reseña",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error enviando review:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la reseña",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const acceptedCount = requests.filter((r) => r.status === "accepted").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  if (selectedTenant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={closeTenantProfile}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a solicitudes
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                <AvatarFallback className="text-lg">
                  {selectedTenant.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
                </AvatarFallback>
                {selectedTenant.profilePhotoUrl && <img src={selectedTenant.profilePhotoUrl} alt="" />}
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{selectedTenant.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="capitalize">
                    {selectedTenant.role === "estudiante" ? "Estudiante" : selectedTenant.role === "propietario" ? "Propietario" : selectedTenant.role === "operator" ? "Operador" : selectedTenant.role === "admin" ? "Administrador" : selectedTenant.role}
                  </Badge>
                  {selectedTenant.isVerified ? (
                    <Badge className="bg-green-500"><BadgeCheck className="h-3 w-3 mr-1" />Verificado</Badge>
                  ) : (
                    <Badge variant="outline"><ShieldCheck className="h-3 w-3 mr-1" />No verificado</Badge>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Correo electrónico</p>
                  <p className="font-medium">{selectedTenant.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{selectedTenant.phonePrefix} {selectedTenant.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Fingerprint className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Cédula</p>
                  <p className="font-medium">{selectedTenant.cedulaType} {selectedTenant.cedula}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Solicitudes Recibidas</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona las solicitudes de alquiler de tus propiedades
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aceptadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{acceptedCount}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rechazadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Todas las Solicitudes</CardTitle>
          <CardDescription>
            {requests.length} solicitudes en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay solicitudes</h3>
              <p className="text-muted-foreground text-center">
                Las solicitudes de alquiler aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const tenantName = request.tenant?.name || "Usuario";
                const initials = tenantName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "U";

                return (
                  <div
                    key={request.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between p-5 rounded-2xl border bg-zinc-50/50 hover:bg-zinc-50 transition-all gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarFallback>{initials}</AvatarFallback>
                        {request.tenant?.profilePhotoUrl && <img src={request.tenant?.profilePhotoUrl} alt="" />}
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{tenantName}{request.tenant?.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500 inline ml-1" />}</h4>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-primary mb-1">
                          {request.property?.title || `Propiedad #${request.propertyId}`}
                        </p>
                        {request.property?.price && rate && !rateLoading && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {formatDualPrice(Number(request.property.price), usdToCop(Number(request.property.price), rate.usdToCop))}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mb-2">
                          "{request.message}"
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {request.tenant?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {request.tenant.email}
                            </span>
                          )}
                          <span>
                            {new Date(request.createdAt).toLocaleDateString("es-VE")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewTenantProfile(request.tenantId)}
                      >
                        <User className="h-4 w-4 mr-1" />
                        Ver Perfil
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartChat(request.id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Mensaje
                      </Button>
                      {request.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isProcessing === request.id}
                            onClick={() => handleRejectClick(request.id)}
                          >
                            {isProcessing === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Rechazar"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            disabled={isProcessing === request.id}
                            onClick={() => handleApprove(request.id)}
                          >
                            {isProcessing === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Aprobar"
                            )}
                          </Button>
                        </>
                      )}
                      {request.status === "completed" && request.tenant && (
                        submittedReviews.has(`tenant-${request.tenantId}`) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="text-emerald-600 border-emerald-200 bg-emerald-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Cliente calificado
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRateTenant(request)}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Calificar Cliente
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ ...rejectDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Rechazar Solicitud
            </DialogTitle>
            <DialogDescription>
              ¿Deseas agregar un motivo para el rechazo? Esto ayudará al estudiante a entender la decisión.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Motivo del rechazo (opcional)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setRejectDialog({ open: false, requestId: null })}
              disabled={isProcessing !== null}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmReject}
              disabled={isProcessing !== null}
              className="gap-2"
            >
              {isProcessing === rejectDialog.requestId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rechazando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Rechazar Solicitud
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={(open) => !open && setReviewDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Calificar Cliente
            </DialogTitle>
            <DialogDescription>
              Califica tu experiencia con {reviewDialog?.targetName || 'el cliente'}
            </DialogDescription>
          </DialogHeader>
          {reviewDialog && (
            <ReviewForm
              targetName={reviewDialog.targetName}
              onSubmit={handleSubmitReview}
              onCancel={() => setReviewDialog(null)}
              isLoading={isSubmittingReview}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(ReceivedRequestsSection);
