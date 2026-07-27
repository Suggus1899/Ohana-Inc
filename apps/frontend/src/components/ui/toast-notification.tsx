import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastNotificationProps {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  onClose: (id: string) => void;
  playSound?: boolean;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
    progress: "bg-green-500",
  },
  error: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    progress: "bg-red-500",
  },
  warning: {
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-800",
    icon: "text-yellow-600 dark:text-yellow-400",
    progress: "bg-yellow-500",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    progress: "bg-blue-500",
  },
};

const ToastNotification = ({
  id,
  type,
  title,
  description,
  duration = 5000,
  onClose,
  playSound = true,
}: ToastNotificationProps) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Play sound
    if (playSound) {
      playNotificationSound(type);
    }

    // Progress bar animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 100));
        if (newProgress <= 0) {
          clearInterval(interval);
          // Defer state update to avoid updating parent during render
          setTimeout(() => onClose(id), 0);
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [id, type, duration, onClose, playSound]);

  const Icon = icons[type];
  const colorScheme = colors[type];

  return (
    <m.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "relative w-full max-w-sm rounded-lg border-2 shadow-lg overflow-hidden backdrop-blur-sm",
        colorScheme.bg,
        colorScheme.border
      )}
    >
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-gray-200 dark:bg-gray-700 w-full">
        <m.div
          className={cn("h-full", colorScheme.progress)}
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>

      {/* Content */}
      <div className="p-4 pr-12">
        <div className="flex items-start gap-3">
          <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", colorScheme.icon)} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={() => onClose(id)}
        className="absolute top-3 right-3 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </m.div>
  );
};

// Sound effects using Web Audio API
const playNotificationSound = (type: ToastType) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different frequencies for different notification types
    const frequencies = {
      success: [523.25, 659.25, 783.99], // C5, E5, G5 (major chord)
      error: [392.00, 329.63], // G4, E4 (descending)
      warning: [440.00, 493.88], // A4, B4
      info: [523.25, 587.33], // C5, D5
    };

    const freq = frequencies[type];
    let currentNote = 0;

    const playNote = () => {
      if (currentNote < freq.length) {
        oscillator.frequency.setValueAtTime(freq[currentNote], audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        currentNote++;
        setTimeout(playNote, 100);
      } else {
        oscillator.stop();
      }
    };

    oscillator.start();
    playNote();
  } catch (error) {
    // Silently fail if audio is not supported
    console.warn("Audio notification not supported:", error);
  }
};

export default ToastNotification;
