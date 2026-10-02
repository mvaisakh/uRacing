/**
 * SoundSystem: Procedural Web Audio API sound synthesizer and background music manager.
 * Generates dynamic engine RPM frequencies, tire drift squeals, metallic collision thuds,
 * and plays normalized looping menu music with smooth crossfades between screens.
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

    // Menu background music
    this.bgmAudio = null;
    this.bgmTargetVolume = 0.28; // Normalized comfortable volume (doesn't blast on load)
    this.bgmFadeInterval = null;
    this.isBgmPlaying = false;

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
    this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // default silent until race starts

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

    // 3. Setup HTML5 Audio element for Menu Background Music
    this._initBgm();

    this.initialized = true;
  }

  _initBgm() {
    if (this.bgmAudio) return;

    this.bgmAudio = new Audio();
    this.bgmAudio.src = 'public/audio/menu_theme.mp3';
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = 0; // Starts at 0 for smooth fade-in
    this.bgmAudio.preload = 'auto';

    // Fallback if browser blocks relative public/ path
    this.bgmAudio.onerror = () => {
      if (this.bgmAudio.src.indexOf('Quarter_for_the_Win.mp3') === -1) {
        this.bgmAudio.src = 'Quarter_for_the_Win.mp3';
        this.bgmAudio.load();
      }
    };
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Starts looping menu theme with gentle fade-in at normalized volume (0.28).
   */
  startMenuMusic() {
    if (!this.bgmAudio) this._initBgm();
    if (this.isMuted) return;

    this.isBgmPlaying = true;
    if (this.bgmFadeInterval) clearInterval(this.bgmFadeInterval);

    // Mute engine idle in menu
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.05);
    }

    const playPromise = this.bgmAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Fade in smoothly to avoid any volume jump
        let curVol = this.bgmAudio.volume;
        this.bgmFadeInterval = setInterval(() => {
          if (!this.isBgmPlaying) {
            clearInterval(this.bgmFadeInterval);
            return;
          }
          curVol = Math.min(this.bgmTargetVolume, curVol + 0.03);
          this.bgmAudio.volume = curVol;
          if (curVol >= this.bgmTargetVolume) {
            clearInterval(this.bgmFadeInterval);
          }
        }, 50);
      }).catch(err => {
        console.warn('BGM autoplay waiting for user interaction:', err);
      });
    }
  }

  /**
   * Gently fades out menu music when transitioning into active race.
   */
  stopMenuMusic() {
    this.isBgmPlaying = false;
    if (!this.bgmAudio) return;

    if (this.bgmFadeInterval) clearInterval(this.bgmFadeInterval);

    let curVol = this.bgmAudio.volume;
    this.bgmFadeInterval = setInterval(() => {
      curVol = Math.max(0, curVol - 0.04);
      this.bgmAudio.volume = curVol;
      if (curVol <= 0) {
        clearInterval(this.bgmFadeInterval);
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
      }
    }, 40);
  }

  setVolume(volume) {
    if (this.isMuted) return;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0.04 * volume, this.ctx.currentTime, 0.05);
    }
    if (this.bgmAudio && this.isBgmPlaying) {
      this.bgmTargetVolume = 0.28 * volume;
      this.bgmAudio.volume = this.bgmTargetVolume;
    }
  }

  updateEngine(speed, topSpeed, throttle) {
    if (!this.initialized || !this.ctx) return;
    const ratio = Math.min(Math.abs(speed) / (topSpeed || 400), 1.0);
    // Base idle 50Hz, revs up to 260Hz with throttle pitch flare
    const throttleBoost = throttle > 0 ? 35 : 0;
    const targetFreq = 50 + ratio * 180 + throttleBoost;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);

    // Restore engine gain in race
    const targetGain = 0.04 + ratio * 0.03;
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
  }

  updateDriftScreech(isDrifting, lateralSpeed) {
    if (!this.initialized || !this.ctx) return;
    const targetGain = isDrifting ? Math.min(0.08, (Math.abs(lateralSpeed) / 120) * 0.08) : 0;
    this.driftGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
  }

  playImpactSound(speed = 200) {
    if (!this.initialized || !this.ctx) return;
    // Generate white noise burst with rapid decay for metallic toy bounce
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = this.ctx.createGain();
    const intensity = Math.min(1.0, speed / 400);
    gain.gain.setValueAtTime(0.2 * intensity, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }
}
