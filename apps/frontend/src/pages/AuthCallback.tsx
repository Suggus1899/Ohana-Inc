import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { completeAuth } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      return;
    }

    if (!token) {
      setError("No se recibió el token de autenticación");
      return;
    }

    api.setToken(token);
    api.getCurrentUser().then((res) => {
      if (res.success && res.data) {
        const user = res.data.user;
        completeAuth(token, user);
        const role = user.role;
        const paths: Record<string, string> = {
          admin: "/admin",
          operator: "/operator",
          propietario: "/propietario",
          cliente: "/cliente",
          estudiante: "/estudiante",
        };
        navigate(paths[role] || "/login", { replace: true });
      } else {
        setError("Error al verificar la sesión");
      }
    }).catch(() => {
      setError("Error de conexión al verificar la sesión");
    });
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">!</div>
          <h1 className="text-xl font-bold mb-2">Error de autenticación</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Iniciando sesión</h1>
        <p className="text-gray-500">Redirigiendo al dashboard...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
