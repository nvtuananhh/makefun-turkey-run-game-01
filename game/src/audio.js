// All sound is synthesized with WebAudio at run time: no audio files, no network.
// A tiny plucky tune runs under play, and short blips mark every game event.

export class GobbleSoundBank {
  constructor() {
    this.context = null;
    this.musicTimer = null;
    this.muted = false;
    this.musicStep = 0;
    this.musicNotes = [392, 440, 523, 440, 587, 523, 440, 330, 392, 440, 523, 659, 587, 523, 440, 392];
  }

  /** Create the audio context on the first user gesture; browsers block it before then. */
  unlock() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.context.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  tone(frequency, duration, type, volume, when, slideTo) {
    if (!this.context || this.muted) return;
    const start = this.context.currentTime + (when || 0);
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), start + duration);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume || 0.2, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  /** The turkey's gobble: three quick low honks sliding down. */
  gobble() {
    this.tone(320, 0.09, 'sawtooth', 0.16, 0, 220);
    this.tone(300, 0.09, 'sawtooth', 0.16, 0.11, 200);
    this.tone(280, 0.14, 'sawtooth', 0.18, 0.22, 170);
  }

  flap() {
    this.tone(500, 0.08, 'triangle', 0.12, 0, 700);
  }

  jump() {
    this.tone(280, 0.16, 'square', 0.08, 0, 560);
  }

  pickup(golden) {
    this.tone(golden ? 880 : 660, 0.1, 'sine', 0.18, 0);
    this.tone(golden ? 1320 : 990, 0.14, 'sine', 0.18, 0.08);
  }

  nearMiss() {
    this.tone(1200, 0.08, 'sine', 0.12, 0, 1800);
  }

  hit() {
    this.tone(180, 0.25, 'sawtooth', 0.22, 0, 70);
    this.tone(90, 0.3, 'square', 0.15, 0.02, 50);
  }

  /** The farmer spots the turkey: two sharp alarm blasts. */
  alarm() {
    this.tone(740, 0.12, 'square', 0.14, 0);
    this.tone(740, 0.12, 'square', 0.14, 0.16);
    this.tone(988, 0.2, 'square', 0.14, 0.32);
  }

  caught() {
    const notes = [392, 370, 349, 311];
    notes.forEach((note, index) => this.tone(note, 0.3, 'triangle', 0.2, index * 0.22));
  }

  escaped() {
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((note, index) => this.tone(note, 0.22, 'triangle', 0.2, index * 0.13));
  }

  click() {
    this.tone(700, 0.06, 'sine', 0.12, 0);
  }

  stageClear() {
    this.tone(523, 0.12, 'triangle', 0.18, 0);
    this.tone(784, 0.18, 'triangle', 0.18, 0.1);
  }

  /** A cheerful plucked loop, one note every 240 ms, quiet under the action. */
  startMusic() {
    if (!this.context || this.musicTimer) return;
    this.musicTimer = window.setInterval(() => {
      if (this.muted) return;
      const note = this.musicNotes[this.musicStep % this.musicNotes.length];
      this.tone(note, 0.2, 'triangle', 0.05, 0);
      this.musicStep += 1;
    }, 240);
  }

  stopMusic() {
    if (this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
