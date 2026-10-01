/**
 * SoundSystem: Procedural Web Audio API sound synthesizer.
 * Generates dynamic engine RPM frequencies, tire drift squeals, and metallic collision thuds.
 */
export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;

    // Engine synth nodes
    this.engineOsc = null;
    this.engineGain = null;

    // Tire drift squeal nodes
    this.driftOsc = null;
    this.driftGain = null;

    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();

    // 1. Engine Oscillator Setup
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(65, this.ctx.currentTime);
    this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    // Lowpass filter for deep die-cast engine rumble
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    this.engineOsc.start();

    // 2. Drift Squeal Setup
    this.driftOsc = this.ctx.createOscillator();
    this.driftGain = this.ctx.createGain();
    this.driftOsc.type = 'triangle';
    this.driftOsc.frequency.setValueAtTime(650, this.ctx.currentTime);
    this.driftGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.driftOsc.connect(this.driftGain);
    this.driftGain.connect(this.ctx.destination);
    this.driftOsc.start();

    this.initialized = true;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(volume) {
    if (this.isMuted) return;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0.04 * volume, this.ctx.currentTime, 0.05);
    }
  }

  updateEngine(speed, topSpeed, throttle) {
    if (!this.initialized || !this.ctx) return;
    const ratio = Math.min(Math.abs(speed) / (topSpeed || 400), 1.0);
    // Base idle 50Hz, revs up to 260Hz with throttle pitch flare
    const throttleBoost = throttle > 0 ? 35 : 0;
    const targetFreq = 50 + ratio * 180 + throttleBoost;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
  }
}
