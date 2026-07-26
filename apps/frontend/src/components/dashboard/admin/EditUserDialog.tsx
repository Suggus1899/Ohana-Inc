import { useState, useEffect } from "react";
import { useToastNotification } from "@/contexts/ToastNotificationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Pencil, Eye, EyeOff } from "lucide-react";
import api from "@/services/api";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any | null;
  onUserUpdated: () => void;
}

const EditUserDialog = ({ open, onOpenChange, user, onUserUpdated }: EditUserDialogProps) => {
  const { showError, showSuccess } = useToastNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phonePrefix: "+57",
    phone: "",
    cedulaType: "CC",
    cedula: "",
    dateOfBirth: "",
    city: "",
    role: "cliente",
    password: "",
  });

  useEffect(() => {
    if (user && open) {
      const cedulaStr = String(user.cedula || "");
      const cedulaParts = cedulaStr.includes("-") ? cedulaStr.split("-") : ["V", cedulaStr];
      
      let formattedDate = "";
      if (user.dateOfBirth) {
        try {
          formattedDate = new Date(user.dateOfBirth).toISOString().split('T')[0];
        } catch (e) {
          formattedDate = user.dateOfBirth;
        }
      }

      setFormData({
        name: user.name || "",
        email: user.email || "",
        phonePrefix: user.phonePrefix || "+57",
        phone: user.phone || "",
        cedulaType: cedulaParts[0] || "CC",
        cedula: cedulaParts[1] || "",
        dateOfBirth: formattedDate,
        city: user.city || "",
        role: user.role || "cliente",
        password: "",
      });
      setChangePassword(false);
      setShowPassword(false);
    }
  }, [user, open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setIsLoading(true);

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        phonePrefix: formData.phonePrefix,
        phone: formData.phone,
        cedulaType: formData.cedulaType,
        cedula: formData.cedula,
        dateOfBirth: formData.dateOfBirth,
        city: formData.city,
        role: formData.role,
        ...(changePassword && formData.password ? { password: formData.password } : {})
      };

      const response = await api.updateUser(user.id, updateData);

      if (response.success) {
        showSuccess("Usuario actualizado", `${formData.name} ha sido actualizado exitosamente.`);
        onUserUpdated();
        onOpenChange(false);
      } else {
        showError("Error al actualizar", response.error?.message || "Error desconocido");
      }
    } catch (error) {
      showError("Error de conexión", "No se pudo actualizar el usuario.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phonePrefix: "+58",
      phone: "",
      cedulaType: "V",
      cedula: "",
      dateOfBirth: "",
      city: "",
      role: "cliente",
      password: "",
    });
    setChangePassword(false);
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-blue-600" />
            Editar Usuario
          </DialogTitle>
          <DialogDescription>
            Modifica la información del usuario {user?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
              Información Personal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Ej: juan@email.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cedulaType">Tipo de Cédula *</Label>
                <Select value={formData.cedulaType} onValueChange={(value) => handleInputChange("cedulaType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">CC - Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">CE - Cédula de Extranjería</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cedula">Número de Cédula *</Label>
                <Input
                  id="cedula"
                  value={formData.cedula}
                  onChange={(e) => handleInputChange("cedula", e.target.value)}
                  placeholder="Ej: 12345678"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
              Información de Contacto
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phonePrefix">Prefijo</Label>
                <Select value={formData.phonePrefix} onValueChange={(value) => handleInputChange("phonePrefix", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+57">+57 (Colombia)</SelectItem>
                    <SelectItem value="+1">+1 (USA/Canadá)</SelectItem>
                    <SelectItem value="+58">+58 (Venezuela)</SelectItem>
                    <SelectItem value="+34">+34 (España)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Ej: 4241234567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Ej: Caracas"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
              Configuración de Cuenta
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="role">Rol del Usuario *</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="estudiante">Estudiante</SelectItem>
                  <SelectItem value="propietario">Propietario</SelectItem>
                  <SelectItem value="operator">Operador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="changePassword"
                  checked={changePassword}
                  onCheckedChange={(checked) => setChangePassword(checked as boolean)}
                />
                <Label htmlFor="changePassword" className="text-sm">
                  Cambiar contraseña
                </Label>
              </div>

              {changePassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="pr-10"
                      required={changePassword} 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Actualizando...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Actualizar Usuario
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;