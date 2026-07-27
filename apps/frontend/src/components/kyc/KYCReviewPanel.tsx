import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, User, Calendar, FileText, Image as ImageIcon, Filter, X, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { api } from "@/services/api";

// Types
interface KYCVerification {
  id: number;
  userId: number;
  status: string;
  fullName: string;
  documentNumber: string;
  dateOfBirth: string;
  nationality: string;
  faceMatchScore?: number;
  livenessScore?: number;
  documentValidityScore?: number;
  fraudScore?: number;
  createdAt: string;
  updatedAt: string;
}

interface KYCDocument {
  id: number;
  verificationId: number;
  documentType: string;
  url: string;
}

interface KYCAttempt {
  id: number;
  attemptNumber: number;
  step: string;
  success: boolean;
  errorMessage?: string;
  metadata?: {
    operatorId?: number;
    action?: string;
    notes?: string;
  };
  createdAt: string;
}

interface VerificationDetails {
  id: number;
  status: string;
  fullName: string;
  documentNumber: string;
  documentType: string;
  dateOfBirth: string;
  nationality: string;
  address?: string;
  faceMatchScore?: number;
  livenessScore?: number;
  documentValidityScore?: number;
  fraudScore?: number;
  reviewedBy?: number;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  attempts: number;
  lastAttemptAt?: string;
  verifiedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

const documentDisplayMap: Record<string, { key: string; label: string }> = {
  'id_front': { key: 'id_front', label: 'Cédula Frente' },
  'id_back': { key: 'id_back', label: 'Cédula Reverso' },
  'selfie': { key: 'selfie', label: 'Selfie' },
  'selfie_with_doc': { key: 'selfie_with_doc', label: 'Selfie con Documento' },
};

const displayDocuments = ['id_front', 'id_back', 'selfie', 'selfie_with_doc'];

interface KYCReviewPanelProps {
  operatorId: number;
}

interface VerificationFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  fraudScoreMin?: number;
  fraudScoreMax?: number;
}

