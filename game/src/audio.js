// Tiny sound effects from WebAudio oscillators — no audio files, no network.
// A soft blip for the steal, a rising alarm when spotted, a low thud when caught,
// and a little two-note chime when a level clears.
export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (!context) {
      try {
        const AudioContext = window.AudioContext ?? window.webkitAudioContext;
        context = new AudioContext();
      } catch {
        context = null;
      }
    }
    if (context && context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }

  function tone(frequency, durationSeconds, type, gainValue, delaySeconds = 0) {
    const audio = ensure();
    if (!audio || muted) return;
    const start = audio.currentTime + delaySeconds;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSeconds);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + durationSeconds + 0.05);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    steal() {
      tone(880, 0.12, 'sine', 0.12);
      tone(1318, 0.18, 'sine', 0.1, 0.09);
    },
    spotted() {
      tone(220, 0.25, 'square', 0.05);
    },
    alarm() {
      tone(196, 0.3, 'sawtooth', 0.08);
      tone(147, 0.4, 'sawtooth', 0.08, 0.22);
    },
    caught() {
      tone(110, 0.5, 'sawtooth', 0.12);
      tone(55, 0.6, 'sine', 0.14, 0.1);
    },
    clear() {
      tone(523, 0.15, 'sine', 0.1);
      tone(784, 0.25, 'sine', 0.1, 0.12);
    },
    click() {
      tone(660, 0.06, 'sine', 0.06);
    },
  };
}
