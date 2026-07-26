/**
 * ConsentScreen Component
 * 
 * Pantalla de consentimiento que se muestra antes de iniciar el proceso de verificación KYC.
 * Muestra el aviso de privacidad y requiere consentimiento explícito del usuario.
 * 
 * Requisitos: 31.1-31.5
 */

import React, { useState } from 'react';
import { Shield, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ConsentScreenProps {
  onAccept: (consentTimestamp: Date) => void;
  onCancel: () => void;
}

export const ConsentScreen: React.FC<ConsentScreenProps> = ({ onAccept, onCancel }) => {
  const [consentChecked, setConsentChecked] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    if (consentChecked) {
      onAccept(new Date());
    }
  };

  return (
    <div className="w-full px-0 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex justify-center mb-3 sm:mb-4">
            <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">Aviso de Privacidad y Consentimiento</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Antes de iniciar el proceso de verificación de identidad, es importante que leas y aceptes nuestro aviso de privacidad
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Privacy Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aviso de Privacidad</CardTitle>
          <CardDescription>
            Por favor, lee cuidadosamente la siguiente información sobre cómo procesaremos tus datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4" onScrollCapture={handleScroll}>
            <div className="space-y-6 text-sm">
              {/* Introducción */}
              <section>
                <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Introducción
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  En cumplimiento con el Reglamento General de Protección de Datos (GDPR) y la Ley Orgánica de Protección de Datos (LOPD), 
                  te informamos sobre el tratamiento de tus datos personales durante el proceso de verificación de identidad (KYC).
                </p>
              </section>

              {/* Datos que recopilamos */}
              <section>
                <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Datos que Recopilamos
                </h3>
                <p className="text-muted-foreground mb-2">Durante el proceso de verificación, recopilaremos los siguientes datos:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Fotografías de tu documento de identidad (frente y reverso)</li>
                  <li>Fotografía de tu rostro (selfie)</li>
                  <li>Fotografía de tu rostro sosteniendo tu documento de identidad</li>
                  <li>Video de detección de vida (liveness detection)</li>
                  <li>Datos biométricos extraídos de las imágenes faciales</li>
                  <li>Información personal contenida en tu documento: nombre completo, número de documento, fecha de nacimiento, nacionalidad</li>
                </ul>
              </section>

              {/* Finalidad del tratamiento */}
              <section>
                <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Finalidad del Tratamiento
                </h3>
                <p className="text-muted-foreground mb-2">Utilizaremos tus datos para:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Verificar tu identidad y prevenir fraudes</li>
                  <li>Cumplir con obligaciones legales y regulatorias (KYC/AML)</li>
                  <li>Garantizar la seguridad de la plataforma y sus usuarios</li>
                  <li>Procesar tu solicitud de registro o acceso a servicios</li>
                </ul>
              </section>

              {/* Procesamiento de datos biométricos */}
              <section>
                <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Procesamiento de Datos Biométricos
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Los datos biométricos son considerados datos sensibles bajo GDPR y LOPD. Procesaremos tus datos biométricos 
                  (características faciales) únicamente para verificar tu identidad mediante comparación facial entre tu selfie 
                  y la foto de tu documento de identidad. Este procesamiento se realiza con tu consentimiento explícito.
                </p>
              </section>

              {/* Almacenamiento y seguridad */}
              <section>
                <h3 className="font-semibold text-base mb-2">Almacenamiento y Seguridad</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  Tus datos serán almacenados de forma segura utilizando:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Encriptación AES-256-GCM para documentos e imágenes</li>
                  <li>Almacenamiento en servidores seguros con acceso restringido</li>
                  <li>Logs de auditoría de todos los accesos a tus datos</li>
                  <li>Retención de datos por el período legalmente requerido (máximo 5 años)</li>
                </ul>
              </section>

              {/* Tus derechos */}
              <section>
                <h3 className="font-semibold text-base mb-2">Tus Derechos</h3>
                <p className="text-muted-foreground mb-2">Bajo GDPR y LOPD, tienes derecho a:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>Acceso:</strong> Solicitar una copia de tus datos personales</li>
                  <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                  <li><strong>Supresión:</strong> Solicitar la eliminación de tus datos (derecho al olvido)</li>
                  <li><strong>Portabilidad:</strong> Recibir tus datos en formato estructurado (JSON)</li>
                  <li><strong>Oposición:</strong> Oponerte al procesamiento de tus datos</li>
                  <li><strong>Limitación:</strong> Solicitar la limitación del procesamiento</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  Para ejercer estos derechos, contacta con nuestro equipo de privacidad a través de la plataforma.
                </p>
              </section>

              {/* Base legal */}
              <section>
                <h3 className="font-semibold text-base mb-2">Base Legal</h3>
                <p className="text-muted-foreground leading-relaxed">
                  El procesamiento de tus datos se basa en: (1) tu consentimiento explícito para datos biométricos, 
                  (2) cumplimiento de obligaciones legales (KYC/AML), y (3) interés legítimo en prevenir fraudes y 
                  garantizar la seguridad de la plataforma.
                </p>
              </section>

              {/* Transferencias internacionales */}
              <section>
                <h3 className="font-semibold text-base mb-2">Transferencias Internacionales</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Tus datos pueden ser procesados en servidores ubicados en la Unión Europea o en países con nivel 
                  adecuado de protección de datos según la Comisión Europea. No transferiremos tus datos a terceros países 
                  sin garantías adecuadas.
                </p>
              </section>

              {/* Contacto */}
              <section className="pb-4">
                <h3 className="font-semibold text-base mb-2">Contacto</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Si tienes preguntas sobre este aviso de privacidad o sobre el tratamiento de tus datos, 
                  puedes contactarnos a través del sistema de tickets de la plataforma o enviando un correo 
                  a privacidad@habitas.com
                </p>
              </section>
            </div>
          </ScrollArea>

          {!hasScrolledToBottom && (
            <Alert className="mt-4">
              <AlertDescription className="text-sm">
                Por favor, desplázate hasta el final del documento para continuar
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Consent Checkbox */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/50">
              <Checkbox
                id="consent"
                checked={consentChecked}
                onCheckedChange={(checked) => setConsentChecked(checked === true)}
                disabled={!hasScrolledToBottom}
                className="mt-1"
              />
              <label
                htmlFor="consent"
                className="text-sm leading-relaxed cursor-pointer select-none"
              >
                <strong>He leído y acepto el aviso de privacidad.</strong> Doy mi consentimiento explícito para el 
                procesamiento de mis datos personales y biométricos con los fines descritos anteriormente. 
                Entiendo que puedo retirar este consentimiento en cualquier momento contactando al equipo de privacidad.
              </label>
            </div>

            {!hasScrolledToBottom && (
              <p className="text-sm text-muted-foreground text-center">
                Debes leer el aviso de privacidad completo antes de poder aceptar
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!consentChecked}
              className="w-full sm:w-auto text-sm whitespace-normal h-auto min-h-10 py-2"
            >
              Aceptar e Iniciar Verificación
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground text-center">
            Al hacer clic en "Aceptar e Iniciar Verificación", confirmas que has leído, entendido y aceptado 
            nuestro aviso de privacidad. La fecha y hora de tu consentimiento serán registradas de acuerdo 
            con los requisitos de GDPR y LOPD.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
