import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, MessageCircle, Send, Loader2, HelpCircle, AlertTriangle, Building, CreditCard, UserCheck, Shield, Phone, Mail, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useChat } from '@/hooks/useChat';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useDriver } from '@/hooks/useDriver';
import { getTutorialSteps, onMobileHighlightStarted } from '@/config/tutorialSteps';
import { clientSidebarItems, ownerSidebarItems } from '@/config/sidebarConfig';
import { fireCelebration } from '@/utils/confetti';

interface FAQItem {
  question: string;
  answer: string;
  icon: typeof HelpCircle;
}

const FAQS: FAQItem[] = [
  {
    question: 'Como buscar una residencia?',
    answer: 'Usa el buscador en la seccion de Inicio. Puedes filtrar por precio, ubicacion y servicios. Las propiedades con habitaciones disponibles aparecen primero.',
    icon: Building,
  },
  {
    question: 'Como solicitar alquiler de una habitacion?',
    answer: 'Haz clic en "Ver mas" en la propiedad que te interese, luego presiona "Solicitar Alquiler". El propietario revisara tu solicitud y la aceptara o rechazara.',
    icon: Send,
  },
  {
    question: 'Como se realiza el pago?',
    answer: 'Cuando el propietario acepte tu solicitud, se generara una transaccion. Debes subir el comprobante de pago y el propietario lo confirmara para completar el proceso.',
    icon: CreditCard,
  },
  {
    question: 'Que es la verificacion KYC?',
    answer: 'Es un proceso de verificacion de identidad necesario para poder solicitar alquileres. Debes subir tu documento de identidad y comprobante de domicilio en la seccion "Verificacion".',
    icon: UserCheck,
  },
  {
    question: 'Es seguro el proceso de pago?',
    answer: 'Si. Los pagos pasan por un sistema de escrow (deposito en garantia) que retiene el dinero hasta que el propietario confirme la recepcion, protegiendo a ambas partes.',
    icon: Shield,
  },
  {
    question: 'Como contactar al propietario?',
    answer: 'Puedes usar el chat integrado desde la seccion "Mensajes" o directamente desde la pagina de detalle de la propiedad presionando "Comunicarse con Propietario".',
    icon: MessageCircle,
  },
];

const CATEGORIES = [
  { value: 'technical', label: 'Fallo tecnico / Error en la plataforma' },
  { value: 'property', label: 'Problema con una propiedad' },
  { value: 'billing', label: 'Problema de pago / Facturacion' },
  { value: 'account', label: 'Problema con mi cuenta' },
  { value: 'other', label: 'Otro' },
];

