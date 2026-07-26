import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToastNotification } from "@/contexts/ToastNotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, UserPlus } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/services/api";

const GoogleSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showError, showSuccess } = useToastNotification();
  const { setUser, setToken: setAuthToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const tempToken = searchParams.get("tempToken") || "";
  const googleName = searchParams.get("name") || "";
  const googleEmail = searchParams.get("email") || "";
  const googlePhoto = searchParams.get("photo") || "";

  // Redirigir a login si no hay tempToken o si ya expiró (detectado al cargar)
  useEffect(() => {
    if (!tempToken) {
      showError("Enlace de registro inválido. Inicia sesión con Google nuevamente.");
      navigate("/login", { replace: true });
    }
  }, [tempToken, navigate, showError]);

  const [role, setRole] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+58");
  const [phone, setPhone] = useState("");
  const [cedulaType, setCedulaType] = useState("V");
  const [cedula, setCedula] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [photoError, setPhotoError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const getInitials = (name: string) => {
    return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!role) errors.role = "Debes seleccionar un tipo de cuenta";
    if (!phone) errors.phone = "Debes ingresar un teléfono";
    if (!cedula) errors.cedula = "Debes ingresar tu cédula";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.completeGoogleRegistration(tempToken, {
        role,
        phonePrefix,
        phone,
        cedulaType,
        cedula,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
      });

      api.setToken(data.token);
      setAuthToken(data.token);
      setUser(data.user);
      showSuccess("Registro completado correctamente");

      const paths: Record<string, string> = {
        admin: "/admin",
        operator: "/operator",
        propietario: "/propietario",
        cliente: "/cliente",
        estudiante: "/estudiante",
      };
      navigate(paths[data.user.role] || "/cliente", { replace: true });
    } catch (err: any) {
      const msg = err?.message || "Error al completar el registro";

      // Si el tempToken expiró o la sesión no es válida, redirigir a login
      if (msg.includes('expirado') || msg.includes('expired') || msg.includes('No autorizado') || msg.includes('autorizado') || msg.includes('Sesión')) {
        showError("Tu enlace de registro expiró. Inicia sesión con Google nuevamente.");
        setTimeout(() => navigate("/login", { replace: true }), 1500);
        return;
      }

      showError(msg);
      if (msg.toLowerCase().includes("cédula") || msg.toLowerCase().includes("cedula")) {
        setFieldErrors({ cedula: msg });
      } else if (msg.toLowerCase().includes("rol") || msg.toLowerCase().includes("role")) {
        setFieldErrors({ role: msg });
      } else if (msg.toLowerCase().includes("teléfono") || msg.toLowerCase().includes("telefono") || msg.toLowerCase().includes("phone")) {
        setFieldErrors({ phone: msg });
      } else if (msg.toLowerCase().includes("campos requeridos")) {
        const missing: Record<string, string> = {};
        if (!role) missing.role = "Campo requerido";
        if (!phone) missing.phone = "Campo requerido";
        if (!cedula) missing.cedula = "Campo requerido";
        setFieldErrors(missing);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      infoPosition="left"
      infoBadge="Google"
      infoHeading="Completa tu registro"
      infoDescription="Solo necesitamos unos datos adicionales para terminar tu cuenta"
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Últimos pasos
          </CardTitle>
          <CardDescription>
            Bienvenido, {googleName || googleEmail}. Completa tu perfil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-6">
            {googlePhoto && !photoError ? (
              <img src={googlePhoto} alt="" className="h-16 w-16 rounded-full border-2 border-primary" onError={() => setPhotoError(true)} />
            ) : (
              <div className="h-16 w-16 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {getInitials(googleName)}
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={googleName} disabled />
            </div>

            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input value={googleEmail} disabled />
            </div>

            <div className="space-y-2">
              <Label>Tipo de cuenta *</Label>
              <Select value={role} onValueChange={(v) => { setRole(v); setFieldErrors((prev) => { const next = { ...prev }; delete next.role; return next; }); }} required>
                <SelectTrigger><SelectValue placeholder="Selecciona tu tipo de cuenta" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="estudiante">Estudiante</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="propietario">Propietario</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.role && <p className="text-sm text-red-500">{fieldErrors.role}</p>}
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-2">
              <div className="space-y-2">
                <Label>Prefijo</Label>
                <Select value={phonePrefix} onValueChange={setPhonePrefix}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+58">+58</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Teléfono *</Label>
                <Input value={phone} onChange={(e) => { setPhone(e.target.value); setFieldErrors((prev) => { const next = { ...prev }; delete next.phone; return next; }); }} placeholder="04121234567" required />
                {fieldErrors.phone && <p className="text-sm text-red-500">{fieldErrors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-[80px_1fr] gap-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={cedulaType} onValueChange={setCedulaType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="V">V</SelectItem>
                    <SelectItem value="E">E</SelectItem>
                    <SelectItem value="J">J</SelectItem>
                    <SelectItem value="P">P</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cédula *</Label>
                <Input value={cedula} onChange={(e) => { setCedula(e.target.value); setFieldErrors((prev) => { const next = { ...prev }; delete next.cedula; return next; }); }} placeholder="12345678" required />
                {fieldErrors.cedula && <p className="text-sm text-red-500">{fieldErrors.cedula}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fecha de nacimiento</Label>
              <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Género</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Femenino">Femenino</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                  <SelectItem value="Prefiero no decirlo">Prefiero no decirlo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isLoading ? "Guardando..." : "Completar registro"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default GoogleSetup;
