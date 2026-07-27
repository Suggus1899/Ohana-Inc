import Navbar from "@/components/layout/Navbar";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terminos = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="default" />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
        <h1 className="text-3xl font-bold mb-6">Términos y Condiciones</h1>
        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Aceptación de los Términos</h2>
            <p>Al acceder y utilizar la plataforma Ohana, aceptas cumplir con estos términos y condiciones. Si no estás de acuerdo con alguna parte, no debes usar nuestros servicios.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Descripción del Servicio</h2>
            <p>Ohana es una plataforma que conecta propietarios de inmuebles con potenciales inquilinos. Facilitamos la publicación, búsqueda y gestión de propiedades en alquiler.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Registro de Usuario</h2>
            <p>Para utilizar ciertas funciones, debes crear una cuenta proporcionando información veraz y completa. Eres responsable de mantener la confidencialidad de tus credenciales.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Uso Aceptable</h2>
            <p>Te comprometes a usar la plataforma de manera ética y legal, sin realizar actividades fraudulentas, publicar contenido falso o acosar a otros usuarios.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Propiedad Intelectual</h2>
            <p>Todo el contenido de la plataforma, incluyendo diseño, logotipos y software, es propiedad de Ohana y está protegido por leyes de propiedad intelectual.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Limitación de Responsabilidad</h2>
            <p>Ohana actúa como intermediario y no se hace responsable por las transacciones entre usuarios. No garantizamos la exactitud de los anuncios publicados por terceros.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Modificaciones</h2>
            <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a través de la plataforma.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terminos;