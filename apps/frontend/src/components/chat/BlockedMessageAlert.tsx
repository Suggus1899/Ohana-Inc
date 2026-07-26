import { AlertTriangle, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface BlockedMessageAlertProps {
  reason: string;
  violations?: string[];
  riskScore?: number;
  onDismiss?: () => void;
}

export function BlockedMessageAlert({
  reason,
  violations = [],
  riskScore = 0,
  onDismiss,
}: BlockedMessageAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const getViolationLabel = (type: string): string => {
    const labels: Record<string, string> = {
      phone: "Número telefónico detectado",
      phone_evasive: "Número telefónico (formato evasivo)",
      phone_international: "Número internacional detectado",
      numeric_sequence: "Secuencia numérica sospechosa",
      email: "Correo electrónico detectado",
      email_evasive: "Correo electrónico (formato evasivo)",
      email_domain: "Dominio de email mencionado",
      whatsapp: "WhatsApp mencionado",
      whatsapp_link: "Enlace de WhatsApp detectado",
      instagram: "Instagram mencionado",
      telegram: "Telegram mencionado",
      facebook: "Facebook mencionado",
      messenger: "Messenger mencionado",
      tiktok: "TikTok mencionado",
      snapchat: "Snapchat mencionado",
      signal: "Signal mencionado",
      url: "Enlace externo detectado",
      www: "Sitio web mencionado",
      short_url: "URL acortada detectada",
      banned_phrase: "Frase no permitida",
    };
    return labels[type] || type;
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-2">
      <div className="flex items-start gap-3">
        <div className="bg-red-100 rounded-full p-2 shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-red-800 text-sm">
              Mensaje Bloqueado
            </h4>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 -mr-2 -mt-2"
                onClick={() => {
                  setIsDismissed(true);
                  onDismiss();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-sm text-red-700 mt-1">{reason}</p>

          {violations.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-red-600 font-medium mb-1">
                Violaciones detectadas:
              </p>
              <ul className="text-xs text-red-600 space-y-0.5">
                {violations.map((violation, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-400 rounded-full" />
                    {getViolationLabel(violation)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {riskScore > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-red-600 font-medium">
                Nivel de riesgo:
              </span>
              <div className="flex-1 h-2 bg-red-200 rounded-full overflow-hidden max-w-[100px]">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${Math.min(riskScore, 100)}%` }}
                />
              </div>
              <span className="text-xs text-red-600 font-medium">
                {riskScore}/100
              </span>
            </div>
          )}

          <div className="mt-3 p-3 bg-white rounded border border-red-100">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-700 font-medium">
                  Recordatorio de seguridad:
                </p>
                <ul className="text-xs text-gray-600 mt-1 space-y-0.5 list-disc list-inside">
                  <li>No compartas números telefónicos</li>
                  <li>No menciones redes sociales (WhatsApp, Instagram, etc.)</li>
                  <li>No compartas correos electrónicos</li>
                  <li>No envíes enlaces externos</li>
                </ul>
                <p className="text-xs text-gray-700 mt-2">
                  Todas las comunicaciones deben realizarse dentro de la plataforma para tu seguridad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
