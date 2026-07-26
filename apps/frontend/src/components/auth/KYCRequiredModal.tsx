import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

interface KYCRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoToVerification: () => void;
}

export const KYCRequiredModal = ({ open, onOpenChange, onGoToVerification }: KYCRequiredModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-3">
            <ShieldAlert className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center text-xl">Verificación KYC requerida</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Para solicitar una propiedad o comunicarte con el propietario, primero debes completar el proceso de verificación KYC.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-2">
          <Button onClick={() => { onOpenChange(false); onGoToVerification(); }} className="w-full">
            Ir a verificación
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Ahora no
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
