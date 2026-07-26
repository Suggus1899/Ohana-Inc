import React, { useState } from 'react';
import { Transaction } from '@/types/transaction.types';
import { submitPayment } from '@/services/transaction.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ERROR_TOAST, ERROR_MESSAGES } from '@/constants';
import { Loader2, Upload, X } from 'lucide-react';

interface SubmitPaymentFormProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  'PSE',
  'Nequi',
  'Daviplata',
  'Efecty',
  'Efectivo',
  'PayPal',
  'Otro',
];

const SubmitPaymentForm: React.FC<SubmitPaymentFormProps> = ({
  transaction,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    paymentMethod: '',
    paymentReference: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (files.length + newFiles.length > 5) {
      toast(ERROR_TOAST(ERROR_MESSAGES.MAX_FILES_EXCEEDED));
      return;
    }
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.paymentMethod) {
      toast(ERROR_TOAST(ERROR_MESSAGES.PAYMENT_METHOD_REQUIRED));
      return;
    }

    if (!formData.paymentReference) {
      toast(ERROR_TOAST(ERROR_MESSAGES.PAYMENT_REFERENCE_REQUIRED));
      return;
    }

    try {
      setLoading(true);
      await submitPayment(transaction.id, {
        paymentMethod: formData.paymentMethod,
        paymentReference: formData.paymentReference,
        paymentDate: new Date(formData.paymentDate).toISOString(),
        paymentProof: files,
      });

      toast({
        title: 'Pago registrado',
        description: 'Tu comprobante ha sido enviado. El propietario verificará el pago.',
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al registrar pago',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
        </DialogHeader>

        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <p className="text-sm text-gray-600">Monto a pagar:</p>
          <p className="text-xl font-bold text-blue-600">
            ${Number(transaction.amount).toLocaleString()} {transaction.currency}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Método de Pago *</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona método de pago" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Referencia de Pago *</Label>
            <Input
              id="reference"
              value={formData.paymentReference}
              onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
              placeholder="Número de referencia, confirmación, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">Fecha de Pago</Label>
            <Input
              id="paymentDate"
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Comprobantes de Pago</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
              <Upload className="mx-auto mb-2 text-gray-400" size={24} />
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="payment-proof-upload"
              />
              <label
                htmlFor="payment-proof-upload"
                className="cursor-pointer text-blue-600 hover:underline text-sm"
              >
                Haz clic para subir archivos
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Máximo 5 archivos, 5MB cada uno
              </p>
            </div>
            {files.length > 0 && (
              <div className="space-y-1 mt-2">
                {files.map((file, index) => (
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

          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-xs text-yellow-800">
              Al confirmar, el sistema registrará tu pago y notificará al propietario para que verifique la recepción. La transacción quedará en custodia (escrow) hasta que el propietario confirme.
            </p>
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
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Confirmar Pago'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitPaymentForm;
