import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToastNotification } from "@/contexts/ToastNotificationContext";
import { Loader2 } from "lucide-react";
import api from "@/services/api";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
  defaultRole?: "cliente" | "propietario" | "operator" | "admin";
}

const CreateUserDialog = ({ open, onOpenChange, onUserCreated, defaultRole }: CreateUserDialogProps) => {
  const { showSuccess, showError, showWarning } = useToastNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phonePrefix: "+58",
    phone: "",
    cedulaType: "V",
    cedula: "",
    dateOfBirth: "",
    city: "",
    password: "",
    confirmPassword: "",
    role: (defaultRole ?? "cliente") as "cliente" | "estudiante" | "propietario" | "operator" | "admin",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones del frontend
    if (formData.password !== formData.confirmPassword) {
      showWarning(
        "Las contraseñas no coinciden",
        "Asegúrate de escribir la misma contraseña en ambos campos."
      );
      return;
    }

    if (formData.password.length < 6) {
      showWarning(
        "Contraseña muy corta",
        "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    if (formData.phone.length < 7) {
      showWarning(
        "Número de teléfono inválido",
        "Por favor, ingresa un número de teléfono válido."
      );
      return;
    }

    if (formData.cedula.length < 6) {
      showWarning(
        "Cédula inválida",
        "Por favor, ingresa un número de cédula válido."
      );
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...userData } = formData;

      const response = await api.createUser(userData);

      if (response.success) {
        showSuccess(
          "¡Usuario creado exitosamente!",
          `El usuario ${formData.name} ha sido creado correctamente.`
        );
        
        // Resetear el formulario
        setFormData({
          name: "",
          email: "",
          phonePrefix: "+58",
          phone: "",
          cedulaType: "V",
          cedula: "",
          dateOfBirth: "",
          city: "",
          password: "",
          confirmPassword: "",
          role: "cliente",
        });

        // Cerrar el dialog
        onOpenChange(false);

        // Notificar al componente padre para actualizar la lista
        onUserCreated();
      } else {
        // Mensajes específicos de error
        const errorMessages: Record<string, { title: string; description: string }> = {
          "Email already exists": {
            title: "Correo ya registrado",
            description: "Ya existe un usuario con este correo electrónico.",
          },
          "Cedula already exists": {
            title: "Cédula ya registrada",
            description: "Ya existe un usuario con esta cédula de identidad.",
          },
          "Invalid email format": {
            title: "Formato de correo inválido",
            description: "El correo electrónico ingresado no tiene un formato válido.",
          },
          "Invalid role": {
            title: "Rol inválido",
            description: "El rol seleccionado no es válido.",
          },
          "All fields are required": {
            title: "Campos incompletos",
            description: "Por favor, completa todos los campos requeridos.",
          },
        };

        const errorKey = response.error?.message || "";
        const errorInfo = errorMessages[errorKey] || {
          title: "Error al crear usuario",
          description: response.error?.message || "Ocurrio un error inesperado.",
        };

        showError(errorInfo.title, errorInfo.description);
      }
    } catch (error) {
      showError(
        "Error de conexión",
        "No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Completa el formulario para crear un nuevo usuario en el sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Juan Pérez"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono *</Label>
            <div className="flex gap-2">
              <Select
                value={formData.phonePrefix}
                onValueChange={(value) => setFormData({ ...formData, phonePrefix: value })}
                disabled={isLoading}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+58">🇻🇪 +58</SelectItem>
                  <SelectItem value="+1">🇺🇸 +1</SelectItem>
                  <SelectItem value="+34">🇪🇸 +34</SelectItem>
                  <SelectItem value="+57">🇨🇴 +57</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="412-1234567"
                value={formData.phone}
                onChange={handleChange}
                required
                className="flex-1"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Cédula */}
          <div className="space-y-2">
            <Label htmlFor="cedula">Cédula de identidad *</Label>
            <div className="flex gap-2">
              <Select
                value={formData.cedulaType}
                onValueChange={(value) => setFormData({ ...formData, cedulaType: value })}
                disabled={isLoading}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="V">V</SelectItem>
                  <SelectItem value="E">E</SelectItem>
                  <SelectItem value="J">J</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="cedula"
                name="cedula"
                type="text"
                placeholder="12345678"
                value={formData.cedula}
                onChange={handleChange}
                required
                className="flex-1"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Fecha de nacimiento y Ciudad */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Fecha de nacimiento *</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad *</Label>
              <Input
                id="city"
                name="city"
                type="text"
                placeholder="Caracas"
                value={formData.city}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Rol */}
          <div className="space-y-2">
            <Label htmlFor="role">Rol *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value as typeof formData.role })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cliente">Cliente/Inquilino</SelectItem>
                <SelectItem value="estudiante">Estudiante</SelectItem>
                <SelectItem value="propietario">Propietario</SelectItem>
                <SelectItem value="operator">Operador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contraseñas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Usuario"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;