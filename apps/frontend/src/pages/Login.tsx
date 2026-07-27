import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToastNotification } from "@/contexts/ToastNotificationContext";
import { Loader2, Eye, EyeOff, LogIn, ArrowLeft, Sparkles, ChevronDown } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/contexts/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";

const DEMO_ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "operator", label: "Operador" },
  { value: "propietario", label: "Propietario" },
  { value: "cliente", label: "Cliente" },
  { value: "estudiante", label: "Estudiante" },
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showError } = useToastNotification();
  const { login, getRedirectPath, isAuthenticated, googleLogin, loginAsDemo } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showDemoSelector, setShowDemoSelector] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState<UserRole>("cliente");

  const redirectTargetRef = useRef<string | null>(null);

  useEffect(() => {
    const state = location.state as { from?: { pathname: string }; redirectAfterLogin?: string } | null;
    redirectTargetRef.current = state?.redirectAfterLogin || state?.from?.pathname || null;
  }, [location]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTargetRef.current || getRedirectPath(), { replace: true });
    }
  }, [isAuthenticated, navigate, getRedirectPath]);

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Ingresa un correo valido";
    if (formData.password.length < 6) e.password = "Mínimo 6 caracteres";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (!result.success) {
        setGeneralError("");
        if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
          setFieldErrors(result.fieldErrors);
        }
        if (result.errorCode === 'USE_GOOGLE_AUTH') {
          setFieldErrors({ password: result.error || 'Configura una contraseña en tu perfil' });
        } else if (result.error) {
          setGeneralError(result.error);
        }
        setIsLoading(false);
      }
    } catch {
      showError("Error de conexión", "No se pudo conectar con el servidor");
      setIsLoading(false);
    }
  };

  const handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = ev.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((p) => { const n = { ...p }; delete n[name]; return n; });
    if (generalError) setGeneralError("");
  };

  const handleDemoLogin = () => {
    loginAsDemo(selectedDemoRole);
    // Navigation is handled by the isAuthenticated effect below
  };

  const inputCls = "h-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 rounded-lg";
  const lblCls = "text-gray-700 text-sm font-medium";

  return (
    <AuthLayout
      infoPosition="left"
      infoBadge="Bienvenido de nuevo"
      infoHeading="Inicia sesion en Ohana"
      infoDescription="Accede a tu cuenta y continua gestionando tus propiedades."
    >
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-2 group mb-6 lg:hidden">
          <Logo markClassName="h-5 w-5" wordmarkClassName="text-lg font-bold text-gray-900" />
          <ArrowLeft className="h-3 w-3 text-gray-400 group-hover:text-primary transition-colors" />
          <span className="text-[11px] text-gray-400 font-normal group-hover:text-primary transition-colors">Da click aqui para ir al inicio</span>
        </Link>

        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Iniciar sesion</h2>
          <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          {generalError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {generalError}
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="email" className={lblCls}>Email</Label>
            <Input id="email" name="email" type="email" placeholder="correo@ejemplo.com"
              value={formData.email} onChange={handleChange} required disabled={isLoading} className={inputCls} />
            {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email}</p>}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className={lblCls}>Contrasena</Label>
              <Link to="/recuperar-password" className="text-xs text-primary hover:text-primary/80 transition-colors">Olvidaste?</Link>
            </div>
            <div className="relative">
              <Input id="password" name="password" placeholder="........"
                type={showPassword ? "text" : "password"} value={formData.password}
                onChange={handleChange} required disabled={isLoading} className={`${inputCls} pr-10`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && <p className="text-xs text-red-500">{fieldErrors.password}</p>}
          </div>

          <Button type="submit" disabled={isLoading}
            className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-sm transition-all duration-200">
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
            {isLoading ? "Iniciando..." : "Iniciar sesion"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">o</span></div>
          </div>

          <Button type="button" disabled={isLoading} onClick={googleLogin}
            className="w-full h-10 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium rounded-lg transition-all duration-200">
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </Button>

          <p className="text-xs text-center text-gray-500">
            No tienes cuenta?{" "}
            <Link to="/registro" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2 transition-colors">Registrate aqui</Link>
          </p>

          <div className="pt-3 mt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowDemoSelector((v) => !v)}
              className="w-full flex items-center justify-center gap-2 text-xs text-amber-700 hover:text-amber-800 font-medium transition-colors py-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Probar en modo demo
              <ChevronDown className={`h-3 w-3 transition-transform ${showDemoSelector ? "rotate-180" : ""}`} />
            </button>

            {showDemoSelector && (
              <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-2.5">
                <p className="text-[11px] text-amber-800 text-center leading-relaxed">
                  Explora la app con datos de demostracion. No se conecta al backend.
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {DEMO_ROLES.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                        selectedDemoRole === r.value
                          ? "bg-amber-200/70 text-amber-900 font-semibold"
                          : "bg-white/60 text-amber-800 hover:bg-amber-100/70"
                      }`}
                    >
                      <input
                        type="radio"
                        name="demoRole"
                        value={r.value}
                        checked={selectedDemoRole === r.value}
                        onChange={() => setSelectedDemoRole(r.value)}
                        className="h-3 w-3 accent-amber-600"
                      />
                      {r.label}
                    </label>
                  ))}
                </div>
                <Button
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full h-9 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Entrar en modo demo
                </Button>
              </div>
            )}
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;
