// audio.js - Sound Effects and BGM Controller using Web Audio API and HTML5 Audio

class SoundManager {
  constructor() {
    this.ctx = null;
    this.bgm = null;
    this.isMuted = false;
    this.sfxVolume = 0.7;
    this.bgmVolume = 0.45;
    this.initDone = false;
  }

  init() {
    if (this.initDone) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }

      // Initialize BGM
      this.bgm = new Audio('./Plushie_in_the_Chute (1).mp3');
      this.bgm.loop = true;
      this.bgm.volume = this.bgmVolume;

      this.initDone = true;
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }
  }

  resumeContext() {
    if (!this.initDone) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playBgm() {
    this.resumeContext();
    if (this.bgm && !this.isMuted) {
      this.bgm.play().catch(e => console.log('BGM autoplay prevented until user interaction:', e));
    }
  }

  pauseBgm() {
    if (this.bgm) {
      this.bgm.pause();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.bgm) {
      if (this.isMuted) {
        this.bgm.pause();
      } else {
        this.playBgm();
      }
    }
    return this.isMuted;
  }

  // --- Procedural Sound Effects ---
  
  // Coin insert sound (Crisp dual bell tone)
  playCoinInsert() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [987.77, 1318.51].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      
      gain.gain.setValueAtTime(0.3 * this.sfxVolume, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.4);
    });
  }

  // Claw Motor moving hum
  playMotorHum(duration = 0.12, pitch = 220) {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.linearRampToValueAtTime(pitch + 15, t + duration);

    gain.gain.setValueAtTime(0.06 * this.sfxVolume, t);
    gain.gain.linearRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + duration);
  }

  // Claw Drop whoosh & chain descending
  playDropWhoosh() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.5);

    gain.gain.setValueAtTime(0.15 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  // Claw Grasp clamp / squeak
  playClawGrip() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    
    // Mechanical click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.08);

    gain.gain.setValueAtTime(0.2 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);

    // Plush squeak
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(520, t + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(1040, t + 0.15);

    gain2.gain.setValueAtTime(0.12 * this.sfxVolume, t + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(t + 0.05);
    osc2.stop(t + 0.2);
  }

  // Chute Drop Success Fanfare / Chime
  playWinChime(rarity = 'COMMON') {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.ctx) return;

    const notes = rarity === 'LEGENDARY' || rarity === 'EPIC' 
      ? [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98] 
      : [523.25, 659.25, 783.99, 1046.50];

    const t = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.1);

      gain.gain.setValueAtTime(0.25 * this.sfxVolume, t + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.1 + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.1);
      osc.stop(t + idx * 0.1 + 0.55);
    });
  }

  // Plushie Drop Slip / Miss
  playMiss() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.linearRampToValueAtTime(140, t + 0.35);

    gain.gain.setValueAtTime(0.12 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  // Cash Register Cha-Ching!
  playChaChing() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Metallic bell ring
    [1567.98, 2093.00].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.09);

      gain.gain.setValueAtTime(0.35 * this.sfxVolume, t + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + i * 0.09);
      osc.stop(t + i * 0.09 + 0.65);
    });
  }

  // UI Button click
  playClick() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);

    gain.gain.setValueAtTime(0.15 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }
}

export const soundManager = new SoundManager();
