let completionAudioContext: AudioContext | null = null;

function getCompletionAudioContext(): AudioContext | null {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!completionAudioContext) {
    completionAudioContext = new AudioContextClass();
  }

  if (completionAudioContext.state === 'suspended') {
    completionAudioContext.resume().catch(() => {});
  }

  return completionAudioContext;
}

export function playCompletionSound() {
  try {
    const ctx = getCompletionAudioContext();
    if (!ctx) return;

    const playTone = (frequency: number, startTime: number, duration: number, gain: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      // Add a tiny bit of warmth with a second oscillator slightly detuned
      const oscillator2 = ctx.createOscillator();
      
      oscillator.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator2.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator2.frequency.setValueAtTime(frequency * 1.005, startTime); // slight detune for warmth
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.005); // snappy attack
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      oscillator.start(startTime);
      oscillator2.start(startTime);
      oscillator.stop(startTime + duration);
      oscillator2.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Classic friendly ding — quick double tap, slightly bell-like
    playTone(880, now, 0.5, 0.15);           // A5 — bright and friendly
    playTone(1108.73, now + 0.18, 0.6, 0.1); // C#6 — harmonious resolution
  } catch {
    // fail silently
  }
}