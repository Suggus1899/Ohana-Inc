import React, { useEffect, useState, useCallback } from 'react';
import { getPendingDisputes, resolveDispute, markDisputeUnderReview } from '@/services/transaction.service';
import { Dispute, DisputeStatus, STATUS_LABELS, STATUS_COLORS, TransactionStatus } from '@/types/transaction.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ERROR_TOAST, ERROR_MESSAGES } from '@/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeftRight,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';

const DISPUTE_STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-800 border-red-200',
  under_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
};

const DISPUTE_STATUS_LABELS: Record<string, string> = {
  open: 'Abierta',
  under_review: 'En Revisión',
  resolved: 'Resuelta',
  closed: 'Cerrada',
};

const DisputePanel: React.FC = () => {
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');

  const loadDisputes = useCallback(async () => {
    try {
      setLoading(true);
      const { disputes: data } = await getPendingDisputes();
      setDisputes(data);
    } catch (error: unknown) {
      toast(ERROR_TOAST(ERROR_MESSAGES.LOAD_DISPUTES));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const handleMarkReview = async (disputeId: number) => {
    try {
      await markDisputeUnderReview(disputeId);
      toast({ title: 'Disputa marcada como en revisión' });
      loadDisputes();
    } catch (error: unknown) {
      toast(ERROR_TOAST(error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN));
    }
  };

  const handleResolve = async (disputeId: number, decision: 'refund' | 'release' | 'cancel') => {
    if (!resolveNotes.trim()) {
      toast(ERROR_TOAST(ERROR_MESSAGES.RESOLUTION_NOTES_REQUIRED));
      return;
    }
    try {
      setResolveLoading(true);
      await resolveDispute(disputeId, { decision, notes: resolveNotes });
      toast({ title: 'Disputa resuelta exitosamente' });
      setSelectedDispute(null);
      setResolveNotes('');
      loadDisputes();
    } catch (error: unknown) {
      toast(ERROR_TOAST(error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN));
    } finally {
      setResolveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-orange-500" />
          Disputas Pendientes
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : disputes.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay disputas pendientes</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => (
            <Card key={dispute.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Disputa #{dispute.id}</span>
                      <Badge className={DISPUTE_STATUS_COLORS[dispute.status] || ''}>
                        {DISPUTE_STATUS_LABELS[dispute.status] || dispute.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">Transacción #{dispute.transactionId}</p>
                    {dispute.transaction?.property && (
                      <p className="text-sm text-gray-500">{dispute.transaction.property.title}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(dispute.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                  <p className="text-sm font-medium text-gray-700">{dispute.reason}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{dispute.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-gray-500">Reportado por:</span>{' '}
                    <span className="font-medium">{dispute.reporter?.name || `User #${dispute.reportedBy}`}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Reportado contra:</span>{' '}
                    <span className="font-medium">{dispute.reported?.name || `User #${dispute.reportedAgainst}`}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {dispute.status === 'open' && (
                    <Button size="sm" variant="outline" onClick={() => handleMarkReview(dispute.id)}>
                      <Eye className="h-3 w-3 mr-1" /> Tomar Caso
                    </Button>
                  )}
                  <Button size="sm" onClick={() => { setSelectedDispute(dispute); setResolveNotes(''); }}>
                    <ArrowLeftRight className="h-3 w-3 mr-1" /> Resolver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resolve Dialog */}
      {selectedDispute && (
        <Dialog open={!!selectedDispute} onOpenChange={(open) => { if (!open) setSelectedDispute(null); }}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Resolver Disputa #{selectedDispute.id}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-sm">{selectedDispute.reason}</p>
                <p className="text-sm text-gray-600 mt-1">{selectedDispute.description}</p>
              </div>

              {selectedDispute.evidence && selectedDispute.evidence.length > 0 && (
                <div>
                  <p className="text-sm font-medium flex items-center gap-1 mb-2">
                    <ImageIcon className="h-4 w-4" /> Evidencias ({selectedDispute.evidence.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDispute.evidence.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="bg-gray-100 rounded h-16 block overflow-hidden hover:opacity-75">
                        <img src={url} alt={`Evidencia ${i+1}`} className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label>Notas de Resolución *</Label>
                <Textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  rows={3}
                  placeholder="Explica la resolución tomada..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Decisión</Label>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    className="justify-start border-green-300 text-green-700 hover:bg-green-50"
                    disabled={resolveLoading}
                    onClick={() => handleResolve(selectedDispute.id, 'release')}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    A favor del Propietario (liberar pago)
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start border-blue-300 text-blue-700 hover:bg-blue-50"
                    disabled={resolveLoading}
                    onClick={() => handleResolve(selectedDispute.id, 'refund')}
                  >
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    A favor del Cliente (reembolsar)
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start border-gray-300 text-gray-700 hover:bg-gray-50"
                    disabled={resolveLoading}
                    onClick={() => handleResolve(selectedDispute.id, 'cancel')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar Transacción
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DisputePanel;
