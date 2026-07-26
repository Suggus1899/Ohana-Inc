import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import ToastNotification, { ToastType } from "@/components/ui/toast-notification";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastNotificationContextType {
  showToast: (toast: Omit<Toast, "id">) => void;
  showSuccess: (title: string, description?: string) => void;
  showError: (title: string, description?: string) => void;
  showWarning: (title: string, description?: string) => void;
  showInfo: (title: string, description?: string) => void;
}

const ToastNotificationContext = createContext<ToastNotificationContextType | undefined>(
  undefined
);

export const useToastNotification = () => {
  const context = useContext(ToastNotificationContext);
  if (!context) {
    throw new Error("useToastNotification must be used within ToastNotificationProvider");
  }
  return context;
};

export const ToastNotificationProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const showSuccess = useCallback(
    (title: string, description?: string) => {
      showToast({ type: "success", title, description });
    },
    [showToast]
  );

  const showError = useCallback(
    (title: string, description?: string) => {
      showToast({ type: "error", title, description });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (title: string, description?: string) => {
      showToast({ type: "warning", title, description });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, description?: string) => {
      showToast({ type: "info", title, description });
    },
    [showToast]
  );

  return (
    <ToastNotificationContext.Provider
      value={{ showToast, showSuccess, showError, showWarning, showInfo }}
    >
      {children}

      {/* Toast Container - Top Right */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastNotification
                id={toast.id}
                type={toast.type}
                title={toast.title}
                description={toast.description}
                duration={toast.duration}
                onClose={removeToast}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastNotificationContext.Provider>
  );
};
