let inputAudioContext: AudioContext | null = null;

function getInputAudioContext(): AudioContext | null {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!inputAudioContext) {
    inputAudioContext = new AudioContextClass();
  }

  if (inputAudioContext.state === 'suspended') {
    inputAudioContext.resume().catch(() => {});
  }

  return inputAudioContext;
}

function playSoftTone(frequency: number) {
  try {
    const ctx = getInputAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    const now = ctx.currentTime;
    const duration = 0.12;
    const gain = 0.05;

    oscillator.frequency.setValueAtTime(frequency, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(gain, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch {
    // fail silently
  }
}

export function playInputSound() {
  // A single soft, brief tap on starting to listen — quieter and shorter than
  // the completion chime, just enough to acknowledge the tap.
  playSoftTone(660); // E5, kept plain and quiet
}

export function playStopSound() {
  // The equally gentle counterpart when listening ends — a touch lower, so
  // start and stop feel like a clear pair without either being showy.
  playSoftTone(494); // B4
}