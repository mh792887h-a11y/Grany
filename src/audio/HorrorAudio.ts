/**
 * Procedural Horror Web Audio Synthesizer
 * Produces chilling Granny-style horror sound effects without any external files!
 */

class HorrorAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private isDronePlaying: boolean = false;
  private heartbeatInterval: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.75;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.75, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Continuous eerie low-frequency horror drone with dissonant beating
   */
  public startAmbientDrone() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isDronePlaying) return;

    try {
      this.isDronePlaying = true;
      const now = this.ctx.currentTime;

      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.001, now);
      this.droneGain.gain.exponentialRampToValueAtTime(0.22, now + 3);
      this.droneGain.connect(this.masterGain);

      // Low sub rumble (48Hz)
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sawtooth';
      this.droneOsc1.frequency.setValueAtTime(48, now);

      // Low dissonant tone with detune
      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(51.5, now);

      // Filter to make it dark and muffled
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);

      this.droneOsc1.connect(filter);
      this.droneOsc2.connect(filter);
      filter.connect(this.droneGain);

      this.droneOsc1.start();
      this.droneOsc2.start();
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public stopAmbientDrone() {
    if (this.droneGain && this.ctx) {
      try {
        this.droneGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1);
        setTimeout(() => {
          this.droneOsc1?.stop();
          this.droneOsc2?.stop();
          this.droneOsc1?.disconnect();
          this.droneOsc2?.disconnect();
          this.isDronePlaying = false;
        }, 1000);
      } catch {
        this.isDronePlaying = false;
      }
    }
  }

  /**
   * Terrifying heartbeat that intensifies when Granny is near
   * proximity: 0 (far) to 1 (right next to player)
   */
  public updateHeartbeat(proximity: number) {
    if (proximity <= 0.15) {
      if (this.heartbeatInterval !== null) {
        window.clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      return;
    }

    if (this.heartbeatInterval === null) {
      // Trigger heartbeat loop
      const beatRate = Math.max(300, 1100 - proximity * 700);
      this.playSingleHeartbeat(proximity);
      this.heartbeatInterval = window.setInterval(() => {
        this.playSingleHeartbeat(proximity);
      }, beatRate);
    }
  }

  private playSingleHeartbeat(intensity: number) {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Deep thud
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);

    const vol = Math.min(0.8, 0.2 + intensity * 0.6);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.23);

    // Second faint lub-DUB echo
    setTimeout(() => {
      if (!this.ctx || !this.masterGain || this.isMuted) return;
      const t = this.ctx.currentTime;
      const o2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(55, t);
      o2.frequency.exponentialRampToValueAtTime(28, t + 0.14);
      g2.gain.setValueAtTime(vol * 0.7, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      o2.connect(g2);
      g2.connect(this.masterGain);
      o2.start(t);
      o2.stop(t + 0.17);
    }, 130);
  }

  /**
   * Footsteps for Player and Granny
   */
  public playFootstep(isGranny: boolean = false, isRunning: boolean = false, isSneaking: boolean = false) {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    // Filtered noise burst for wood floor creak and thump
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isGranny ? 180 : 320, now);
    filter.Q.setValueAtTime(1.5, now);

    const gain = this.ctx.createGain();
    let volume = 0.18;
    if (isGranny) volume = 0.45; // Granny's steps are ominous and heavy
    else if (isRunning) volume = 0.38;
    else if (isSneaking) volume = 0.04;

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  /**
   * Floor creaking when walking in certain zones
   */
  public playFloorCreak() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110 + Math.random() * 40, now);
    osc.frequency.linearRampToValueAtTime(240 + Math.random() * 50, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.28);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  /**
   * Loud crash when a vase or item falls and alerts Granny
   */
  public playCrashSound() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    // Glass shatter noise
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const highFilter = this.ctx.createBiquadFilter();
    highFilter.type = 'highpass';
    highFilter.frequency.setValueAtTime(1800, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.65, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    noise.connect(highFilter);
    highFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(now);

    // Heavy ceramic impact thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

    oscGain.gain.setValueAtTime(0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  /**
   * Door opening creak
   */
  public playDoorCreak() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(380, now + 0.35);
    osc.frequency.linearRampToValueAtTime(190, now + 0.6);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, now);
    filter.Q.setValueAtTime(4, now);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.66);
  }

  /**
   * Crowbar prying wooden plank
   */
  public playCrowbarPry() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    // Metallic screech
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.36);

    // Wood snap after delay
    setTimeout(() => {
      if (!this.ctx || !this.masterGain || this.isMuted) return;
      const t = this.ctx.currentTime;
      const snap = this.ctx.createOscillator();
      const sGain = this.ctx.createGain();
      snap.type = 'triangle';
      snap.frequency.setValueAtTime(140, t);
      snap.frequency.exponentialRampToValueAtTime(40, t + 0.2);
      sGain.gain.setValueAtTime(0.5, t);
      sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      snap.connect(sGain);
      sGain.connect(this.masterGain);
      snap.start(t);
      snap.stop(t + 0.21);
    }, 280);
  }

  /**
   * Padlock unlock click
   */
  public playLockUnlock() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Electronic keypad beep
   */
  public playKeypadBeep(success: boolean = false) {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(success ? 880 : 440, now);
    if (success) {
      osc.frequency.setValueAtTime(1100, now + 0.1);
    }

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (success ? 0.3 : 0.12));

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + (success ? 0.32 : 0.14));
  }

  /**
   * Granny's terrifying demonic whisper / voice cue in game
   */
  public playGrannyTaunt() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Dissonant, ghostly undulating pitch
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(240, now + 0.3);
    osc.frequency.linearRampToValueAtTime(160, now + 0.7);
    osc.frequency.linearRampToValueAtTime(110, now + 1.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.Q.setValueAtTime(5, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.35);
  }

  /**
   * Blood-curdling Jumpscare Screech & Heavy Impact
   */
  public playJumpscare() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    // 1. Harsh screech (frequency modulation)
    const screech = this.ctx.createOscillator();
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const screechGain = this.ctx.createGain();

    screech.type = 'sawtooth';
    screech.frequency.setValueAtTime(850, now);
    screech.frequency.exponentialRampToValueAtTime(2200, now + 0.18);
    screech.frequency.exponentialRampToValueAtTime(350, now + 1.2);

    mod.type = 'sawtooth';
    mod.frequency.setValueAtTime(45, now);
    modGain.gain.setValueAtTime(600, now);

    mod.connect(screech.frequency);

    screechGain.gain.setValueAtTime(0.85, now);
    screechGain.gain.exponentialRampToValueAtTime(0.01, now + 1.4);

    screech.connect(screechGain);
    screechGain.connect(this.masterGain);

    mod.start(now);
    screech.start(now);
    mod.stop(now + 1.45);
    screech.stop(now + 1.45);

    // 2. Heavy blunt impact thud (Granny's bat hitting player)
    const impact = this.ctx.createOscillator();
    const impactGain = this.ctx.createGain();
    impact.type = 'triangle';
    impact.frequency.setValueAtTime(140, now);
    impact.frequency.exponentialRampToValueAtTime(20, now + 0.4);

    impactGain.gain.setValueAtTime(0.9, now);
    impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    impact.connect(impactGain);
    impactGain.connect(this.masterGain);

    impact.start(now);
    impact.stop(now + 0.52);
  }

  /**
   * Day transition gong / ominous bass chime
   */
  public playDayTransition() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 2.5);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 2.7);
  }

  /**
   * Flashlight switch click
   */
  public playFlashlightClick() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Item pickup sound
   */
  public playItemPickup() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  public cleanup() {
    this.stopAmbientDrone();
    if (this.heartbeatInterval !== null) {
      window.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export const horrorAudio = new HorrorAudioEngine();
