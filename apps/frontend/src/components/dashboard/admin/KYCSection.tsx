import { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ShieldCheck, Search, Clock, CheckCircle, XCircle, Mail, FileText, Eye, Loader2, Download } from "lucide-react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { api } from "@/services/api";

interface KYCVerification {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  fullName: string;
  documentNumber: string;
  documentType: string;
  status: string;
  verificationLevel: number;
  faceMatchScore: number;
  livenessScore: number;
  documentValidityScore: number;
  fraudScore: number;
  submittedAt: string;
  createdAt: string;
}

interface KYCDocument {
  id: number;
  verificationId: number;
  documentType: string;
  url: string;
  uploadedAt: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
    case "pending_review":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pendiente
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Aprobado
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Rechazado
        </Badge>
      );
    default:
      return null;
  }
};

const KYCSection = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [rejectModal, setRejectModal] = useState<{ open: boolean; kyc: KYCVerification | null }>({ open: false, kyc: null });
  const [rejectReason, setRejectReason] = useState("");
  const [docModal, setDocModal] = useState<{ open: boolean; kyc: KYCVerification | null; documents: KYCDocument[]; loading: boolean }>({ open: false, kyc: null, documents: [], loading: false });

  const { data: pendingData, isLoading: isLoadingPending } = useQuery({
    queryKey: ['kyc-pending'],
    queryFn: () => api.getPendingKYCVerifications({ status: 'pending_review', limit: 50 }),
    refetchInterval: 30000,
  });

  const verifications = (pendingData?.data?.verifications || []) as unknown as KYCVerification[];

  const filtered = search
    ? verifications.filter((k) => {
        const name = (k.userName ?? "").toLowerCase();
        const email = (k.userEmail ?? "").toLowerCase();
        const q = search.toLowerCase();
        return name.includes(q) || email.includes(q);
      })
    : verifications;

  const pendingCount = verifications.filter(k => k.status === 'pending_review').length;
  const approvedCount = verifications.filter(k => k.status === 'approved').length;
  const rejectedCount = verifications.filter(k => k.status === 'rejected').length;

  const handleApprove = useCallback(async (kyc: KYCVerification) => {
    try {
      const response = await api.approveKYCVerification(kyc.id);
      if (response.success) {
        toast({ title: 'Aprobado', description: `Verificación de ${kyc.userName} aprobada` });
        queryClient.invalidateQueries({ queryKey: ['kyc-pending'] });
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo aprobar', variant: 'destructive' });
    }
  }, [queryClient, toast]);

  const handleRejectConfirm = useCallback(async () => {
    if (!rejectModal.kyc || !rejectReason.trim()) return;
    try {
      const response = await api.rejectKYCVerification(rejectModal.kyc.id, rejectReason);
      if (response.success) {
        toast({ title: 'Rechazado', description: `Verificación de ${rejectModal.kyc.userName} rechazada` });
        setRejectModal({ open: false, kyc: null });
        setRejectReason("");
        queryClient.invalidateQueries({ queryKey: ['kyc-pending'] });
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo rechazar', variant: 'destructive' });
    }
  }, [rejectModal, rejectReason, queryClient, toast]);

  const handleViewDocuments = useCallback(async (kyc: KYCVerification) => {
    setDocModal({ open: true, kyc, documents: [], loading: true });
    try {
      const response = await api.getKYCVerificationDetails(kyc.id);
      if (response.success && response.data) {
        setDocModal(prev => ({ ...prev, documents: (response.data.documents || []) as KYCDocument[], loading: false }));
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los documentos', variant: 'destructive' });
      setDocModal(prev => ({ ...prev, loading: false }));
    }
  }, [toast]);

  const docTypeLabel = (t: string) => {
    const labels: Record<string, string> = {
      'id_front': 'Cédula - Frontal',
      'id_back': 'Cédula - Reverso',
      'selfie': 'Selfie',
      'selfie_with_doc': 'Selfie con Cédula',
      'liveness_video': 'Video de Detección de Vida',
    };
    return labels[t] || t;
  };

  const isVideo = (doc: KYCDocument) => doc.documentType === 'liveness_video';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Verificaciones KYC</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona las verificaciones de identidad de los usuarios
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aprobados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rechazados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {isLoadingPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* KYC List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Solicitudes de Verificación</CardTitle>
              <CardDescription>{verifications.length} solicitudes en total</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuario..."
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ShieldCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay verificaciones</h3>
              <p className="text-muted-foreground text-center">
                {search ? "No se encontraron resultados para tu búsqueda" : "Las solicitudes de verificación aparecerán aquí"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((kyc) => {
                const displayName = kyc.fullName || kyc.userName || "Usuario";
                const initials = displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                const email = kyc.userEmail || "";

                return (
                  <div
                    key={kyc.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-lg border gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{displayName}</h4>
                          {getStatusBadge(kyc.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {email}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {kyc.documentNumber ? `C.I. ${kyc.documentNumber}` : 'Sin cédula'}
                          </span>
                          {kyc.faceMatchScore > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Rostro: {kyc.faceMatchScore}%
                            </span>
                          )}
                          {kyc.fraudScore > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Fraude: {kyc.fraudScore}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enviado el {kyc.createdAt ? new Date(kyc.createdAt).toLocaleDateString("es-VE", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-16 lg:ml-0">
                      <Button variant="outline" size="sm" onClick={() => handleViewDocuments(kyc)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Documentos
                      </Button>
                      {kyc.status === "pending_review" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setRejectModal({ open: true, kyc })}
                          >
                            Rechazar
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(kyc)}
                          >
                            Aprobar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de rechazo */}
      <Dialog open={rejectModal.open} onOpenChange={open => { setRejectModal({ open, kyc: null }); setRejectReason(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Rechazar Verificación
            </DialogTitle>
            <DialogDescription>
              Indica el motivo del rechazo. El usuario será notificado.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo del rechazo..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModal({ open: false, kyc: null })}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim()}
              onClick={handleRejectConfirm}
            >
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de documentos */}
      <Dialog open={docModal.open} onOpenChange={open => { if (!open) setDocModal({ open: false, kyc: null, documents: [], loading: false }); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos de {docModal.kyc?.fullName || docModal.kyc?.userName || 'Usuario'}
            </DialogTitle>
            <DialogDescription>
              Documentos e información del usuario para verificación KYC
            </DialogDescription>
          </DialogHeader>

          {docModal.loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : docModal.documents.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay documentos disponibles</p>
          ) : (
            <div className="space-y-6">
              {/* User info */}
              {docModal.kyc && (
                <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-4 rounded-lg">
                  <div>
                    <span className="text-muted-foreground">Nombre:</span>
                    <p className="font-medium">{docModal.kyc.fullName || docModal.kyc.userName || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cédula:</span>
                    <p className="font-medium">{docModal.kyc.documentNumber || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{docModal.kyc.userEmail || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estado:</span>
                    <div className="font-medium">{getStatusBadge(docModal.kyc.status)}</div>
                  </div>
                  {docModal.kyc.faceMatchScore > 0 && (
                    <div>
                      <span className="text-muted-foreground">Coincidencia Rostro:</span>
                      <p className="font-medium">{docModal.kyc.faceMatchScore}%</p>
                    </div>
                  )}
                  {docModal.kyc.fraudScore > 0 && (
                    <div>
                      <span className="text-muted-foreground">Fraude:</span>
                      <p className="font-medium">{docModal.kyc.fraudScore}%</p>
                    </div>
                  )}
                </div>
              )}

              {/* Documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docModal.documents.map(doc => (
                  <Card key={doc.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">{docTypeLabel(doc.documentType)}</CardTitle>
                      <CardDescription className="text-xs">
                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString('es-VE') : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isVideo(doc) ? (
                        doc.url ? (
                          <video controls className="w-full rounded-md" src={doc.url}>
                            Tu navegador no soporta video
                          </video>
                        ) : (
                          <p className="text-sm text-muted-foreground">Video no disponible</p>
                        )
                      ) : doc.url ? (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <img src={doc.url} alt={doc.documentType} className="w-full rounded-md border cursor-pointer hover:opacity-90 transition-opacity" />
                        </a>
                      ) : (
                        <div className="flex items-center justify-center py-8 bg-muted/30 rounded-md">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground ml-2">No disponible</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDocModal({ open: false, kyc: null, documents: [], loading: false })}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KYCSection;
