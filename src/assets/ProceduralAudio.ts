/**
 * Pure Web Audio API procedural sound synthesizer
 * Zero external audio dependencies - reproduces Diablo 1 Tristram guitar and dungeon soundscapes
 */
export class ProceduralAudio {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private currentTrack: 'NONE' | 'TOWN' | 'DUNGEON' = 'NONE';
  private musicInterval: number | null = null;

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio not supported or failed to initialize', e);
    }
  }

  public resumeContext(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(mute: boolean): void {
    this.isMuted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(mute ? 0 : 0.8, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  // ==========================================
  // Music Engines: Tristram & Dungeon Ambience
  // ==========================================

  public playMusic(track: 'TOWN' | 'DUNGEON'): void {
    this.init();
    if (this.currentTrack === track) return;
    this.stopMusic();
    this.currentTrack = track;

    if (track === 'TOWN') {
      this.startTristramTheme();
    } else if (track === 'DUNGEON') {
      this.startDungeonAmbience();
    }
  }

  public stopMusic(): void {
    if (this.musicInterval !== null) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentTrack = 'NONE';
  }

  /**
   * Matt Uelmen inspired Tristram acoustic 12-string guitar arpeggios
   * Key of D minor / D Dorian (D, E, F, G, A, B, C)
   */
  private startTristramTheme(): void {
    if (!this.ctx || !this.musicGain) return;

    // Guitar arpeggio sequence notes (frequencies in Hz)
    const D2 = 73.42;
    const A2 = 110.0;
    const D3 = 146.83;
    const F3 = 174.61;
    const G3 = 196.0;
    const A3 = 220.0;
    const C4 = 261.63;
    const D4 = 293.66;
    const E4 = 329.63;
    const F4 = 349.23;

    // Measures of fingerpicked arpeggios
    const phrases = [
      [D2, A2, D3, F3, A3, D4, F3, A3],
      [D2, A2, D3, G3, A3, E4, G3, A3],
      [D2, A2, C4, F3, A3, C4, F3, A3],
      [D2, A2, D3, F3, A3, D4, E4, F4]
    ];

    let phraseIdx = 0;
    let noteIdx = 0;

    const tick = () => {
      if (this.currentTrack !== 'TOWN' || !this.ctx || !this.musicGain) return;

      const currentPhrase = phrases[phraseIdx];
      const freq = currentPhrase[noteIdx];
      this.playGuitarPluck(freq, 0.4);

      // Low sustained bass on first note of phrase
      if (noteIdx === 0) {
        this.playGuitarPluck(freq * 0.5, 0.6, 2.5);
      }

      noteIdx++;
      if (noteIdx >= currentPhrase.length) {
        noteIdx = 0;
        phraseIdx = (phraseIdx + 1) % phrases.length;
      }
    };

    tick();
    this.musicInterval = window.setInterval(tick, 340);
  }

  /**
   * Dark subterranean ambient drone with occasional dripping sounds
   */
  private startDungeonAmbience(): void {
    if (!this.ctx || !this.musicGain) return;

    const playDungeonTones = () => {
      if (this.currentTrack !== 'DUNGEON' || !this.ctx || !this.musicGain) return;

      // Dark low resonant drone
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(45, t); // Sub-bass F#1 / D1
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(45.5, t); // Beating detune

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, t);
      filter.frequency.linearRampToValueAtTime(260, t + 4);
      filter.frequency.linearRampToValueAtTime(120, t + 8);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 2);
      gain.gain.linearRampToValueAtTime(0, t + 8);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(t);
      osc2.start(t);
      osc.stop(t + 8.1);
      osc2.stop(t + 8.1);

      // Random water drip
      if (Math.random() < 0.6) {
        window.setTimeout(() => this.playWaterDrip(), Math.random() * 4000);
      }
    };

    playDungeonTones();
    this.musicInterval = window.setInterval(playDungeonTones, 8000);
  }

  // ==========================================
  // Instrument Synthesizers
  // ==========================================

  private playGuitarPluck(freq: number, volume: number = 0.5, duration: number = 1.4): void {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, t);

    // Subtle 12-string octave or slight detune
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 1.003, t);

    // Pluck filter envelope
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + duration);

    // Fast attack, exponential decay
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume * 0.45, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration + 0.1);
    osc2.stop(t + duration + 0.1);
  }

  private playWaterDrip(): void {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = 1200 + Math.random() * 400;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.4, t + 0.08);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  // ==========================================
  // Sound Effects (SFX)
  // ==========================================

  public playSwordSwing(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.18);
    filter.Q.setValueAtTime(3.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
  }

  public playFleshHit(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  public playShieldBlock(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(650, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.22);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  public playBowShoot(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.12);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  public playBoneCrack(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    for (let i = 0; i < 3; i++) {
      const offset = i * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(320 - i * 50, t + offset);
      osc.frequency.exponentialRampToValueAtTime(80, t + offset + 0.05);

      gain.gain.setValueAtTime(0.35, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, t + offset + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + offset);
      osc.stop(t + offset + 0.06);
    }
  }

  public playPotionGulp(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, t);
    osc.frequency.linearRampToValueAtTime(520, t + 0.1);
    osc.frequency.linearRampToValueAtTime(280, t + 0.22);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.27);
  }

  public playGoldPickup(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const freqs = [1046.5, 1318.5]; // C6 and E6
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.3, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.22);
    });
  }

  public playSpellCast(type: 'FIRE' | 'LIGHTNING' | 'HOLY' | 'PORTAL'): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    if (type === 'FIRE') {
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, t);
      filter.frequency.linearRampToValueAtTime(1200, t + 0.1);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(t);
    } else if (type === 'PORTAL') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.linearRampToValueAtTime(880, t + 0.5);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.62);
    } else {
      // Holy / Lightning
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.28);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.3);
    }
  }

  public playLevelUp(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const chord = [293.66, 369.99, 440.0, 587.33]; // D Major chord

    chord.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.6);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 1.7);
    });
  }

  /**
   * Formant synthesized speech: "Ah, fresh meat!"
   */
  public playButcherCry(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Deep guttural roar
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(85, t);
    osc.frequency.linearRampToValueAtTime(65, t + 0.4);
    osc.frequency.linearRampToValueAtTime(95, t + 0.8);
    osc.frequency.linearRampToValueAtTime(50, t + 1.3);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.linearRampToValueAtTime(750, t + 0.5);
    filter.frequency.linearRampToValueAtTime(350, t + 1.3);
    filter.Q.setValueAtTime(4.0, t);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 1.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 1.35);
  }
}

export const soundManager = new ProceduralAudio();
