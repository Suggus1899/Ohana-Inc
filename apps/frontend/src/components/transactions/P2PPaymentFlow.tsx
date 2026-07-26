import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ERROR_TOAST, ERROR_MESSAGES } from '@/constants';
import {
  Loader2,
  Upload,
  X,
  CheckCircle2,
  Clock,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Building,
  User as UserIcon,
  Copy,
  AlertTriangle,
  PartyPopper,
  Image as ImageIcon,
  Banknote,
  Phone,
} from 'lucide-react';
import { api } from '@/services/api';
import { submitPayment, getTransactionDetails } from '@/services/transaction.service';
import { useExchangeRate } from '@/contexts/ExchangeRateContext';
import { formatDualPrice, formatCurrency, usdToVes } from '@/utils/formatPrice';

const PRIMARY_PAYMENT_METHODS = [
  { value: 'transferencia', label: 'Transferencia Bancaria', icon: '🏦' },
  { value: 'pago_movil', label: 'Pago Móvil', icon: '📱' },
];

const SECONDARY_PAYMENT_METHODS = [
  { value: 'zelle', label: 'Zelle', icon: '💵' },
  { value: 'binance', label: 'Binance Pay', icon: '🪙' },
  { value: 'efectivo', label: 'Efectivo', icon: '💰' },
];

const ALL_PAYMENT_METHODS = [...PRIMARY_PAYMENT_METHODS, ...SECONDARY_PAYMENT_METHODS];

interface OwnerPaymentInfo {
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  bankAccountType: string | null;
  bankPhone: string | null;
  bankPhoneId: string | null;
  bankPhoneName: string | null;
}

// Steps
type PaymentStep = 'details' | 'payment_info' | 'submit_proof' | 'waiting' | 'completed';

interface P2PPaymentFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inline?: boolean;
  onBack?: () => void;
  request: {
    id: number;
    transactionId?: number | null;
    property?: {
      id: number;
      title: string;
      address?: string;
      price: number;
      images?: string[];
      author?: { name: string };
      authorId?: number;
    };
    moveInDate?: string;
  };
  initialStep?: PaymentStep;
  onComplete?: () => void;
}

