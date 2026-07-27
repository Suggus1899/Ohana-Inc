import { Shield, Home, Users, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "../layout/Logo";

interface AuthLayoutProps {
  children: React.ReactNode;
  infoHeading: string;
  infoDescription: string;
  infoBadge?: string;
  infoPosition?: "left" | "right";
}

const infoCards = [
  { icon: Shield, label: "Verificacion KYC", desc: "Maxima seguridad en cada transaccion" },
  { icon: Home, label: "Propiedades verificadas", desc: "Explora opciones de alquiler en toda la region" },
  { icon: Users, label: "Comunidad confiable", desc: "Conecta con propietarios e inquilinos verificados" },
];

const benefits = [
  "Acceso ilimitado",
  "Mensajeria directa",
  "Alertas personalizadas",
  "Gestion de solicitudes",
  "Soporte 24/7",
];

const AuthLayout = ({ children, infoHeading, infoDescription, infoBadge, infoPosition = "left" }: AuthLayoutProps) => {
  return (
    <div className={`min-h-screen w-full bg-white flex ${infoPosition === "right" ? "flex-row-reverse" : ""}`}>
      {/* Desktop: Info panel */}
      <div className={`hidden lg:flex w-[45%] xl:w-[42%] bg-gray-50/80 flex-col justify-center px-8 xl:px-12 py-10 ${infoPosition === "right" ? "border-l border-gray-100" : "border-r border-gray-100"}`}>
        <div className="space-y-6 max-w-md mx-auto w-full">
          <Link to="/" className="flex items-center gap-2 group">
            <Logo markClassName="h-5 w-5" wordmarkClassName="text-lg font-bold text-gray-900" />
            <ArrowLeft className="h-3 w-3 text-gray-400 group-hover:text-primary transition-colors" />
            <span className="text-[11px] text-gray-400 font-normal group-hover:text-primary transition-colors">Da click aqui para ir al inicio</span>
          </Link>

          {infoBadge && (
            <div className="flex items-center px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-xs font-medium text-primary w-fit">
              {infoBadge}
            </div>
          )}

          <div>
            <h1 className="text-2xl xl:text-3xl font-bold text-gray-900 leading-tight tracking-tight">
              {infoHeading}
            </h1>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              {infoDescription}
            </p>
          </div>

          <div className="space-y-2">
            {infoCards.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/5 flex-shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">{item.label}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {benefits.map((b, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
                <span className="text-xs text-gray-500">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-8">
        {children}
      </div>

      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 30px white inset !important;
          -webkit-text-fill-color: #111827 !important;
          caret-color: #111827;
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;
