import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToastNotification } from "@/contexts/ToastNotificationContext";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/contexts/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";

const DEMO_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: "admin", label: "Administrador", description: "Gestión completa de la plataforma" },
  { value: "operator", label: "Operador", description: "Moderación, verificaciones y soporte" },
  { value: "propietario", label: "Propietario", description: "Publica y gestiona tus propiedades" },
  { value: "cliente", label: "Cliente", description: "Busca y solicita arrendamientos" },
  { value: "estudiante", label: "Estudiante", description: "Encuentra tu lugar ideal para estudiar" },
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showError } = useToastNotification();
  const { getRedirectPath, isAuthenticated, loginAsDemo } = useAuth();
  const [selectedDemoRole, setSelectedDemoRole] = useState<UserRole>("cliente");
  const [isEntering, setIsEntering] = useState(false);

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

  const handleDemoLogin = () => {
    try {
      setIsEntering(true);
      loginAsDemo(selectedDemoRole);
      // Navigation is handled by the isAuthenticated effect above
    } catch {
      showError("Error", "No se pudo iniciar el modo demo");
      setIsEntering(false);
    }
  };

  return (
    <AuthLayout
      infoPosition="left"
      infoBadge="Modo demostración"
      infoHeading="Explora Ohana"
      infoDescription="Navega por la plataforma con datos de ejemplo. Sin conexión al backend."
    >
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-2 group mb-6 lg:hidden">
          <Logo markClassName="h-5 w-5" wordmarkClassName="text-lg font-bold text-gray-900" />
          <ArrowLeft className="h-3 w-3 text-gray-400 group-hover:text-primary transition-colors" />
          <span className="text-[11px] text-gray-400 font-normal group-hover:text-primary transition-colors">Da click aqui para ir al inicio</span>
        </Link>

        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Selecciona un rol</h2>
          <p className="text-gray-500 text-sm mt-1">Entra a la plataforma como uno de estos perfiles</p>
        </div>

        <div className="space-y-2">
          {DEMO_ROLES.map((r) => (
            <label
              key={r.value}
              className={`flex items-start gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                selectedDemoRole === r.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="demoRole"
                value={r.value}
                checked={selectedDemoRole === r.value}
                onChange={() => setSelectedDemoRole(r.value)}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <div className="flex-1">
                <p className={`text-sm font-semibold ${selectedDemoRole === r.value ? "text-primary" : "text-gray-900"}`}>
                  {r.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
              </div>
            </label>
          ))}
        </div>

        <Button
          type="button"
          onClick={handleDemoLogin}
          disabled={isEntering}
          className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-sm transition-all duration-200 mt-5"
        >
          {isEntering ? (
            <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {isEntering ? "Entrando..." : "Entrar en modo demo"}
        </Button>

        <p className="text-[11px] text-center text-gray-400 mt-4 leading-relaxed">
          Modo demostración con datos ficticios. Ninguna acción se guarda ni se envía al servidor.
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
