import { useState, useEffect } from "react";
import { Shield, Lock, CheckCircle2, AlertCircle, Fingerprint, Smartphone, UserPlus, FileScan, ScanFace, ShieldCheck } from "lucide-react";
import { m } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const kycSteps = [
  {
    step: "1",
    icon: UserPlus,
    title: "Registro inicial",
    description: "Crea tu cuenta proporcionando información básica: nombre, email, teléfono y cédula de identidad.",
    color: "bg-blue-500",
    gradient: "from-blue-500 to-blue-700",
  },
  {
    step: "2",
    icon: FileScan,
    title: "Verificación de documentos",
    description: "Sube tu cédula de identidad o pasaporte. Nuestro equipo verificará la autenticidad en 24-48 horas.",
    color: "bg-purple-500",
    gradient: "from-violet-500 to-purple-700",
  },
  {
    step: "3",
    icon: ScanFace,
    title: "Validación de identidad",
    description: "Confirmamos tu identidad mediante verificación facial o videollamada para garantizar seguridad.",
    color: "bg-green-500",
    gradient: "from-emerald-500 to-green-700",
  },
  {
    step: "4",
    icon: ShieldCheck,
    title: "Cuenta verificada",
    description: "Una vez aprobado, obtienes acceso completo a la plataforma con tu insignia de usuario verificado.",
    color: "bg-primary",
    gradient: "from-primary to-primary/80",
  },
];

const benefits = [
  {
    icon: Shield,
    title: "Seguridad garantizada",
    description: "Todos los usuarios pasan por verificación KYC para proteger a la comunidad",
  },
  {
    icon: Lock,
    title: "Datos protegidos",
    description: "Tu información personal está encriptada y cumple con estándares internacionales",
  },
  {
    icon: CheckCircle2,
    title: "Confianza mutua",
    description: "Propietarios e inquilinos verificados para transacciones seguras",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const Features = () => {
  const [showAppModal, setShowAppModal] = useState(false);
  const [currentPhone, setCurrentPhone] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhone((prev) => (prev === 1 ? 2 : 1));
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 px-4 py-1.5 text-sm font-medium">
            <Fingerprint className="w-4 h-4 mr-2" />
            Verificación KYC
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Proceso de verificación de identidad
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
            En Ohana, la seguridad es nuestra prioridad. Por eso implementamos un proceso de verificación KYC 
            (Know Your Customer) para garantizar que todos los usuarios sean personas reales y confiables.
          </p>
        </m.div>

        {/* KYC Steps */}
        <m.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {kycSteps.map((step, index) => (
            <m.div key={index} variants={itemVariants}>
              <Card className="relative h-full border-2 hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl group overflow-hidden bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm rounded-xl">
                {/* Step Number Badge */}
                <div className={`absolute top-4 right-4 w-10 h-10 rounded-full ${step.color} text-white flex items-center justify-center font-bold text-lg shadow-xl ring-2 ring-white/20 z-10`}>
                  {step.step}
                </div>
                
                <CardContent className="p-6 pt-8">
                  <m.div
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} shadow-lg mb-5 ring-2 ring-white/10`}
                  >
                    <step.icon className="w-8 h-8 text-white drop-shadow-lg" />
                  </m.div>
                  
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {step.description}
                  </p>
                </CardContent>

                {/* Decorative gradient bar */}
                <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${step.color} opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-lg`} />
                
                {/* Glow effect on hover */}
                <div className={`absolute -inset-0.5 ${step.color} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500 rounded-xl pointer-events-none`} />
              </Card>
            </m.div>
          ))}
        </m.div>

        {/* Info Alert */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16"
        >
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    ¿Por qué verificamos tu identidad?
                  </h4>
                  <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                    La verificación KYC nos permite crear un entorno seguro y confiable para todos. Esto previene fraudes, 
                    protege tu información y garantiza que tanto propietarios como inquilinos sean personas reales. 
                    Tu privacidad está protegida y tus datos solo se usan para verificación.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </m.div>

        {/* Benefits */}
        <m.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-8"
        >
          {benefits.map((benefit, index) => (
            <m.div
              key={index}
              variants={itemVariants}
              className="group p-8 bg-background rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border-2 border-border/50 hover:border-primary/50"
            >
              <m.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5"
              >
                <benefit.icon className="w-8 h-8 text-primary" />
              </m.div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
            </m.div>
          ))}
        </m.div>

        {/* App Download CTA */}
        <div className="mt-20">
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 p-6 md:p-10 w-full md:w-fit mx-auto">
            <div className="absolute inset-0 bg-grid-white/5 opacity-20 pointer-events-none" />
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-20">
              {/* Content (first in DOM for mobile: appears on top) */}
              <div className="text-center md:text-left">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                  <Smartphone className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  Descarga la app oficial
                </h2>
                <p className="text-muted-foreground max-w-xl mb-8 text-base">
                  Gestiona tus propiedades, chatea con inquilinos y mantente al día desde cualquier lugar con nuestra aplicación móvil.
                </p>
                <div className="flex flex-row gap-3 justify-center md:justify-start">
                  <button
                    onClick={() => setShowAppModal(true)}
                    style={{ cursor: "pointer" }}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-foreground text-background rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.97] transition-[transform,box-shadow] duration-150 text-sm"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    <span>App Store</span>
                  </button>
                  <button
                    onClick={() => setShowAppModal(true)}
                    style={{ cursor: "pointer" }}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-foreground text-background rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.97] transition-[transform,box-shadow] duration-150 text-sm"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
                    </svg>
                    <span>Google Play</span>
                  </button>
                </div>
              </div>

              {/* Phone Image (second in DOM on mobile: appears below content) */}
              <div className="flex-shrink-0 flex justify-center md:justify-start">
                <m.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="relative w-56 md:w-64"
                >
                  <img
                    src={currentPhone === 1 ? "/images/telefono-1.png" : "/images/telefono-2.png"}
                    alt="App móvil"
                    className="w-full h-auto"
                  />
                  <m.div
                    animate={{ scale: [1, 0.7, 1], opacity: [0.45, 0.1, 0.45] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-3 left-0 right-0 mx-auto w-[80%] h-4 bg-black/50 rounded-full blur-lg pointer-events-none"
                  />
                </m.div>
              </div>
            </div>
          </div>
        </div>

        {/* App Modal */}
        <Dialog open={showAppModal} onOpenChange={setShowAppModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                <Smartphone className="w-5 h-5 inline-block mr-2 text-primary" />
                App móvil
              </DialogTitle>
              <DialogDescription className="text-center pt-2">
                Ohana aún no cuenta con una aplicación móvil, pero estamos trabajando para que muy pronto esté disponible en todas las plataformas.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary font-medium">
                <Smartphone className="w-4 h-4" />
                Próximamente
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default Features;
