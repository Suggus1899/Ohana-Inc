import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface SessionExpiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReLogin: () => void;
}

export const SessionExpiredModal = ({ open, onOpenChange, onReLogin }: SessionExpiredModalProps) => {
  const handleReLogin = () => {
    onReLogin();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(e) => { if (!e) onOpenChange(false); }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-3">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center text-xl">Sesión expirada</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Tu sesión ha expirado. Por favor, inicia sesión nuevamente para continuar usando la plataforma.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-2">
          <Button onClick={handleReLogin} className="w-full">
            Ir a iniciar sesión
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