const P2PPaymentFlow: React.FC<P2PPaymentFlowProps> = ({
  open,
  onOpenChange,
  inline,
  onBack,
  request,
  initialStep,
  onComplete,
}) => {
  const { toast } = useToast();
  const { rate } = useExchangeRate();
  const [step, setStep] = useState<PaymentStep>(initialStep || 'details');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [files, setFiles] = useState<File[]>([]);
  const [copied, setCopied] = useState('');
  const [ownerPaymentInfo, setOwnerPaymentInfo] = useState<OwnerPaymentInfo | null>(null);
  const [loadingPaymentInfo, setLoadingPaymentInfo] = useState(false);

  const property = request.property;
  const amount = property?.price || 0;
  const vesAmount = rate?.usdToVes ? usdToVes(amount, rate.usdToVes) : 0;
  const ownerId = property?.authorId;

  useEffect(() => {
    if (!open || !ownerId) return;
    setLoadingPaymentInfo(true);
    api.getUserPaymentInfo(ownerId)
      .then((res) => {
        setOwnerPaymentInfo(res.data?.paymentInfo ?? null);
      })
      .catch(() => setOwnerPaymentInfo(null))
      .finally(() => setLoadingPaymentInfo(false));
  }, [open, ownerId]);

  useEffect(() => {
    if (!open || !request.transactionId) return;
    if (initialStep !== 'waiting' && initialStep !== 'completed') return;
    getTransactionDetails(request.transactionId)
      .then(({ transaction: tx }) => {
        if (tx.paymentMethod) setPaymentMethod(tx.paymentMethod);
        if (tx.paymentReference) setPaymentReference(tx.paymentReference);
        if (tx.paymentDate) setPaymentDate(tx.paymentDate);
      })
      .catch(() => {});
  }, [open, request.transactionId, initialStep]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
    toast({ title: 'Copiado', description: `${label} copiado al portapapeles` });
  };

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

  const handleSubmitPayment = async () => {
    if (!paymentMethod) {
      toast(ERROR_TOAST(ERROR_MESSAGES.PAYMENT_METHOD_REQUIRED));
      return;
    }
    if (!paymentReference) {
      toast(ERROR_TOAST(ERROR_MESSAGES.PAYMENT_REFERENCE_REQUIRED));
      return;
    }

    const txId = request.transactionId;
    if (!txId) {
      toast({
        title: 'Sin transacción activa',
        description: 'No se encontró una transacción activa para esta solicitud. Contacta al soporte.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await submitPayment(txId, {
        paymentMethod,
        paymentReference,
        paymentDate,
        paymentProof: files,
      });
      setStep('waiting');
      toast({
        title: 'Pago registrado',
        description: 'Tu comprobante ha sido enviado. El propietario verificará el pago.',
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
      toast({
        title: 'Error al enviar pago',
        description: errMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'completed') {
      onComplete?.();
    }
    // Reset state
    setStep('details');
    setPaymentMethod('');
    setPaymentReference('');
    setFiles([]);
    setLoading(false);
    onOpenChange(false);
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'details', label: 'Detalles' },
      { key: 'payment_info', label: 'Info de Pago' },
      { key: 'submit_proof', label: 'Comprobante' },
      { key: 'waiting', label: 'Verificación' },
      { key: 'completed', label: 'Completado' },
    ];

    const currentIndex = steps.findIndex((s) => s.key === step);

    return (
      <div className="flex items-center justify-between mb-6">
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i <= currentIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < currentIndex ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-[10px] mt-1 ${i <= currentIndex ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 mt-[-12px] ${
                  i < currentIndex ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Step 1: Transaction Details
  const renderDetails = () => (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
              {property?.images?.[0] ? (
                <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{property?.title || 'Propiedad'}</h3>
              <p className="text-sm text-gray-500 truncate">{property?.address || 'Dirección no disponible'}</p>
              <div className="flex items-center gap-2 mt-1">
                <UserIcon className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  Propietario: {property?.author?.name || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-blue-700">Monto a Pagar</span>
          <Badge className="bg-blue-100 text-blue-800 text-lg px-3">
            {formatDualPrice(amount, vesAmount)}
          </Badge>
        </div>
        {request.moveInDate && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-blue-600">Fecha de mudanza</span>
            <span className="text-xs text-blue-800 font-medium">
              {new Date(request.moveInDate).toLocaleDateString('es-VE')}
            </span>
          </div>
        )}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-800 text-sm">Pago Protegido con Escrow</h4>
            <p className="text-xs text-green-700 mt-1">
              Tu pago será retenido en custodia hasta que el propietario confirme la recepción. 
              Si hay algún problema, puedes abrir una disputa y un operador mediará.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-3">¿Cómo funciona?</h4>
        <div className="space-y-2">
          {[
            'Revisa los datos de pago del propietario',
            'Realiza el pago por el método de tu preferencia',
            'Sube el comprobante de pago',
            'El propietario verifica y confirma la recepción',
            '¡La propiedad se asigna a tu nombre!',
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                {i + 1}
              </div>
              <span className="text-xs text-gray-600">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <Button className="w-full" onClick={() => setStep('payment_info')}>
        Continuar al Pago <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );

  // Step 2: Owner Payment Info
  const renderCopyRow = (label: string, value: string | null) => {
    if (!value) return null;
    return (
      <div key={label} className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-sm font-medium">{value}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleCopy(value, label)}
          className="h-8 px-2"
        >
          <Copy className={`h-3 w-3 ${copied === label ? 'text-green-500' : ''}`} />
        </Button>
      </div>
    );
  };

  const renderPaymentInfo = () => {
    if (loadingPaymentInfo) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-gray-500">Cargando datos de pago del propietario...</p>
        </div>
      );
    }

    const hasTransferencia = ownerPaymentInfo?.bankName || ownerPaymentInfo?.bankAccountNumber;
    const hasPagoMovil = ownerPaymentInfo?.bankPhone;

    const renderMethodContent = () => {
      if (!paymentMethod) return null;

      if (['zelle', 'binance', 'efectivo'].includes(paymentMethod)) {
        return (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">Coordina directamente con el propietario</p>
                <p className="text-xs text-orange-700 mt-1">
                  Este método de pago no tiene datos estructurados en el perfil del propietario.
                  Contáctalo a través del chat para coordinar los detalles del pago.
                </p>
              </div>
            </div>
          </div>
        );
      }

      if (paymentMethod === 'transferencia') {
        if (!hasTransferencia) {
          return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 text-center">
                El propietario aún no ha configurado sus datos de transferencia bancaria.
                Selecciona otro método o contáctalo directamente.
              </p>
            </div>
          );
        }
        return (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Banknote className="h-4 w-4 text-blue-600" />
                Transferencia Bancaria
              </h4>
              <Separator />
              {renderCopyRow('Banco', ownerPaymentInfo?.bankName ?? null)}
              {renderCopyRow('Número de cuenta', ownerPaymentInfo?.bankAccountNumber ?? null)}
              {renderCopyRow('Titular', ownerPaymentInfo?.bankAccountHolder ?? null)}
              {renderCopyRow('Tipo de cuenta', ownerPaymentInfo?.bankAccountType ?? null)}
            </CardContent>
          </Card>
        );
      }

      if (paymentMethod === 'pago_movil') {
        if (!hasPagoMovil) {
          return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 text-center">
                El propietario aún no ha configurado sus datos de Pago Móvil.
                Selecciona otro método o contáctalo directamente.
              </p>
            </div>
          );
        }
        return (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-600" />
                Pago Móvil
              </h4>
              <Separator />
              {renderCopyRow('Teléfono', ownerPaymentInfo?.bankPhone ?? null)}
              {renderCopyRow('Cédula asociada', ownerPaymentInfo?.bankPhoneId ?? null)}
              {renderCopyRow('Banco destino', ownerPaymentInfo?.bankPhoneName ?? null)}
            </CardContent>
          </Card>
        );
      }

      return null;
    };

    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <p className="text-xs text-yellow-800">
              Selecciona el método de pago y usa los datos del propietario para realizar la transferencia.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Método de pago</label>
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Métodos Principales</p>
            {PRIMARY_PAYMENT_METHODS.map((m) => {
              const available = m.value === 'transferencia' ? !!hasTransferencia : m.value === 'pago_movil' ? !!hasPagoMovil : true;
              return (
                <button
                  key={m.value}
                  onClick={() => setPaymentMethod(m.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                    paymentMethod === m.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  } ${!available ? 'opacity-50' : ''}`}
                >
                  <span className="text-lg">{m.icon}</span>
                  <span className="text-sm font-medium">{m.label}</span>
                  {!available && <span className="ml-auto text-xs text-gray-400">Sin datos</span>}
                </button>
              );
            })}
            <Separator />
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Otros métodos</p>
            {SECONDARY_PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setPaymentMethod(m.value)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                  paymentMethod === m.value
                    ? 'border-gray-500 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{m.icon}</span>
                <span className="text-sm font-medium text-gray-600">{m.label}</span>
                <span className="ml-auto text-xs text-gray-400">Coordinar directo</span>
              </button>
            ))}
          </div>
        </div>

        {!ownerPaymentInfo && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 text-center">
              El propietario aún no ha configurado sus datos de pago. Contáctalo directamente para coordinar el pago.
            </p>
          </div>
        )}

        {renderMethodContent()}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setStep('details')}>
            Atrás
          </Button>
          <Button className="flex-1" onClick={() => setStep('submit_proof')} disabled={!paymentMethod}>
            Ya pagué, subir comprobante <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  // Step 3: Submit Payment Proof
  const renderSubmitProof = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600">Monto pagado:</p>
        <p className="text-xl font-bold text-blue-600">{formatDualPrice(amount, vesAmount)}</p>
      </div>

      <div className="space-y-2">
        <Label>Método de Pago Utilizado *</Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona método de pago" />
          </SelectTrigger>
          <SelectContent>
            {ALL_PAYMENT_METHODS.map((method) => (
              <SelectItem key={method.value} value={method.value}>
                {method.icon} {method.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference">Número de Referencia *</Label>
        <Input
          id="reference"
          value={paymentReference}
          onChange={(e) => setPaymentReference(e.target.value)}
          placeholder="Ej: 12345678, confirmación de Zelle, etc."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentDate">Fecha del Pago</Label>
        <Input
          id="paymentDate"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
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
            id="p2p-proof-upload"
          />
          <label htmlFor="p2p-proof-upload" className="cursor-pointer text-blue-600 hover:underline text-sm">
            Haz clic para subir archivos
          </label>
          <p className="text-xs text-gray-500 mt-1">Capturas de pantalla, PDF, máximo 5 archivos</p>
        </div>
        {files.length > 0 && (
          <div className="space-y-1 mt-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded text-sm">
                <span className="truncate flex-1">{file.name}</span>
                <button type="button" onClick={() => removeFile(index)} className="ml-2 text-red-500 hover:text-red-700">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
        <p className="text-xs text-yellow-800">
          Al confirmar, tu pago quedará en custodia (escrow) hasta que el propietario verifique la recepción. 
          Si no confirma en 48 horas, puedes abrir una disputa.
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => setStep('payment_info')} disabled={loading}>
          Atrás
        </Button>
        <Button className="flex-1" onClick={handleSubmitPayment} disabled={loading}>
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
    </div>
  );

  // Step 4: Waiting for owner confirmation
  const renderWaiting = () => (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="h-8 w-8 text-purple-600 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold">Esperando Confirmación</h3>
        <p className="text-sm text-gray-500 mt-1">
          Tu comprobante ha sido enviado al propietario.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Estado:</span>
            <Badge className="bg-purple-100 text-purple-800">En Custodia (Escrow)</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Método:</span>
            <span className="font-medium">{ALL_PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Referencia:</span>
            <span className="font-medium">{paymentReference}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Monto:</span>
            <span className="font-bold text-blue-600">{formatDualPrice(amount, vesAmount)}</span>
          </div>
          {files.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Comprobantes:</span>
              <span className="font-medium flex items-center gap-1">
                <ImageIcon className="h-3 w-3" /> {files.length} archivo(s)
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          El propietario tiene 48 horas para verificar y confirmar tu pago. 
          Recibirás una notificación cuando lo haga.
        </p>
      </div>

      <Button variant="outline" className="w-full" onClick={inline ? onBack : handleClose}>
        {inline ? 'Volver a solicitudes' : 'Cerrar y esperar'}
      </Button>
    </div>
  );

  // Step 5: Completed
  const renderCompleted = () => (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <PartyPopper className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-green-800">¡Transacción Completada!</h3>
        <p className="text-sm text-gray-500 mt-2">
          El pago ha sido confirmado y la propiedad ha sido asignada a tu nombre.
        </p>
      </div>

      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-green-700">Propiedad:</span>
            <span className="font-semibold text-green-900">{property?.title}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-green-700">Monto Pagado:</span>
            <span className="font-bold text-green-900">{formatDualPrice(amount, vesAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-green-700">Estado:</span>
            <Badge className="bg-green-200 text-green-800">Completada</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-green-700">Fecha:</span>
            <span className="font-medium text-green-900">{new Date().toLocaleDateString('es-VE')}</span>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          Puedes ver el detalle completo de esta transacción en la sección "Transacciones" de tu panel.
        </p>
      </div>

      <Button className="w-full" onClick={inline ? onBack : handleClose}>
        {inline ? 'Volver a solicitudes' : 'Cerrar'}
      </Button>
    </div>
  );

  const renderContent = () => {
    switch (step) {
      case 'details': return renderDetails();
      case 'payment_info': return renderPaymentInfo();
      case 'submit_proof': return renderSubmitProof();
      case 'waiting': return renderWaiting();
      case 'completed': return renderCompleted();
      default: return null;
    }
  };

  const content = (
    <>
      <div className="flex items-center gap-2 mb-4">
        {inline && onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-1">
            ← Volver
          </Button>
        )}
        <CreditCard className="h-5 w-5 text-blue-600" />
        <span className="font-semibold text-lg">Pago P2P — Escrow Seguro</span>
      </div>
      {renderStepIndicator()}
      {renderContent()}
    </>
  );

  if (inline) {
    return <div className="space-y-4">{content}</div>;
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Pago P2P — Escrow Seguro
          </DialogTitle>
        </DialogHeader>

        {renderStepIndicator()}
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default P2PPaymentFlow;
