import { Component, ErrorInfo, ReactNode } from "react";
import { Building, RefreshCw, Trash2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  isChunkError: boolean;
}

function isChunkLoadError(err: Error): boolean {
  return (
    err.message.includes("Loading chunk") ||
    err.message.includes("Failed to fetch dynamically imported module") ||
    err.message.includes("dynamically imported module") ||
    err.message.includes("ChunkLoadError")
  );
}

export class ErrorBoundary extends Component<Props, State> {
  private onlineHandler: (() => void) | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: undefined, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isChunkError: isChunkLoadError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  componentDidMount() {
    if (!navigator.onLine) {
      this.onlineHandler = () => {
        window.location.reload();
      };
      window.addEventListener("online", this.onlineHandler);
    }
  }

  componentWillUnmount() {
    if (this.onlineHandler) {
      window.removeEventListener("online", this.onlineHandler);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearAndReload = () => {
    if ("caches" in window) {
      caches.keys().then((names) =>
        Promise.all(names.map((n) => caches.delete(n)))
      );
    }
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, isChunkError } = this.state;
    const isOnline = navigator.onLine;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-gray-100 to-green-100/60">
        <div className="text-center px-6 max-w-md">
          {isOnline ? (
            <Building className="h-16 w-16 text-primary mx-auto mb-4" />
          ) : (
            <WifiOff className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          )}

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isChunkError
              ? "Error de conexi\u00f3n"
              : isOnline
                ? "Algo sali\u00f3 mal"
                : "Sin conexi\u00f3n a internet"}
          </h1>

          <p className="text-gray-600 mb-6">
            {isChunkError
              ? "No se pudo cargar un componente de la aplicaci\u00f3n. Esto suele ocurrir por problemas de conexi\u00f3n o porque el servidor se reinici\u00f3."
              : !isOnline
                ? "No hay conexi\u00f3n a internet. La p\u00e1gina se recargar\u00e1 autom\u00e1ticamente cuando la conexi\u00f3n se restablezca."
                : "Ocurri\u00f3 un error inesperado. Puede deberse a un problema temporal."}
          </p>

          {error && process.env.NODE_ENV === "development" && (
            <details className="mb-4 text-left">
              <summary className="text-xs text-gray-400 cursor-pointer">
                Detalles del error
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto max-h-32">
                {error.message}
                {"\n"}
                {error.stack}
              </pre>
            </details>
          )}

          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={this.handleReload}
              size="lg"
              className="gap-2 w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Recargar p\u00e1gina
            </Button>

            <Button
              variant="outline"
              onClick={this.handleClearAndReload}
              className="gap-2 w-full sm:w-auto text-muted-foreground"
            >
              <Trash2 className="h-4 w-4" />
              Limpiar cach\u00e9 y recargar
            </Button>
          </div>

          {!isOnline && (
            <p className="text-sm text-orange-600 mt-4 animate-pulse">
              Esperando conexi\u00f3n a internet...
            </p>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