export default function HelpSection() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [findingOperator, setFindingOperator] = useState(false);
  const { toast } = useToast();
  const { startDirectConversation } = useChat();
  const navigate = useNavigate();
  const { user, updateUser: _updateUser } = useAuth();
  const isPropietario = user?.role === 'propietario';

  const [formData, setFormData] = useState({
    subject: '',
    category: 'technical',
    description: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      toast({ title: 'Campos requeridos', description: 'Completa todos los campos del formulario', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const res = await api.createTicket({
        subject: formData.subject,
        category: formData.category,
        description: formData.description,
      });
      if (res.success) {
        toast({ title: 'Reporte enviado', description: 'Tu reporte ha sido registrado. Te contactaremos pronto.' });
        setFormData({ subject: '', category: 'technical', description: '' });
        setShowForm(false);
      } else {
        toast({ title: 'Error', description: res.error?.message || 'No se pudo enviar el reporte', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo enviar el reporte', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleContactSupport = async () => {
    setFindingOperator(true);
    try {
      const res = await api.getAvailableOperators();
      if (!res.success || !res.data || res.data.operators.length === 0) {
        toast({ title: 'Sin operadores', description: 'No hay operadores disponibles en este momento. Intenta mas tarde.', variant: 'destructive' });
        return;
      }

      const online = res.data.operators.filter(op => res.data!.onlineIds.includes(op.id));
      const pool = online.length > 0 ? online : res.data.operators;
      const randomOp = pool[Math.floor(Math.random() * pool.length)];

      const conv = await startDirectConversation(randomOp.id);
      if (conv) {
        toast({ title: 'Conectando con soporte', description: `Conversacion iniciada con ${randomOp.name}` });
        const role = user?.role;
        const dashboardPath = role === 'propietario' ? '/propietario' : role === 'admin' ? '/admin' : role === 'operator' ? '/operator' : role === 'estudiante' ? '/estudiante' : '/cliente';
        navigate(dashboardPath, { state: { activeSection: 'messages', conversationId: conv.id } });
      } else {
        toast({ title: 'Error', description: 'No se pudo iniciar la conversacion', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Error al conectar con soporte', variant: 'destructive' });
    } finally {
      setFindingOperator(false);
    }
  };

  const items = isPropietario ? ownerSidebarItems : clientSidebarItems;
  const celebrationRef = useRef(false);

  const handleTutorialDone = async () => {
    setUser((prev) => prev ? { ...prev, tutorialCompleted: true } : prev);
    try {
      await api.markTutorialCompleted();
      if (!celebrationRef.current) {
        celebrationRef.current = true;
        fireCelebration();
      }
    } catch (err) {
      console.error('Error al marcar tutorial completado:', err);
    }
  };

  const handleTutorialSkip = async () => {
    setUser((prev) => prev ? { ...prev, tutorialCompleted: true } : prev);
    try {
      await api.markTutorialCompleted();
    } catch (err) {
      console.error('Error al marcar tutorial completado:', err);
    }
  };

  const steps = getTutorialSteps(user?.name || '', items, user?.role);
  const { startTutorial } = useDriver(steps, {
    onDone: handleTutorialDone,
    onSkip: handleTutorialSkip,
    onHighlightStarted: onMobileHighlightStarted,
  });

  const handleRestartTutorial = () => {
    celebrationRef.current = false;
    startTutorial();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Centro de Ayuda</h1>
        <p className="text-sm text-gray-500 mt-1">Resuelve tus dudas, reporta incidentes o contacta a soporte</p>
      </div>

      {/* FAQ Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Preguntas Frecuentes
        </h2>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          {FAQS.map((faq, i) => {
            const Icon = faq.icon;
            const isOpen = expandedFaq === i;
            return (
              <div key={i} className="w-full sm:w-[calc(50%-6px)]">
                <Card
                  className={`cursor-pointer transition-all duration-200 ${
                    isOpen ? 'ring-2 ring-primary/20 border-primary/20' : 'hover:border-gray-300'
                  }`}
                  onClick={() => setExpandedFaq(isOpen ? null : i)}
                >
                  <CardHeader className={`${isOpen ? 'pb-3' : 'pb-4'}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-semibold text-gray-900">{faq.question}</CardTitle>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-400 mt-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </CardHeader>
                  {isOpen && (
                    <CardContent className="pt-0 pb-4">
                      <p className="text-sm text-gray-600 leading-relaxed pl-12">{faq.answer}</p>
                    </CardContent>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact Support Button */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary shrink-0">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">¿Necesitas ayuda personalizada?</h3>
            <p className="text-sm text-gray-500 mt-0.5">Chatea en tiempo real con un operador de soporte</p>
          </div>
          <Button onClick={handleContactSupport} disabled={findingOperator} className="gap-2 shrink-0">
            {findingOperator ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
            {findingOperator ? 'Buscando operador...' : 'Comunicarse con Soporte Tecnico'}
          </Button>
        </CardContent>
      </Card>

      {/* Report Incident Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Reportar un problema
          </h2>
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : 'Nuevo reporte'}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria del problema</Label>
                  <Select value={formData.category} onValueChange={(v) => handleInputChange('category', v)}>
                    <SelectTrigger id="category"><SelectValue placeholder="Seleccionar categoria" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Asunto</Label>
                  <Input
                    id="subject"
                    placeholder="Describe brevemente el problema"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripcion detallada</Label>
                  <Textarea
                    id="description"
                    placeholder="Explica el problema con el mayor detalle posible para que podamos ayudarte"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button type="submit" disabled={sending} className="gap-2">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {sending ? 'Enviando...' : 'Enviar reporte'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Contact Info */}
      <div className="py-6 border-t">
        <p className="text-sm text-gray-500 mb-4 text-center">Tambien puedes contactarnos directamente</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="mailto:soporte@Ohanaweb.me" className="flex items-center gap-2 text-sm text-primary hover:underline">
            <Mail className="h-4 w-4" /> soporte@Ohanaweb.me
          </a>
          <a href="tel:+573001234567" className="flex items-center gap-2 text-sm text-primary hover:underline">
            <Phone className="h-4 w-4" /> +57 300-123-4567
          </a>
        </div>
      </div>

      {/* Restart Tutorial */}
      <div className="pb-8 text-center">
        <Button
          variant="outline"
          onClick={handleRestartTutorial}
          className="gap-2 w-full sm:w-auto"
        >
          <RotateCcw className="h-4 w-4" />
          Volver a ver tutorial
        </Button>
        <p className="text-xs text-gray-400 mt-2">
          Repasa el tutorial introductorio de la plataforma
        </p>
      </div>
    </div>
  );
}