import { lazy, Suspense } from "react";
import { LazyMotion, domAnimation, AnimatePresence, motion } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts";
import { ToastNotificationProvider } from "@/contexts/ToastNotificationContext";
import { BehaviorTrackerProvider } from "@/contexts/BehaviorTrackerContext";
import { ExchangeRateProvider } from "@/contexts/ExchangeRateContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "@/components/common/ErrorBoundary";

const Index = lazy(() => import("./pages/Index"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Profile = lazy(() => import("./pages/Profile"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const OperatorDashboard = lazy(() => import("./pages/OperatorDashboard"));
const OwnerDashboard = lazy(() => import("./pages/OwnerDashboard"));
const TenantDashboard = lazy(() => import("./pages/TenantDashboard"));
const NavigationView = lazy(() => import("./pages/NavigationView"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const GoogleSetup = lazy(() => import("./pages/GoogleSetup"));
const Terminos = lazy(() => import("./pages/Terminos"));
const Politicas = lazy(() => import("./pages/Politicas"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const pageTransition = {
  initial: false,
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: "easeInOut" },
};

const loginTransition = {
  initial: false,
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.35, ease: "easeInOut" },
};

const registerTransition = {
  initial: false,
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
  transition: { duration: 0.35, ease: "easeInOut" },
};

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<motion.div {...pageTransition}><Index /></motion.div>} />
        <Route path="/propiedades/:id" element={<motion.div {...pageTransition}><PropertyDetail /></motion.div>} />
        <Route path="/registro" element={<motion.div {...registerTransition}><Register /></motion.div>} />
        <Route path="/login" element={<motion.div {...loginTransition}><Login /></motion.div>} />
        <Route path="/perfil/:userId" element={<motion.div {...pageTransition}><PublicProfile /></motion.div>} />
        <Route path="/terminos" element={<motion.div {...pageTransition}><Terminos /></motion.div>} />
        <Route path="/politicas" element={<motion.div {...pageTransition}><Politicas /></motion.div>} />
        <Route path="/recuperar-password" element={<motion.div {...pageTransition}><ForgotPassword /></motion.div>} />
        <Route path="/verificar-email" element={<motion.div {...pageTransition}><VerifyEmail /></motion.div>} />
        <Route path="/auth/callback" element={<motion.div {...pageTransition}><AuthCallback /></motion.div>} />
        <Route path="/auth/google-setup" element={<motion.div {...pageTransition}><GoogleSetup /></motion.div>} />

        <Route path="/admin" element={<motion.div {...pageTransition}><ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute></motion.div>} />
        <Route path="/propietario" element={<motion.div {...pageTransition}><ProtectedRoute allowedRoles={['propietario']}><OwnerDashboard /></ProtectedRoute></motion.div>} />
        <Route path="/operator" element={<motion.div {...pageTransition}><ProtectedRoute allowedRoles={['operator', 'admin']}><OperatorDashboard /></ProtectedRoute></motion.div>} />
        <Route path="/estudiante" element={<motion.div {...pageTransition}><ProtectedRoute allowedRoles={['estudiante']}><TenantDashboard /></ProtectedRoute></motion.div>} />
        <Route path="/cliente" element={<motion.div {...pageTransition}><ProtectedRoute allowedRoles={['cliente']}><TenantDashboard /></ProtectedRoute></motion.div>} />
        <Route path="/perfil" element={<motion.div {...pageTransition}><ProtectedRoute><Profile /></ProtectedRoute></motion.div>} />
        <Route path="/navigation/:propertyId" element={<motion.div {...pageTransition}><ProtectedRoute><NavigationView /></ProtectedRoute></motion.div>} />
        <Route path="*" element={<motion.div {...pageTransition}><NotFound /></motion.div>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <BehaviorTrackerProvider>
        <LazyMotion features={domAnimation}>
          <ToastNotificationProvider>
            <TooltipProvider>
              <Toaster />
              <BrowserRouter>
                <ExchangeRateProvider>
                <ChatProvider>
                  <ErrorBoundary>
                    <Suspense fallback={
                    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                      <p className="mt-4 text-muted-foreground animate-pulse font-medium">Cargando Habitas...</p>
                    </div>
                  }>
                    <AppRoutes />
                  </Suspense>
                  </ErrorBoundary>
                </ChatProvider>
                </ExchangeRateProvider>
              </BrowserRouter>
            </TooltipProvider>
          </ToastNotificationProvider>
        </LazyMotion>
      </BehaviorTrackerProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
