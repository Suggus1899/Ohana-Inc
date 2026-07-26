import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToastNotification } from "@/contexts/ToastNotificationContext";
import { Loader2, Building, ArrowLeft, CheckCircle, Mail, KeyRound, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import { api } from "@/services/api";

type Step = "email" | "code" | "newPassword" | "success";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastNotification();
  const [step, setStep] = useState<Step>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [generalError, setGeneralError] = useState("");

  const inputCls = "h-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 rounded-lg";
  const lblCls = "text-gray-700 text-sm font-medium";

  const clearError = () => { if (generalError) setGeneralError(""); };

  const handleRequestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setGeneralError("");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setGeneralError("Ingresa un correo electrónico válido");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.requestPasswordReset(email);
      if (res.success) {
        const msg = res.data?.message || `Código enviado a ${email}`;
        showSuccess(msg);
        setStep("code");
      } else {
        setGeneralError(res.error?.message || "Error al enviar el código");
      }
    } catch {
      setGeneralError("Error de conexión. Verifica tu internet e intenta más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    if (!code || code.length !== 6) {
      setGeneralError("Ingresa el código de 6 dígitos");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.verifyResetCode(email, code);
      if (res.success) {
        setStep("newPassword");
      } else {
        setGeneralError(res.error?.message || "Código inválido o expirado");
      }
    } catch {
      setGeneralError("Error de conexión. Intenta más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    if (newPassword.length < 6) {
      setGeneralError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setGeneralError("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.resetPassword(email, code, newPassword);
      if (res.success) {
        showSuccess("Contraseña restablecida exitosamente");
        setStep("success");
      } else {
        setGeneralError(res.error?.message || "Error al restablecer la contraseña");
      }
    } catch {
      setGeneralError("Error de conexión. Intenta más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const heading = step === "email" ? "Recuperar contraseña"
    : step === "code" ? "Verificar código"
    : step === "newPassword" ? "Nueva contraseña"
    : "¡Listo!";

  const description = step === "email"
    ? "Ingresa tu correo electrónico y te enviaremos un código de verificación"
    : step === "code"
    ? `Ingresa el código de 6 dígitos enviado a ${email}`
    : step === "newPassword"
    ? "Ingresa tu nueva contraseña"
    : "Tu contraseña ha sido restablecida exitosamente";

  const infoBadge = step === "success" ? "Contraseña actualizada" : "Seguridad";

  return (
    <AuthLayout
      infoPosition="left"
      infoBadge={infoBadge}
      infoHeading="Recuperar acceso"
      infoDescription=""
    >
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 group mb-6 lg:hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Building className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-bold text-gray-900">Habitas</span>
        </Link>

        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight text-center">{heading}</h2>
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center my-3">
            {step === "success" ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <ShieldCheck className="h-6 w-6 text-primary" />
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1 text-center">{description}</p>
        </div>

        {step === "email" && (
          <form onSubmit={handleRequestCode} className="space-y-3">
            {generalError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{generalError}</div>}
            <div className="space-y-1">
              <Label htmlFor="email" className={lblCls}>Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="email" type="email" placeholder="tu@correo.com"
                  value={email} onChange={e => { setEmail(e.target.value); clearError(); }}
                  disabled={isLoading} className={`${inputCls} pl-10`} />
              </div>
            </div>
            <Button type="submit" className="w-full h-10" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enviar código
            </Button>
            <p className="text-xs text-center text-gray-500">
              <Link to="/login" className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Volver al inicio de sesión
              </Link>
            </p>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifyCode} className="space-y-3">
            {generalError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{generalError}</div>}
            <div className="space-y-1">
              <Label htmlFor="code" className={lblCls}>Código de verificación</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="code" type="text" placeholder="000000"
                  value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); clearError(); }}
                  className={`${inputCls} pl-10 text-center text-lg tracking-widest font-mono`}
                  maxLength={6} disabled={isLoading} />
              </div>
              <p className="text-xs text-gray-400">El código expira en 30 minutos</p>
            </div>
            <Button type="submit" className="w-full h-10" disabled={isLoading || code.length !== 6}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verificar código
            </Button>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setStep("email")} disabled={isLoading}
                className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 transition-colors inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Cambiar correo
              </button>
              <button type="button" onClick={() => handleRequestCode()} disabled={isLoading}
                className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
                Reenviar código
              </button>
            </div>
          </form>
        )}

        {step === "newPassword" && (
          <form onSubmit={handleResetPassword} className="space-y-3">
            {generalError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{generalError}</div>}
            <div className="space-y-1">
              <Label htmlFor="newPassword" className={lblCls}>Nueva contraseña</Label>
              <Input id="newPassword" type="password" placeholder="Mínimo 6 caracteres"
                value={newPassword} onChange={e => { setNewPassword(e.target.value); clearError(); }}
                disabled={isLoading} className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className={lblCls}>Confirmar contraseña</Label>
              <Input id="confirmPassword" type="password" placeholder="Repite la contraseña"
                value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); clearError(); }}
                disabled={isLoading} className={inputCls} />
            </div>
            <Button type="submit" className="w-full h-10" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Restablecer contraseña
            </Button>
          </form>
        )}

        {step === "success" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-500">
              Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <Button className="w-full h-10" onClick={() => navigate("/login")}>
              Ir a iniciar sesión
            </Button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;