import { ReactNode } from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ChatProvider } from '@/contexts';
import { ToastNotificationProvider } from '@/contexts/ToastNotificationContext';
import { BehaviorTrackerProvider } from '@/contexts/BehaviorTrackerContext';
import { ExchangeRateProvider } from '@/contexts/ExchangeRateContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/common/ErrorBoundary';

const queryClient = new QueryClient();

/**
 * Composite provider tree — flattens the 12-level nesting in App.tsx
 * into a readable, maintainable structure.
 *
 * Providers are ordered by dependency:
 * 1. Infrastructure (QueryClient, Router, LazyMotion)
 * 2. Auth (must be before anything that reads user state)
 * 3. Domain contexts (Notifications, Chat, ExchangeRate, BehaviorTracking)
 * 4. UI (Toasts, Tooltips)
 */
function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LazyMotion features={domAnimation}>
          <AuthProvider>
            <NotificationProvider>
              <BehaviorTrackerProvider>
                <ExchangeRateProvider>
                  <ChatProvider>
                    <ToastNotificationProvider>
                      <TooltipProvider>
                        <Toaster />
                        <ErrorBoundary>{children}</ErrorBoundary>
                      </TooltipProvider>
                    </ToastNotificationProvider>
                  </ChatProvider>
                </ExchangeRateProvider>
              </BehaviorTrackerProvider>
            </NotificationProvider>
          </AuthProvider>
        </LazyMotion>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default AppProviders;
export { queryClient };
