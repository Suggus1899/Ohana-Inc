import React, { useState } from 'react';
import { Transaction } from '@/types/transaction.types';
import { createDispute } from '@/services/transaction.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ERROR_TOAST, ERROR_MESSAGES } from '@/constants';
import { Loader2, Upload, X, AlertTriangle } from 'lucide-react';

interface CreateDisputeModalProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const DISPUTE_REASONS = [
  'No recibí el pago',
  'El pago no coincide con el monto acordado',
  'El propietario no responde',
  'Información incorrecta de la propiedad',
  'El cliente no responde',
  'Comprobante de pago inválido',
  'Otro',
];

const CreateDisputeModal: React.FC<CreateDisputeModalProps> = ({
  transaction,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
  });
  const [evidence, setEvidence] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (evidence.length + newFiles.length > 5) {
      toast(ERROR_TOAST(ERROR_MESSAGES.MAX_FILES_EXCEEDED));
      return;
    }
    setEvidence((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setEvidence((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason) {
      toast(ERROR_TOAST(ERROR_MESSAGES.DISPUTE_REASON_REQUIRED));
      return;
    }
    if (!formData.description || formData.description.length < 20) {
      toast(ERROR_TOAST(ERROR_MESSAGES.DISPUTE_DESCRIPTION_TOO_SHORT));
      return;
    }

    try {
      setLoading(true);
      await createDispute({
        transactionId: transaction.id,
        reason: formData.reason,
        description: formData.description,
        evidence,
      });

      toast({
        title: 'Disputa creada',
        description: 'Un operador revisará tu caso pronto. La transacción ha sido congelada.',
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear disputa',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Crear Disputa
          </DialogTitle>
        </DialogHeader>

        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4">
          <p className="text-xs text-yellow-800">
            Al crear una disputa, la transacción se congelará hasta que un operador la revise.
            Asegúrate de proporcionar toda la información y evidencia necesaria.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Motivo de la Disputa *</Label>
            <Select
              value={formData.reason}
              onValueChange={(value) => setFormData({ ...formData, reason: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                {DISPUTE_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dispute-description">Descripción Detallada *</Label>
            <Textarea
              id="dispute-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              required
              minLength={20}
              placeholder="Explica detalladamente el problema. Incluye fechas, montos y cualquier detalle relevante..."
            />
            <p className="text-xs text-gray-400">{formData.description.length}/20 caracteres mínimo</p>
          </div>

          <div className="space-y-2">
            <Label>Evidencias (Capturas, documentos, etc.)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 transition-colors">
              <Upload className="mx-auto mb-2 text-gray-400" size={24} />
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="evidence-upload"
              />
              <label
                htmlFor="evidence-upload"
                className="cursor-pointer text-blue-600 hover:underline text-sm"
              >
                Haz clic para subir archivos
              </label>
              <p className="text-xs text-gray-500 mt-1">Máximo 5 archivos, 5MB cada uno</p>
            </div>
            {evidence.length > 0 && (
              <div className="space-y-1 mt-2">
                {evidence.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded text-sm">
                    <span className="truncate flex-1">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Disputa'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDisputeModal;
