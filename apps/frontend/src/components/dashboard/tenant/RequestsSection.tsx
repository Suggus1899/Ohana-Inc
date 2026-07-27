import { useState, useEffect, useCallback, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, XCircle, MessageSquare, ExternalLink, Loader2, CreditCard, Star, MessageSquare as MessageSquareIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api, RentalRequest } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import P2PPaymentFlow from "@/components/transactions/P2PPaymentFlow";
import { getTransactionByRentalRequest } from "@/services/transaction.service";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";
import { getSocket } from "@/services/socket";
import CompletedPropertyView from "./CompletedPropertyView";
import { ReviewForm } from "@/components/reviews";

interface RentRequest {
  id: number;
  tenantId: number;
  propertyId: number;
  status: 'pending' | 'viewed' | 'accepted' | 'rejected' | 'cancelled' | 'payment_submitted' | 'completed';
  message: string;
  moveInDate?: string;
  phoneNumber?: string;
  property?: {
    id: number;
    title: string;
    address?: string;
    location?: string;
    price: number;
    images?: string[];
    author?: { name: string };
    authorId?: number;
  };
  transaction?: {
    id: number;
    status: string;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const getStatusBadge = (status: RentalRequest['status'], transactionStatus?: string) => {
  if (status === 'payment_submitted' && transactionStatus === 'rejected') {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Pago Rechazado
      </Badge>
    );
  }
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
          Aprobada
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
          <XCircle className="h-3 w-3 mr-1" />
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

const steps = [
  { key: 'pending', label: 'Pendiente', color: 'bg-yellow-500' },
  { key: 'accepted', label: 'Aceptada', color: 'bg-green-500' },
  { key: 'payment', label: 'Pago', color: 'bg-blue-500' },
  { key: 'completed', label: 'Completada', color: 'bg-emerald-600' },
];

// Timeline component showing progress: Pending -> Accepted -> Payment -> Completed
const StatusTimeline = ({ status }: { status: RentRequest['status'] }) => {
  // Determine current step index
  const getCurrentStepIndex = () => {
    switch (status) {
      case 'pending': return 0;
      case 'accepted': return 1;
      case 'payment_submitted': return 2;
      case 'completed': return 3;
      case 'rejected': return -1; // Special case
      case 'cancelled': return -1; // Special case
      default: return 0;
    }
  };

  const currentStep = getCurrentStepIndex();

  // Don't show timeline for rejected/cancelled
  if (currentStep === -1) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
        <XCircle className="h-4 w-4" />
        <span>Solicitud {status === 'rejected' ? 'rechazada' : 'cancelada'}</span>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index <= currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              {/* Step circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? `${step.color} text-white`
                    : 'bg-gray-200 text-gray-500'
                } ${isCurrent ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
              >
                {isCompleted ? (
                  index === 0 ? <Clock className="h-4 w-4" /> :
                  index === 1 ? <CheckCircle className="h-4 w-4" /> :
                  index === 2 ? <CreditCard className="h-4 w-4" /> :
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {/* Step label */}
              <span
                className={`text-xs mt-1 ${
                  isCompleted ? 'text-gray-900 font-medium' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute h-0.5 w-full top-4 left-1/2 -z-10 ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                  style={{ width: 'calc(100% - 2rem)', transform: 'translateX(50%)' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RequestsSection = () => {
  const [requests, setRequests] = useState<RentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentRequest, setPaymentRequest] = useState<RentRequest | null>(null);
  const [activeTransactionId, setActiveTransactionId] = useState<number | null>(null);
  const [loadingTransactionId, setLoadingTransactionId] = useState<number | null>(null);
  const [paymentInitialStep, setPaymentInitialStep] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { startDirectConversation } = useChat();
  const { user } = useAuth();
  
  // Track which reviews have been submitted: key = "property-{id}" or "owner-{ownerId}-{requestId}"
  const [submittedReviews, setSubmittedReviews] = useState<Set<string>>(new Set());

  const [viewingPropertyRequest, setViewingPropertyRequest] = useState<RentRequest | null>(null);

  // Review dialog state
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    type: 'property' | 'user';
    targetId: number;
    targetName: string;
    rentRequestId?: number;
  } | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    const response = await api.getUserRentRequests();
    if (response.success && response.data) {
      const loadedRequests = response.data.requests as unknown as RentRequest[];
      setRequests(loadedRequests);

      // Cargar reviews existentes para solicitudes completadas
      const completedRequests = loadedRequests.filter(r => r.status === 'completed');
      const reviewed = new Set<string>();

      await Promise.all(
        completedRequests.map(async (req) => {
          if (req.property?.id) {
            // Verificar si ya calificó la propiedad
            const propReview = await api.getMyPropertyReview(req.property.id);
            if (propReview.success && propReview.data?.review) {
              reviewed.add(`property-${req.property.id}`);
            }
          }
          if (req.property?.authorId) {
            // Verificar si ya calificó al propietario
            const ownerReview = await api.getUserReviewBetween(req.property.authorId);
            if (ownerReview.success && ownerReview.data?.review) {
              reviewed.add(`owner-${req.property.authorId}`);
            }
          }
        })
      );

      setSubmittedReviews(reviewed);
    } else {
      toast({
        title: "Error",
        description: "No se pudieron cargar tus solicitudes",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchRequests();
    const socket = getSocket();
    if (socket) {
      const handler = () => fetchRequests();
      socket.on('rental_request:status_changed', handler);
      return () => { socket.off('rental_request:status_changed', handler); };
    }
  }, [fetchRequests]);

  const handleOpenPayment = async (request: RentRequest) => {
    setLoadingTransactionId(request.id);
    if (request.status === 'payment_submitted') {
      if (request.transaction?.status === 'rejected') {
        setPaymentInitialStep('details');
      } else {
        setPaymentInitialStep('waiting');
      }
    } else if (request.status === 'completed') {
      setPaymentInitialStep('completed');
    } else {
      setPaymentInitialStep(undefined);
    }
    try {
      if (request.transaction) {
        setActiveTransactionId(request.transaction.id);
      } else {
        const result = await getTransactionByRentalRequest(request.id);
        setActiveTransactionId(result.transaction?.id ?? null);
      }
    } catch {
      setActiveTransactionId(null);
    } finally {
      setLoadingTransactionId(null);
      setPaymentRequest(request);
    }
  };

  const cancelRequest = async (id: number) => {
    const response = await api.updateRentRequestStatus(id, "cancelled");
    
    if (response.success) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "cancelled" } : r));
      toast({ title: "Solicitud cancelada" });
    }
  };

  // Review handling functions
  const handleRateProperty = (request: RentRequest) => {
    if (!request.property) return;
    setReviewDialog({
      open: true,
      type: 'property',
      targetId: request.property.id,
      targetName: request.property.title,
      rentRequestId: request.id,
    });
  };

  const handleRateOwner = (request: RentRequest) => {
    if (!request.property?.authorId) return;
    setReviewDialog({
      open: true,
      type: 'user',
      targetId: request.property.authorId,
      targetName: request.property.author?.name || 'Propietario',
      rentRequestId: request.id,
    });
  };

  const handleSubmitReview = async (data: { rating: number; comment?: string }) => {
    if (!reviewDialog || !user) return;
    
    setIsSubmittingReview(true);
    try {
      let response;
      
      if (reviewDialog.type === 'property') {
        response = await api.createPropertyReview({
          propertyId: reviewDialog.targetId,
          rating: data.rating,
          comment: data.comment,
          rentRequestId: reviewDialog.rentRequestId,
        });
      } else {
        response = await api.createUserReview({
          reviewedId: reviewDialog.targetId,
          rating: data.rating,
          comment: data.comment,
        });
      }
      
      if (response.success) {
        // Marcar este review como enviado en el estado local
        const key = reviewDialog.type === 'property'
          ? `property-${reviewDialog.targetId}`
          : `owner-${reviewDialog.targetId}`;
        setSubmittedReviews(prev => new Set([...prev, key]));

        toast({
          title: "¡Reseña enviada!",
          description: `Has calificado ${reviewDialog.type === 'property' ? 'la propiedad' : 'al propietario'}`,
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

  if (viewingPropertyRequest) {
    return (
      <CompletedPropertyView
        request={viewingPropertyRequest}
        onBack={() => setViewingPropertyRequest(null)}
      />
    );
  }

  if (reviewDialog) {
    return (
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => setReviewDialog(null)} className="mb-2">
            ← Volver a solicitudes
          </Button>
          <h1 className="text-3xl font-bold">
            {reviewDialog.type === 'property' ? 'Calificar Propiedad' : 'Calificar Propietario'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Califica tu experiencia con {reviewDialog.targetName}
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <ReviewForm
              targetName={reviewDialog.targetName}
              onSubmit={handleSubmitReview}
              onCancel={() => setReviewDialog(null)}
              isLoading={isSubmittingReview}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentRequest) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mis Solicitudes</h1>
          <p className="text-muted-foreground mt-1">
            Solicitudes de alquiler que has enviado
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <P2PPaymentFlow
              open={true}
              onOpenChange={() => {}}
              inline
              onBack={() => { setPaymentRequest(null); setPaymentInitialStep(undefined); }}
              request={{
                id: paymentRequest.id,
                transactionId: activeTransactionId,
                property: paymentRequest.property ? {
                  id: paymentRequest.property.id,
                  title: paymentRequest.property.title,
                  address: paymentRequest.property.address || paymentRequest.property.location,
                  price: paymentRequest.property.price,
                  images: paymentRequest.property.images,
                  author: paymentRequest.property.author,
                  authorId: paymentRequest.property.authorId,
                } : {
                  id: paymentRequest.propertyId,
                  title: 'Propiedad #' + paymentRequest.propertyId,
                  address: '',
                  price: 250,
                  images: [],
                },
                moveInDate: paymentRequest.moveInDate,
              }}
              initialStep={paymentInitialStep as 'details' | 'payment_info' | 'submit_proof' | 'waiting' | 'completed' | undefined}
              onComplete={() => {
                setPaymentRequest(null);
                setActiveTransactionId(null);
                setPaymentInitialStep(undefined);
                fetchRequests();
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Solicitudes</h1>
        <p className="text-muted-foreground mt-1">
          Solicitudes de alquiler que has enviado
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {requests.filter((r) => r.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aprobadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {requests.filter((r) => r.status === "accepted").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rechazadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {requests.filter((r) => r.status === "rejected").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Cargando tus solicitudes...</p>
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No tienes solicitudes</h3>
            <p className="text-muted-foreground text-center mb-4">
              Envía solicitudes a las propiedades que te interesen
            </p>
            <Link to="/estudiante">
              <Button>Explorar Propiedades</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Solicitudes</CardTitle>
            <CardDescription>
              Todas tus solicitudes de alquiler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{request.property?.title || "Propiedad"}</h4>
                      {getStatusBadge(request.status, request.transaction?.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 italic">
                      "{request.message}"
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                       <span>Enviada el {new Date(request.createdAt).toLocaleDateString("es-CO")}</span>
                       {request.moveInDate && <span>Mudanza: {new Date(request.moveInDate).toLocaleDateString("es-CO")}</span>}
                    </div>
                    {/* Timeline visual de progreso */}
                    <div className="mt-3 pt-3 border-t">
                      <StatusTimeline status={request.status} />
                    </div>
                    {request.status === 'payment_submitted' && request.transaction?.status === 'rejected' && request.transaction?.notes && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        <strong>Motivo del rechazo:</strong> {request.transaction.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        if (!request.property?.authorId) {
                          toast({ title: "Error", description: "No se encontró el propietario", variant: "destructive" });
                          return;
                        }
                        try {
                          const result = await startDirectConversation(request.property.authorId);
                          if (result) {
                            navigate('/estudiante', { state: { activeSection: 'messages', conversationId: result.id } });
                          }
                        } catch (_error) {
                          toast({ title: "Error", description: "Error al iniciar chat", variant: "destructive" });
                        }
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Mensaje
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setViewingPropertyRequest(request)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Ver Propiedad
                    </Button>
                    {(request.status === "accepted" || request.status === "payment_submitted") && (
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={loadingTransactionId === request.id}
                        onClick={() => handleOpenPayment(request)}
                      >
                        {loadingTransactionId === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-1" />
                        )}
                        {request.status === "payment_submitted" && request.transaction?.status === "rejected"
                          ? "Reenviar Comprobante"
                          : request.status === "payment_submitted"
                          ? "Ver Detalles"
                          : "Proceder al Pago"}
                      </Button>
                    )}
                    {request.status === "completed" && request.property && (
                      <>
                        {/* Calificar Propiedad */}
                        {submittedReviews.has(`property-${request.property.id}`) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="text-emerald-600 border-emerald-200 bg-emerald-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Propiedad calificada
                          </Button>
                        ) : (
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleRateProperty(request)}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Calificar Propiedad
                          </Button>
                        )}

                        {/* Calificar Propietario */}
                        {request.property.authorId && (
                          submittedReviews.has(`owner-${request.property.authorId}`) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="text-emerald-600 border-emerald-200 bg-emerald-50"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Propietario calificado
                            </Button>
                          ) : (
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => handleRateOwner(request)}
                            >
                              <MessageSquareIcon className="h-4 w-4 mr-1" />
                              Calificar Propietario
                            </Button>
                          )
                        )}
                      </>
                    )}
                    {request.status === "pending" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => cancelRequest(request.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default memo(RequestsSection);
