import { useState, useEffect, useCallback } from 'react';
import { useGeolocation } from './useGeolocation';
import { useRouteCalculation } from './useRouteCalculation';
import { useToast } from './use-toast';
import * as navigationService from '../services/navigationService';
import { RouteData, RouteCoordinates } from '../services/routingService';

export interface UseNavigationProps {
  destination: RouteCoordinates | null;
  mode?: 'foot' | 'bike' | 'car';
}

export interface UseNavigationReturn {
  isNavigating: boolean;
  route: RouteData | null;
  currentStepIndex: number;
  isOffRoute: boolean;
  loading: boolean;
  error: string | null;
  startNavigation: () => void;
  stopNavigation: () => void;
  recalculate: () => void;
  currentPosition: { lat: number, lng: number } | null;
  hasArrived: boolean;
}

export const useNavigation = ({ destination, mode = 'foot' }: UseNavigationProps): UseNavigationReturn => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [lastNotifiedStep, setLastNotifiedStep] = useState<number | null>(null);

  const { toast } = useToast();
  const { position, error: geoError } = useGeolocation();
  const { route, loading, error: routeError, calculateRoute, clearRoute } = useRouteCalculation();

  const startNavigation = useCallback(async () => {
    if (!position || !destination) return;
    
    setIsNavigating(true);
    await calculateRoute(
      { lat: position.lat, lng: position.lng },
      destination,
      mode
    );
  }, [position, destination, mode, calculateRoute]);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    clearRoute();
    setCurrentStepIndex(0);
    setIsOffRoute(false);
  }, [clearRoute]);

  const recalculate = useCallback(async () => {
    if (!position || !destination) return;
    
    await calculateRoute(
      { lat: position.lat, lng: position.lng },
      destination,
      mode
    );
  }, [position, destination, mode, calculateRoute]);

  // Track user movement relative to route
  useEffect(() => {
    if (isNavigating && route && position) {
      const offRoute = navigationService.isUserOffRoute(
        position.lat,
        position.lng,
        route.geometry.coordinates
      );

      setIsOffRoute(offRoute);

      if (!offRoute) {
        const stepIndex = navigationService.findCurrentStepIndex(
          position.lat,
          position.lng,
          route.steps
        );
        
        if (stepIndex !== currentStepIndex) {
          setCurrentStepIndex(stepIndex);
        }

        // Maneuver Notifications (Task 2.1)
        if (route.steps[stepIndex]) {
          const nextStep = route.steps[stepIndex];
          if (nextStep.distance < 50 && lastNotifiedStep !== stepIndex) {
            setLastNotifiedStep(stepIndex);
            
            // Visual Alert
            toast({
              title: "Próxima Maniobra",
              description: nextStep.instruction,
              duration: 5000,
            });

            // Audio Alert (Opcional - Task 2.1)
            playNotificationSound();
          }
        }
      }

      // Detect arrival (Resolución Funcional 1)
      const lastCoord = route.geometry.coordinates[route.geometry.coordinates.length - 1];
      const distToDest = navigationService.calculateDistance(
        position.lat,
        position.lng,
        lastCoord[1], // lat
        lastCoord[0]  // lng
      );

      if (distToDest < 20 && !hasArrived) {
        setHasArrived(true);
        toast({
          title: "¡Has llegado!",
          description: "Has alcanzado tu destino.",
          variant: "default",
        });
        playArrivalSound();
      }
    }
  }, [isNavigating, route, position, currentStepIndex, hasArrived, lastNotifiedStep, toast]);

  // Sound utilities
  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const playArrivalSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioContext.currentTime + 0.5); // C6
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.8);
  };

  // Auto-recalculate if off route for too long (simplified)
  useEffect(() => {
    if (isOffRoute && isNavigating) {
      const timer = setTimeout(() => {
        recalculate();
      }, 5000); // Wait 5 seconds before recalculating
      return () => clearTimeout(timer);
    }
  }, [isOffRoute, isNavigating, recalculate]);

  return {
    isNavigating,
    route,
    currentStepIndex,
    isOffRoute,
    loading,
    error: geoError || routeError,
    startNavigation,
    stopNavigation,
    recalculate,
    currentPosition: position ? { lat: position.lat, lng: position.lng } : null,
    hasArrived
  };
};
