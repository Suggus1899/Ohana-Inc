import { useState, useEffect, memo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Bell, Shield, CreditCard, Loader2, Save, Lock, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { useDriver } from "@/hooks/useDriver";
import { getTutorialSteps, onMobileHighlightStarted } from "@/config/tutorialSteps";
import { clientSidebarItems, ownerSidebarItems } from "@/config/sidebarConfig";
import { fireCelebration } from "@/utils/confetti";

const SettingsSection = () => {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Payment info state (propietarios only)
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankAccountType, setBankAccountType] = useState('');
  const [bankPhone, setBankPhone] = useState('');
  const [bankPhoneId, setBankPhoneId] = useState('');
  const [bankPhoneName, setBankPhoneName] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Load user data and preferences
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setDateOfBirth(user.dateOfBirth || '');
      setGender(user.gender || '');
      // Load preferences if available
      if (user.preferences) {
        setEmailNotifications(user.preferences.emailNotifications ?? true);
        setWhatsappNotifications(user.preferences.whatsappNotifications ?? false);
      }
    }
  }, [user]);

  // Load payment info for propietarios
  useEffect(() => {
    if (user?.role !== 'propietario' || !user?.id) return;
    setLoadingPayment(true);
    api.getUserPaymentInfo(user.id)
      .then((res) => {
        const info = res.data?.paymentInfo;
        if (info) {
          setBankName(info.bankName || '');
          setBankAccountNumber(info.bankAccountNumber || '');
          setBankAccountHolder(info.bankAccountHolder || '');
          setBankAccountType(info.bankAccountType || '');
          setBankPhone(info.bankPhone || '');
          setBankPhoneId(info.bankPhoneId || '');
          setBankPhoneName(info.bankPhoneName || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPayment(false));
  }, [user?.id, user?.role]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await api.updateProfile({ name, phone, dateOfBirth: dateOfBirth || undefined, gender: gender || undefined });
      setUser?.({ ...user!, name: res.user.name, phone: res.user.phone, dateOfBirth: res.user.dateOfBirth, gender: res.user.gender });
      toast({ title: 'Perfil actualizado', description: 'Tus datos personales se guardaron correctamente.' });
    } catch {
      toast({ title: 'Error', description: 'Error de conexión al guardar datos.', variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const hasPassword = user?.hasPassword === true;

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast({ title: 'Error', description: 'La nueva contraseña debe tener al menos 8 caracteres.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Las contraseñas no coinciden.', variant: 'destructive' });
      return;
    }

    setSavingPassword(true);
    try {
      const payload: { currentPassword?: string; newPassword: string } = { newPassword };
      if (hasPassword) {
        if (!currentPassword) {
          toast({ title: 'Error', description: 'Debes ingresar tu contraseña actual.', variant: 'destructive' });
          setSavingPassword(false);
          return;
        }
        payload.currentPassword = currentPassword;
      }
      await api.changePassword(payload);
      toast({ title: hasPassword ? 'Contraseña actualizada' : 'Contraseña configurada', description: hasPassword ? 'Tu contraseña se cambió correctamente.' : 'Tu contraseña se configuró correctamente.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Refresh user to update hasPassword flag
      const userRes = await api.getCurrentUser();
      if (userRes.success && userRes.data) {
        setUser(userRes.data.user);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión.';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    try {
      const res = await api.updatePreferences({ emailNotifications, whatsappNotifications });
      if (res.success) {
        toast({ title: 'Preferencias guardadas', description: 'Tus preferencias de notificación se actualizaron.' });
      } else {
        toast({ title: 'Error', description: 'No se pudieron guardar las preferencias.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Error de conexión al guardar preferencias.', variant: 'destructive' });
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleSavePaymentInfo = async () => {
    setSavingPayment(true);
    try {
      const res = await api.updateMyPaymentInfo({
        bankName: bankName || null,
        bankAccountNumber: bankAccountNumber || null,
        bankAccountHolder: bankAccountHolder || null,
        bankAccountType: bankAccountType || null,
        bankPhone: bankPhone || null,
        bankPhoneId: bankPhoneId || null,
        bankPhoneName: bankPhoneName || null,
      });
      if (res.success) {
        toast({ title: 'Datos guardados', description: 'Tus datos de pago se actualizaron correctamente.' });
      } else {
        toast({ title: 'Error', description: 'No se pudieron guardar los datos.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Error de conexión al guardar datos.', variant: 'destructive' });
    } finally {
      setSavingPayment(false);
    }
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const isPropietario = user?.role === 'propietario';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Administra tu cuenta y preferencias
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Seguridad</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificaciones</span>
          </TabsTrigger>
          {isPropietario && (
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Pagos</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Datos Personales</CardTitle>
              </div>
              <CardDescription>
                Edita tu información personal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Tu teléfono"
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Fecha de nacimiento</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Género</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="femenino">Femenino</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                      <SelectItem value="prefiero-no-decir">Prefiero no decirlo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleSaveProfile} 
                disabled={savingProfile}
                className="w-full sm:w-auto"
              >
                {savingProfile ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar Cambios
              </Button>

              <Separator className="my-4" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Tutorial</h4>
                <p className="text-sm text-muted-foreground">
                  Vuelve a ver el tutorial introductorio de la plataforma
                </p>
                <Button
                  variant="outline"
                  onClick={handleRestartTutorial}
                  className="w-full sm:w-auto"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reiniciar tutorial
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <CardTitle>{hasPassword ? 'Cambiar Contraseña' : 'Configurar Contraseña'}</CardTitle>
              </div>
              <CardDescription>
                {hasPassword ? 'Actualiza tu contraseña de acceso' : 'Establece una contraseña para tu cuenta'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {hasPassword && (
                  <div>
                    <Label htmlFor="currentPassword">Contraseña actual</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                  />
                </div>
              </div>

              <Button 
                onClick={handleChangePassword} 
                disabled={savingPassword || !newPassword || !confirmPassword || (hasPassword && !currentPassword)}
                className="w-full sm:w-auto"
              >
                {savingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                {hasPassword ? 'Actualizar Contraseña' : 'Configurar Contraseña'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle>Preferencias de Notificación</CardTitle>
              </div>
              <CardDescription>
                Elige cómo quieres recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notif">Notificaciones por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe actualizaciones sobre tus solicitudes y pagos
                  </p>
                </div>
                <Switch
                  id="email-notif"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="whatsapp-notif">Notificaciones por WhatsApp</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe mensajes de alerta en tu teléfono
                  </p>
                </div>
                <Switch
                  id="whatsapp-notif"
                  checked={whatsappNotifications}
                  onCheckedChange={setWhatsappNotifications}
                />
              </div>

              <Button 
                onClick={handleSavePreferences} 
                disabled={savingPreferences}
                className="w-full sm:w-auto"
              >
                {savingPreferences ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar Preferencias
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab (Propietarios only) */}
        {isPropietario && (
          <TabsContent value="payments" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2"><CreditCard className="h-5 w-5" /><CardTitle>Datos de Pago</CardTitle></div>
                <CardDescription>Configura tus datos bancarios para recibir pagos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingPayment ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
                ) : (
                  <>
                    <div>
                      <h4 className="font-medium text-sm mb-3">PSE (Datos bancarios)</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="bankName">Banco</Label><Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bancolombia" /></div>
                        <div className="space-y-2"><Label htmlFor="bankAccountNumber">Número de cuenta</Label><Input id="bankAccountNumber" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="000-000000-00" /></div>
                        <div className="space-y-2"><Label htmlFor="bankAccountHolder">Titular de la cuenta</Label><Input id="bankAccountHolder" value={bankAccountHolder} onChange={(e) => setBankAccountHolder(e.target.value)} placeholder="Nombre del titular" /></div>
                        <div className="space-y-2"><Label htmlFor="bankAccountType">Tipo de cuenta</Label><Select value={bankAccountType} onValueChange={setBankAccountType}><SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger><SelectContent><SelectItem value="corriente">Corriente</SelectItem><SelectItem value="ahorro">Ahorro</SelectItem></SelectContent></Select></div>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-sm mb-3">Nequi / Daviplata</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="bankPhone">Teléfono</Label><Input id="bankPhone" value={bankPhone} onChange={(e) => setBankPhone(e.target.value)} placeholder="300-1234567" /></div>
                        <div className="space-y-2"><Label htmlFor="bankPhoneId">Cédula asociada</Label><Input id="bankPhoneId" value={bankPhoneId} onChange={(e) => setBankPhoneId(e.target.value)} placeholder="CC-12345678" /></div>
                        <div className="space-y-2"><Label htmlFor="bankPhoneName">Nombre</Label><Input id="bankPhoneName" value={bankPhoneName} onChange={(e) => setBankPhoneName(e.target.value)} placeholder="Nombre del titular" /></div>
                      </div>
                    </div>
                    <Button onClick={handleSavePaymentInfo} disabled={savingPayment}>
                      {savingPayment ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar Datos de Pago'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default memo(SettingsSection);
