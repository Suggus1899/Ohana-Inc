import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/AuthContext";
import { Upload } from "lucide-react";

interface KYCDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KYCDialog = ({ open, onOpenChange }: KYCDialogProps) => {
  const { toast } = useToast();
  const { user } = useUser();
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState("");

  const handleIdDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdDocument(e.target.files[0]);
    }
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelfie(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!idDocument || !selfie) {
      toast({
        title: "Error",
        description: "Debes subir tanto el documento de identidad como la selfie",
        variant: "destructive"
      });
      return;
    }

    // Update user verification status
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map((u: Record<string, unknown>) => 
      u.id === user!.id ? { ...u, isVerified: true } : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    // Update current user
    const updatedUser = { ...user!, isVerified: true };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    toast({
      title: "¡Verificación completada!",
      description: "Tu cuenta ha sido verificada exitosamente. Ahora puedes registrar propiedades."
    });

    // Reload page to update context
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verificación de usuario (KYC)</DialogTitle>
          <DialogDescription>
            Complete el siguiente formulario para verificar su identidad y convertirse en propietario
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="idDocument">Documento de identidad</Label>
            <div className="flex items-center gap-2">
              <Input
                id="idDocument"
                type="file"
                accept="image/*"
                onChange={handleIdDocumentChange}
                className="cursor-pointer"
                required
              />
              <Upload className="w-5 h-5 text-muted-foreground" />
            </div>
            {idDocument && (
              <p className="text-sm text-muted-foreground">
                Archivo seleccionado: {idDocument.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="selfie">Selfie</Label>
            <div className="flex items-center gap-2">
              <Input
                id="selfie"
                type="file"
                accept="image/*"
                onChange={handleSelfieChange}
                className="cursor-pointer"
                required
              />
              <Upload className="w-5 h-5 text-muted-foreground" />
            </div>
            {selfie && (
              <p className="text-sm text-muted-foreground">
                Archivo seleccionado: {selfie.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Información adicional</Label>
            <Textarea
              id="additionalInfo"
              name="additionalInfo"
              placeholder="Cuéntenos cualquier información relevante..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={4}
            />
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Al enviar este formulario, confirma que la información proporcionada es correcta y está de acuerdo
              con nuestros términos y condiciones de verificación.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Enviar verificación
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
