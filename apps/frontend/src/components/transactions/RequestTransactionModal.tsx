import React, { useState } from 'react';
import { Property } from '@/services/api';
import { createTransaction } from '@/services/transaction.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ERROR_TOAST, ERROR_MESSAGES } from '@/constants';
import { Loader2, Info } from 'lucide-react';

interface RequestTransactionModalProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const RequestTransactionModal: React.FC<RequestTransactionModalProps> = ({
  property,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: property.price,
    currency: 'USD',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || formData.amount <= 0) {
      toast(ERROR_TOAST(ERROR_MESSAGES.AMOUNT_MUST_BE_POSITIVE));
      return;
    }

    try {
      setLoading(true);
      await createTransaction({
        propertyId: property.id,
        amount: formData.amount,
        currency: formData.currency,
        notes: formData.notes || undefined,
      });

      toast({
        title: 'Solicitud enviada',
        description: 'Tu solicitud ha sido enviada al propietario. Te notificaremos cuando responda.',
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear solicitud',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar Propiedad</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <h3 className="font-semibold text-sm">{property.title}</h3>
          <p className="text-gray-500 text-xs">{property.address}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monto a Pagar</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="flex-1"
                required
                min="0"
                step="0.01"
              />
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="COP">COP</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Agrega cualquier comentario o pregunta..."
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold text-blue-900 text-sm">¿Cómo funciona?</h4>
            </div>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Envías tu solicitud al propietario</li>
              <li>El propietario revisa y aprueba</li>
              <li>Realizas el pago y subes el comprobante</li>
              <li>El propietario confirma la recepción</li>
              <li>La propiedad se asigna a tu nombre</li>
            </ol>
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
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Solicitud'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RequestTransactionModal;
