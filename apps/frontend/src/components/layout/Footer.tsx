import { MapPin, Phone, Mail, Building, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-b border-gray-300">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Brand */}
          <div className="p-6">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Building className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary">Habitas</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tu mejor opción para encontrar el hogar perfecto en San Juan de los Morros y más allá.
            </p>
          </div>

          {/* Enlaces */}
          <div className="p-6">
            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full" />
              Enlaces
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/#propiedades" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3" />
                  Propiedades
                </Link>
              </li>
              <li>
                <Link to="/#como-funciona" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3" />
                  Cómo funciona
                </Link>
              </li>
              <li>
                <Link to="/#ubicacion" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3" />
                  Ubicación
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3" />
                  Preguntas Frecuentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="p-6">
            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full" />
              Contacto
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <a href="tel:+584167325766" className="text-foreground hover:text-primary transition-colors font-medium">+58 416-732-5766</a>
                </div>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Correo</p>
                  <a href="mailto:soporte@habitasweb.me" className="text-foreground hover:text-primary transition-colors font-medium">soporte@habitasweb.me</a>
                </div>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ubicación</p>
                  <p className="text-foreground font-medium">San Juan de los Morros, Guárico</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Habitas. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
