import Navbar from "@/components/layout/Navbar";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Politicas = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="default" />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
        <h1 className="text-3xl font-bold mb-6">Políticas de Privacidad</h1>
        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Información que Recopilamos</h2>
            <p>Recopilamos información personal que nos proporcionas directamente, como nombre, correo electrónico, número de teléfono, y datos de identificación cuando realizas el proceso KYC.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Uso de la Información</h2>
            <p>Utilizamos tu información para: procesar tu registro, verificar tu identidad, facilitar la comunicación entre usuarios, mejorar nuestros servicios, y cumplir con obligaciones legales.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Protección de Datos</h2>
            <p>Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos personales contra accesos no autorizados, pérdida o alteración.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Compartir Información</h2>
            <p>No compartimos tu información personal con terceros excepto cuando sea necesario para proporcionar el servicio, por requerimiento legal, o con tu consentimiento explícito.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Cookies</h2>
            <p>Utilizamos cookies y tecnologías similares para mejorar tu experiencia en la plataforma. Puedes controlar el uso de cookies desde la configuración de tu navegador.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Tus Derechos</h2>
            <p>Tienes derecho a acceder, rectificar, eliminar tus datos personales, así como a oponerte o limitar su tratamiento. Para ejercer estos derechos, contáctanos a través de la plataforma.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Contacto</h2>
            <p>Si tienes preguntas sobre esta política de privacidad, puedes contactarnos a través del sistema de tickets de la plataforma o enviando un correo a privacidad@Ohana.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Politicas;