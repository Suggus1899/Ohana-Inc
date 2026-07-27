import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToastNotification } from "@/contexts/ToastNotificationContext";
import { Loader2, Building, Eye, EyeOff, UserPlus, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";
import RoleSelector from "@/components/auth/RoleSelector";

type UserRole = 'estudiante' | 'cliente' | 'propietario';

const getPasswordStrength = (pwd: string) => {
  let s = 0;
  if (pwd.length >= 6) s++; if (pwd.length >= 10) s++;
  if (/[A-Z]/.test(pwd)) s++; if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
};

const ROLE_DASHBOARD: Record<string, string> = {
  admin: '/admin',
  operator: '/operator',
  propietario: '/propietario',
  cliente: '/cliente',
  estudiante: '/estudiante',
};

const Register = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastNotification();
  const { register, isAuthenticated, googleLogin, getRedirectPath } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showCpwd, setShowCpwd] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [formData, setFormData] = useState({
    name: "", email: "", phonePrefix: "+57", phone: "",
    cedulaType: "CC", cedula: "", dateOfBirth: "", gender: "",
    password: "", confirmPassword: "",
    role: "estudiante" as UserRole,
  });

  useEffect(() => {
    if (isAuthenticated) navigate(getRedirectPath(), { replace: true });
  }, [isAuthenticated, navigate, getRedirectPath]);

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (formData.name.length < 2) e.name = "Nombre muy corto";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Email inválido";
    if (formData.phone.length < 7) e.phone = "Mínimo 7 dígitos";
    if (formData.cedula.length < 6) e.cedula = "Mínimo 6 caracteres";
    if (!formData.dateOfBirth) e.dateOfBirth = "Selecciona tu fecha de nacimiento";
    if (!formData.gender) e.gender = "Selecciona tu género";
    if (formData.password.length < 6) e.password = "Mínimo 6 caracteres";
    if (formData.password !== formData.confirmPassword) e.confirmPassword = "No coinciden";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const { confirmPassword: _confirmPassword, ...data } = formData;
      const result = await register(data);
      if (result.success) {
        showSuccess("Cuenta creada!", "Verifica tu correo para completar el registro");
        const { api } = await import("@/services/api");
        api.sendVerificationCode(formData.email, formData.name).catch(() => {});
        navigate(`/verificar-email?email=${encodeURIComponent(formData.email)}&name=${encodeURIComponent(formData.name)}&redirect=${encodeURIComponent(ROLE_DASHBOARD[formData.role] || '/login')}`);
      } else {
        setGeneralError("");
        if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
          setFieldErrors(result.fieldErrors);
        }
        if (result.error) {
          setGeneralError(result.error);
        }
        setIsLoading(false);
      }
    } catch {
      showError("Error de conexion", "No se pudo conectar con el servidor");
      setIsLoading(false);
    }
  };

  const handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = ev.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((p) => { const n = { ...p }; delete n[name]; return n; });
  };

  const clearError = (name: string) => {
    if (fieldErrors[name]) setFieldErrors((p) => { const n = { ...p }; delete n[name]; return n; });
    if (generalError) setGeneralError("");
  };

  const strength = formData.password ? getPasswordStrength(formData.password) : 0;
  const strengthLabel = ["", "Muy debil", "Debil", "Regular", "Buena", "Fuerte"][Math.min(strength, 5)];
  const strengthColor = strength <= 1 ? "bg-red-400" : strength <= 2 ? "bg-orange-400" : strength <= 3 ? "bg-yellow-400" : strength <= 4 ? "bg-lime-400" : "bg-emerald-400";

  const inputCls = "h-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 rounded-lg";
  const lblCls = "text-gray-700 text-sm font-medium";
  const selectCls = "h-10 bg-white border-gray-300 text-gray-700 rounded-lg";
  const selectContentCls = "bg-white border-gray-200 text-gray-900 rounded-lg shadow-lg";

  return (
    <AuthLayout
      infoPosition="right"
      infoHeading="Crear cuenta"
      infoDescription="Completa tus datos para unirte a la comunidad y accede a miles de propiedades verificadas."
    >
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 group mb-6 lg:hidden">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
            <Building className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-gray-900">Habitas</span>
            <ArrowLeft className="h-3 w-3 text-gray-400 group-hover:text-primary transition-colors" />
            <span className="text-[11px] text-gray-400 font-normal group-hover:text-primary transition-colors">Da click aqui para ir al inicio</span>
          </div>
        </Link>

        <div className="mb-5 lg:hidden">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Crear cuenta</h2>
          <p className="text-gray-500 text-sm mt-1">Completa tus datos para unirte a la comunidad y accede a miles de propiedades verificadas.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          {generalError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {generalError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label htmlFor="name" className={lblCls}>Nombre</Label>
              <Input id="name" name="name" placeholder="Juan Perez" value={formData.name} onChange={handleChange} required disabled={isLoading} className={inputCls} />
              {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className={lblCls}>Email</Label>
              <Input id="email" name="email" type="email" placeholder="correo@ejemplo.com" value={formData.email} onChange={handleChange} required disabled={isLoading} className={inputCls} />
              {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label className={lblCls}>Telefono</Label>
              <div className="flex gap-2">
                <Select value={formData.phonePrefix} onValueChange={(v) => { setFormData((p) => ({ ...p, phonePrefix: v })); clearError("phone"); }} disabled={isLoading}>
                  <SelectTrigger className={`w-[72px] ${selectCls}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={selectContentCls}>
                    <SelectItem value="+57">+57</SelectItem><SelectItem value="+1">+1</SelectItem>
                    <SelectItem value="+34">+34</SelectItem>
                    <SelectItem value="+52">+52</SelectItem><SelectItem value="+54">+54</SelectItem>
                  </SelectContent>
                </Select>
                <Input id="phone" name="phone" type="tel" placeholder="3001234567" value={formData.phone} onChange={handleChange} required disabled={isLoading} className={`flex-1 ${inputCls}`} />
              </div>
              {fieldErrors.phone && <p className="text-xs text-red-500">{fieldErrors.phone}</p>}
            </div>
            <div className="space-y-1">
              <Label className={lblCls}>Cedula</Label>
              <div className="flex gap-2">
                <Select value={formData.cedulaType} onValueChange={(v) => { setFormData((p) => ({ ...p, cedulaType: v })); clearError("cedula"); }} disabled={isLoading}>
                  <SelectTrigger className={`w-[56px] ${selectCls}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={selectContentCls}>
                    <SelectItem value="CC">CC</SelectItem><SelectItem value="CE">CE</SelectItem>
                  </SelectContent>
                </Select>
                <Input id="cedula" name="cedula" placeholder="12345678" value={formData.cedula} onChange={handleChange} required disabled={isLoading} className={`flex-1 ${inputCls}`} />
              </div>
              {fieldErrors.cedula && <p className="text-xs text-red-500">{fieldErrors.cedula}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label htmlFor="dateOfBirth" className={lblCls}>Fecha de nacimiento</Label>
              <Input
                id="dateOfBirth" name="dateOfBirth" type="date"
                value={formData.dateOfBirth} onChange={handleChange}
                required disabled={isLoading}
                max={new Date().toISOString().split('T')[0]}
                className={inputCls}
              />
              {fieldErrors.dateOfBirth && <p className="text-xs text-red-500">{fieldErrors.dateOfBirth}</p>}
            </div>
            <div className="space-y-1">
              <Label className={lblCls}>Género</Label>
              <Select
                value={formData.gender}
                onValueChange={(v) => { setFormData((p) => ({ ...p, gender: v })); clearError('gender'); }}
                disabled={isLoading}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent className={selectContentCls}>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                  <SelectItem value="prefiero-no-decir">Prefiero no decirlo</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.gender && <p className="text-xs text-red-500">{fieldErrors.gender}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label htmlFor="password" className={lblCls}>Contrasena</Label>
              <div className="relative">
                <Input id="password" name="password" placeholder="........" type={showPwd ? "text" : "password"} value={formData.password} onChange={handleChange} required minLength={6} disabled={isLoading} className={`${inputCls} pr-10`} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-red-500">{fieldErrors.password}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className={lblCls}>Confirmar</Label>
              <div className="relative">
                <Input id="confirmPassword" name="confirmPassword" placeholder="........" type={showCpwd ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} required minLength={6} disabled={isLoading} className={`${inputCls} pr-10`} />
                <button type="button" onClick={() => setShowCpwd(!showCpwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                  {showCpwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && <p className="text-xs text-red-500">{fieldErrors.confirmPassword}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label className={lblCls}>Tipo de cuenta</Label>
            <RoleSelector
              value={formData.role}
              onChange={(v) => setFormData((p) => ({ ...p, role: v as UserRole }))}
              disabled={isLoading}
              disabledRoles={['cliente']}
            />
          </div>

          {formData.password && (
            <div className="space-y-1">
              <div className="flex gap-1 h-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${i < strength ? strengthColor : "bg-gray-200"}`} />
                ))}
              </div>
              <p className="text-xs text-gray-400 text-right">{strengthLabel}</p>
            </div>
          )}

          <Button type="submit" disabled={isLoading}
            className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-sm transition-all duration-200">
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
            {isLoading ? "Creando..." : "Crear cuenta"}
          </Button>

          <p className="text-xs text-center text-gray-500">
            Al registrarte aceptas nuestros{" "}
            <Link to="/terminos" className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">Terminos</Link>{" "}
            y{" "}
            <Link to="/privacidad" className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">Privacidad</Link>
            {" "}&middot;{" "}
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2 transition-colors">Inicia sesion</Link>
          </p>

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
        </form>
      </div>
    </AuthLayout>
  );
};

export default Register;
