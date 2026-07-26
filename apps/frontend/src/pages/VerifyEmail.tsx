import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToastNotification } from "@/contexts/ToastNotificationContext";
import { Loader2, Mail, KeyRound, CheckCircle, RefreshCw, LogOut } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToastNotification();
  const { setUser, setToken, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);

  const email = searchParams.get("email") || "";
  const name = searchParams.get("name") || "";
  const redirectPath = searchParams.get("redirect") || "/login";

  useEffect(() => {
    if (!email) {
      navigate("/registro");
    }
  }, [email, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      showError("Ingresa el código de 6 dígitos");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.verifyEmailCode(email, code);
      if (res.success) {
        showSuccess("Correo electrónico verificado exitosamente");

        // The backend now returns a JWT + user after email verification
        if (res.data?.token && res.data?.user) {
          api.setToken(res.data.token);
          setUser(res.data.user);
          setToken(res.data.token);
        }

        setVerified(true);
        setTimeout(() => navigate(redirectPath), 2500);
      } else {
        showError(res.error?.message || "Código inválido o expirado");
      }
    } catch {
      showError("Error de conexión. Intenta más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      const res = await api.sendVerificationCode(email, name);
      if (res.success) {
        showSuccess("Código reenviado a tu correo electrónico");
      } else {
        showError(res.error?.message || "Error al reenviar el código");
      }
    } catch {
      showError("Error de conexión");
    } finally {
      setIsResending(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
        <Card className="w-full max-w-md shadow-xl border-0 text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">¡Correo verificado!</CardTitle>
            <CardDescription>Tu correo ha sido verificado exitosamente. Redirigiendo...</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate(redirectPath)}>
              Continuar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Verifica tu correo</CardTitle>
          <CardDescription>
            Hemos enviado un código de verificación a <strong>{email}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de verificación</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="pl-10 text-center text-lg tracking-widest font-mono"
                  maxLength={6}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">El código expira en 30 minutos</p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verificar correo
            </Button>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResendCode}
                disabled={isResending}
                className="text-sm"
              >
                {isResending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                Reenviar código
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { logout(); navigate('/login'); }}
                className="text-xs text-muted-foreground"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Cerrar sesión
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
