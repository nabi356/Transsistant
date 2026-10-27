// Audio & Speech Synthesis Engine for Transsistant
export class AudioEngine {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static audioCtx: AudioContext | null = null;
  private static isSirenPlaying = false;
  private static sirenOscillator: OscillatorNode | null = null;
  private static sirenTimer: number | null = null;

  private static getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Play natural speech for hearing listeners
  public static speak(text: string, voiceRate = 1.0, pitch = 1.0, language = 'en-US'): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve();
        return;
      }

      this.synth.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceRate;
      utterance.pitch = pitch;
      utterance.lang = language;

      // Select natural sounding voice if available
      const voices = this.synth.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith(language.slice(0, 2)) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      this.synth.speak(utterance);
    });
  }

  // Stop any speech
  public static stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // Gentle affirmative chime when a sign is locked / recognized
  public static playRecognizeChime(): void {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.23);
    } catch {
      // Audio context might need user gesture
    }
  }

  // Success celebration chime for mastering a sign in Pattern Coach
  public static playSuccessFanfare(): void {
    try {
      const ctx = this.getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.26);
      });
    } catch {
      // Ignored
    }
  }

  // Emergency SOS High-Alert Siren generator
  public static startEmergencySiren(): void {
    if (this.isSirenPlaying) return;
    try {
      const ctx = this.getAudioContext();
      this.isSirenPlaying = true;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      this.sirenOscillator = osc;

      let up = true;
      this.sirenTimer = window.setInterval(() => {
        if (!this.isSirenPlaying) return;
        const targetFreq = up ? 960 : 600;
        osc.frequency.linearRampToValueAtTime(targetFreq, ctx.currentTime + 0.35);
        up = !up;
      }, 400);
    } catch {
      // Ignored
    }
  }

  public static stopEmergencySiren(): void {
    this.isSirenPlaying = false;
    if (this.sirenTimer) {
      clearInterval(this.sirenTimer);
      this.sirenTimer = null;
    }
    if (this.sirenOscillator) {
      try {
        this.sirenOscillator.stop();
        this.sirenOscillator.disconnect();
      } catch {
        // Ignored
      }
      this.sirenOscillator = null;
    }
  }

  public static isSirenActive(): boolean {
    return this.isSirenPlaying;
  }
}
