import confetti from 'canvas-confetti';

export function fireCelebration(): void {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.7 },
      colors: ['#0d7a5f', '#10b981', '#34d399', '#6ee7b7'],
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.7 },
      colors: ['#0d7a5f', '#10b981', '#34d399', '#6ee7b7'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}