const KYCReviewPanel = ({ operatorId: _operatorId }: KYCReviewPanelProps) => {
  // State
  const [verifications, setVerifications] = useState<KYCVerification[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<KYCVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<VerificationFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [_documents, setDocuments] = useState<KYCDocument[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [attempts, setAttempts] = useState<KYCAttempt[]>([]);
  const [verificationDetails, setVerificationDetails] = useState<VerificationDetails | null>(null);
  const imageUrlsRef = useRef<Record<string, string>>({});
  
  const { toast } = useToast();

  // Load pending verifications on mount and when filters change
  const loadPendingVerifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getPendingKYCVerifications(filters);
      
      if (response.success && response.data) {
        setVerifications(response.data.verifications as unknown as KYCVerification[]);
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "No se pudieron cargar las verificaciones pendientes",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading verifications:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las verificaciones pendientes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    loadPendingVerifications();
  }, [loadPendingVerifications]);

  // Cleanup image URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(imageUrlsRef.current).forEach(URL.revokeObjectURL);
    };
  }, []);

  const fetchVerificationDetails = async (verificationId: number) => {
    setIsLoadingDocuments(true);
    try {
      Object.values(imageUrlsRef.current).forEach(URL.revokeObjectURL);
      imageUrlsRef.current = {};
      setImageUrls({});
      
      const response = await api.getKYCVerificationDetails(verificationId);
      
      if (response.success && response.data) {
        const data = response.data as unknown as {
          verification: VerificationDetails;
          documents: KYCDocument[];
          attempts: KYCAttempt[];
        };
        
        setVerificationDetails(data.verification);
        setAttempts(data.attempts || []);
        
        const docs = data.documents as unknown as KYCDocument[];
        setDocuments(docs);
        
        const urls: Record<string, string> = {};
        for (const doc of docs) {
          try {
            const blob = await api.viewDocument(doc.id);
            urls[doc.documentType] = URL.createObjectURL(blob);
          } catch (err) {
            console.error(`Failed to fetch document ${doc.id}:`, err);
          }
        }
        imageUrlsRef.current = urls;
        setImageUrls(urls);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los documentos",
        variant: "destructive"
      });
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const handleSelectVerification = (verification: KYCVerification) => {
    setSelectedVerification(verification);
    setDocuments([]);
    setImageUrls({});
    setAttempts([]);
    setVerificationDetails(null);
    fetchVerificationDetails(verification.id);
  };

  const openActionDialog = (type: 'approve' | 'reject') => {
    setActionType(type);
    setActionDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedVerification || !actionType) return;

    try {
      if (actionType === 'approve') {
        const response = await api.approveKYCVerification(selectedVerification.id, notes);
        
        if (response.success) {
          toast({
            title: "Verificación Aprobada",
            description: `La verificación de ${selectedVerification.fullName} ha sido aprobada exitosamente.`,
          });
        } else {
          toast({
            title: "Error",
            description: response.error?.message || "No se pudo aprobar la verificación",
            variant: "destructive"
          });
          return;
        }
      } else if (actionType === 'reject') {
        if (!reason.trim()) {
          toast({
            title: "Error",
            description: "Debe proporcionar una razón para el rechazo",
            variant: "destructive"
          });
          return;
        }
        
        const response = await api.rejectKYCVerification(selectedVerification.id, reason);
        
        if (response.success) {
          toast({
            title: "Verificación Rechazada",
            description: `La verificación de ${selectedVerification.fullName} ha sido rechazada.`,
          });
        } else {
          toast({
            title: "Error",
            description: response.error?.message || "No se pudo rechazar la verificación",
            variant: "destructive"
          });
          return;
        }
      }

      // Reset state
      setActionDialogOpen(false);
      setActionType(null);
      setNotes('');
      setReason('');
      setSelectedVerification(null);
      
      // Reload verifications
      loadPendingVerifications();
    } catch (error) {
      console.error('Error processing action:', error);
      toast({
        title: "Error",
        description: "No se pudo completar la acción",
        variant: "destructive"
      });
    }
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Aprobado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const updateFilter = (key: keyof VerificationFilters, value: string | number | undefined) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (value === undefined || value === '') {
        delete newFilters[key];
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newFilters[key] = value as any;
      }
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Panel de Revisión KYC</h1>
          <p className="text-muted-foreground mt-1">
            Revisa y aprueba verificaciones de identidad pendientes
          </p>
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
          className="w-full md:w-auto"
        >
          <Filter className="h-4 w-4 mr-2" />
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          {hasActiveFilters && (
            <Badge className="ml-2 bg-blue-600 text-white">{Object.keys(filters).length}</Badge>
          )}
        </Button>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filtros</CardTitle>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar Filtros
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status-filter">Estado</Label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => updateFilter('status', value || undefined)}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los estados</SelectItem>
                    <SelectItem value="pending_review">Pendiente</SelectItem>
                    <SelectItem value="under_review">En Revisión</SelectItem>
                    <SelectItem value="approved">Aprobado</SelectItem>
                    <SelectItem value="rejected">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From Filter */}
              <div className="space-y-2">
                <Label htmlFor="date-from-filter">Fecha Desde</Label>
                <Input
                  id="date-from-filter"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
                />
              </div>

              {/* Date To Filter */}
              <div className="space-y-2">
                <Label htmlFor="date-to-filter">Fecha Hasta</Label>
                <Input
                  id="date-to-filter"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
                />
              </div>

              {/* Fraud Score Min Filter */}
              <div className="space-y-2">
                <Label htmlFor="fraud-min-filter">Fraude Mínimo (%)</Label>
                <Input
                  id="fraud-min-filter"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={filters.fraudScoreMin ?? ''}
                  onChange={(e) => updateFilter('fraudScoreMin', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>

              {/* Fraud Score Max Filter */}
              <div className="space-y-2">
                <Label htmlFor="fraud-max-filter">Fraude Máximo (%)</Label>
                <Input
                  id="fraud-max-filter"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="100"
                  value={filters.fraudScoreMax ?? ''}
                  onChange={(e) => updateFilter('fraudScoreMax', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Layout: List (1/3) + Details (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Verification List (1/3) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Verificaciones</CardTitle>
            <CardDescription>
              {verifications.length} verificación{verifications.length !== 1 ? 'es' : ''} en total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : verifications.length === 0 ? (
              <div className="text-center py-10 bg-muted/30 rounded-lg">
                <User className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">No hay verificaciones registradas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {verifications.map((verification) => (
                  <div
                    key={verification.id}
                    onClick={() => handleSelectVerification(verification)}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                      selectedVerification?.id === verification.id
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-blue-300"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm">{verification.fullName}</h4>
                      {getStatusBadge(verification.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      <FileText className="h-3 w-3 inline mr-1" />
                      {verification.documentNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {new Date(verification.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel: Verification Details (2/3) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detalles de Verificación</CardTitle>
            <CardDescription>
              {selectedVerification 
                ? `Revisando verificación de ${selectedVerification.fullName}`
                : 'Selecciona una verificación para ver los detalles'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedVerification ? (
              <div className="text-center py-20 bg-muted/30 rounded-lg">
                <User className="h-16 w-16 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Selecciona una verificación de la lista para revisar
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Personal Information Grid */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Información Personal</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Nombre Completo</Label>
                      <p className="font-medium">{selectedVerification.fullName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Número de Documento</Label>
                      <p className="font-medium">{selectedVerification.documentNumber}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Fecha de Nacimiento</Label>
                      <p className="font-medium">
                        {new Date(selectedVerification.dateOfBirth).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Nacionalidad</Label>
                      <p className="font-medium">{selectedVerification.nationality}</p>
                    </div>
                  </div>
                </div>

                {/* Document Images Grid 2x2 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Documentos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {isLoadingDocuments ? (
                      <>
                        {[1, 2, 3, 4].map((i) => (
                          <div 
                            key={i}
                            className="aspect-video bg-muted rounded-lg flex items-center justify-center"
                          >
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          </div>
                        ))}
                      </>
                    ) : displayDocuments.map((docType) => {
                      const config = documentDisplayMap[docType];
                      const imageUrl = imageUrls[docType];
                      
                      return (
                        <div 
                          key={docType}
                          className="aspect-video bg-muted rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors overflow-hidden"
                          onClick={() => imageUrl && openImageModal(imageUrl)}
                        >
                          {imageUrl ? (
                            <img 
                              src={imageUrl} 
                              alt={config.label}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center">
                              <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">{config.label}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scores Grid */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-1 w-8 rounded-full bg-primary/60" />
                    <h3 className="text-lg font-semibold">Puntuaciones</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-none bg-blue-50 text-blue-700 shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium mb-1 uppercase tracking-wide">Coincidencia Facial</p>
                        <p className="text-2xl font-bold">
                          {selectedVerification.faceMatchScore != null ? Number(selectedVerification.faceMatchScore).toFixed(1) : 'N/A'}%
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-none bg-green-50 text-green-700 shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium mb-1 uppercase tracking-wide">Detección de Vida</p>
                        <p className="text-2xl font-bold">
                          {selectedVerification.livenessScore != null ? Number(selectedVerification.livenessScore).toFixed(1) : 'N/A'}%
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-none bg-purple-50 text-purple-700 shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium mb-1 uppercase tracking-wide">Validez del Documento</p>
                        <p className="text-2xl font-bold">
                          {selectedVerification.documentValidityScore != null ? Number(selectedVerification.documentValidityScore).toFixed(1) : 'N/A'}%
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-none bg-red-50 text-red-700 shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium mb-1 uppercase tracking-wide">Riesgo de Fraude</p>
                        <p className="text-2xl font-bold">
                          {selectedVerification.fraudScore != null ? Number(selectedVerification.fraudScore).toFixed(1) : 'N/A'}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Verification Metadata */}
                {verificationDetails && (verificationDetails.reviewedAt || verificationDetails.reviewNotes || verificationDetails.rejectionReason) && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-1 w-8 rounded-full bg-primary/60" />
                      <h3 className="text-lg font-semibold">Resultado de Revisión</h3>
                    </div>
                    <Card className="border-l-4 border-l-primary bg-muted/30">
                      <CardContent className="p-4 space-y-3">
                        {verificationDetails.reviewedAt && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Revisado:</span>
                            <span className="font-medium">{new Date(verificationDetails.reviewedAt).toLocaleString('es-ES')}</span>
                          </div>
                        )}
                        {verificationDetails.reviewNotes && (
                          <div className="flex items-start gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="text-muted-foreground">Notas:</span>
                            <span className="font-medium">{verificationDetails.reviewNotes}</span>
                          </div>
                        )}
                        {verificationDetails.rejectionReason && (
                          <div className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                            <span className="text-destructive font-medium">Razón de rechazo:</span>
                            <span className="font-medium">{verificationDetails.rejectionReason}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Activity Log */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-1 w-8 rounded-full bg-primary/60" />
                    <h3 className="text-lg font-semibold">Historial de Actividad</h3>
                    {attempts.length > 0 && (
                      <Badge variant="outline" className="text-xs">{attempts.length} registro{attempts.length !== 1 ? 's' : ''}</Badge>
                    )}
                  </div>
                  {attempts.length === 0 ? (
                    <div className="text-center py-6 bg-muted/30 rounded-lg">
                      <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Sin actividad registrada</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
                      <div className="space-y-3">
                        {attempts.map((attempt) => (
                          <div key={attempt.id} className="flex gap-3">
                            <div className={cn(
                              "relative z-10 mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                              attempt.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>
                              {attempt.success
                                ? <CheckCircle className="h-3.5 w-3.5" />
                                : <XCircle className="h-3.5 w-3.5" />
                              }
                            </div>
                            <div className="flex-1 min-w-0 pb-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium">
                                  {attempt.step === 'manual_review'
                                    ? `Revisión manual: ${attempt.metadata?.action === 'approved' ? 'Aprobada' : 'Rechazada'}`
                                    : attempt.step === 'face_match'
                                      ? 'Verificación facial'
                                      : attempt.step === 'liveness'
                                        ? 'Detección de vida'
                                        : attempt.step === 'ocr'
                                          ? 'OCR de documento'
                                          : attempt.step
                                  }
                                </p>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {new Date(attempt.createdAt).toLocaleString('es-ES')}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {attempt.step === 'manual_review'
                                  ? (attempt.metadata?.action === 'approved'
                                      ? (attempt.metadata?.notes ? `Notas: ${attempt.metadata.notes}` : 'Sin notas adicionales')
                                      : `Razón: ${attempt.errorMessage || 'No especificada'}`
                                    )
                                  : (attempt.success ? 'Completado exitosamente' : `Error: ${attempt.errorMessage || 'No especificado'}`)
                                }
                              </p>
                              {attempt.metadata?.operatorId && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  Operador ID: {attempt.metadata.operatorId}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <Separator />
                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => openActionDialog('approve')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprobar
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => openActionDialog('reject')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Vista de Documento</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center bg-muted rounded-lg p-4">
            {selectedImage ? (
              <img 
                src={selectedImage} 
                alt="Documento" 
                className="max-w-full max-h-[70vh] object-contain"
              />
            ) : (
              <div className="text-center py-20">
                <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Imagen no disponible</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Aprobar Verificación' : 'Rechazar Verificación'}
            </DialogTitle>
            <DialogDescription>
              {selectedVerification && `Usuario: ${selectedVerification.fullName} (${selectedVerification.documentNumber})`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {actionType === 'approve' ? (
              <div className="space-y-2">
                <Label htmlFor="notes">Notas (Opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Agregar notas sobre la aprobación..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="reason">Razón del Rechazo (Obligatorio)</Label>
                <Textarea
                  id="reason"
                  placeholder="Especificar la razón del rechazo..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className={!reason.trim() ? 'border-red-300' : ''}
                />
                {!reason.trim() && (
                  <p className="text-sm text-red-600">La razón del rechazo es obligatoria</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAction}
              disabled={actionType === 'reject' && !reason.trim()}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {actionType === 'approve' ? 'Aprobar' : 'Rechazar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KYCReviewPanel;
