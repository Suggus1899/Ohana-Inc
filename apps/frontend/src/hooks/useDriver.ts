import { useCallback, useRef } from 'react';
import { driver } from 'driver.js';
import type { DriveStep, DriverHook } from 'driver.js';

type DriverOptions = {
  showProgress?: boolean;
  progressText?: string;
  nextBtnText?: string;
  prevBtnText?: string;
  doneBtnText?: string;
  onDone?: () => void;
  onSkip?: () => void;
  onHighlightStarted?: DriverHook;
};

const defaultOptions: DriverOptions = {
  showProgress: true,
  progressText: 'Paso {{current}} de {{total}}',
  nextBtnText: 'Siguiente',
  prevBtnText: 'Anterior',
  doneBtnText: 'Finalizar',
  onHighlightStarted: () => {},
};

export function useDriver(steps: DriveStep[], options?: DriverOptions) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const safeDestroy = useCallback(() => {
    if (driverRef.current) {
      try { driverRef.current.destroy(); } catch { /* driver already destroyed */ }
      driverRef.current = null;
    }
  }, []);

  const startTutorial = useCallback(() => {
    safeDestroy();

    const currentSteps = stepsRef.current;
    const currentOptions = optionsRef.current ?? {};
    const merged = { ...defaultOptions, ...currentOptions };
    const userDone = merged.onDone;
    const userSkip = merged.onSkip;

    driverRef.current = driver({
      allowClose: false,
      showProgress: merged.showProgress,
      progressText: merged.progressText,
      nextBtnText: merged.nextBtnText,
      prevBtnText: merged.prevBtnText,
      doneBtnText: merged.doneBtnText,
      steps: currentSteps,
      onHighlightStarted: (element, step, opts) => {
        merged.onHighlightStarted?.(element, step, opts);
      },
      onDoneClick: () => {
        userDone?.();
        safeDestroy();
      },
      onCloseClick: () => {
        userSkip?.();
        safeDestroy();
      },
    });

    setTimeout(() => driverRef.current?.drive(), 300);
  }, [safeDestroy]);

  const destroyTutorial = safeDestroy;

  return { startTutorial, destroyTutorial };
}
