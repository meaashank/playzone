/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private static ctx: AudioContext | null = null;
  private static masterGain: GainNode | null = null;
  private static sfxVolume = 0.5;
  private static musicVolume = 0.25;
  
  // Settings flags
  private static sfxEnabled = true;
  private static musicEnabled = true;

  // Music nodes
  private static musicIntervalId: number | null = null;
  private static isMusicPlaying = false;
  private static lastNoteTime = 0;

  private static getContext(): AudioContext | null {
    if (!this.ctx) {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        
        // Setup master compressor to avoid clipping/distortion when multiple SFX play
        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-15, this.ctx.currentTime);
        compressor.knee.setValueAtTime(30, this.ctx.currentTime);
        compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
        compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        compressor.release.setValueAtTime(0.08, this.ctx.currentTime);
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        
        compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    return this.ctx;
  }

  // Update sound settings dynamically
  static configure(sfxEnabled: boolean, musicEnabled: boolean) {
    this.sfxEnabled = sfxEnabled;
    this.musicEnabled = musicEnabled;
    
    if (!musicEnabled) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  // Random pitch helper (±2-5% parameter)
  private static randomizePitch(freq: number, percentage = 0.04): number {
    const factor = 1 + (Math.random() * 2 - 1) * percentage;
    return freq * factor;
  }

  // Plays a synthesized sound effect based on the trigger type
  static play(
    type:
      | 'click'
      | 'back'
      | 'toggle_on'
      | 'toggle_off'
      | 'popup_open'
      | 'popup_close'
      | 'toast'
      | 'level_up'
      | 'coin'
      | 'achievement'
      | 'error'
      | 'dice_roll'
      | 'dice_land'
      | 'piece_move'
      | 'safe_star'
      | 'kill_opponent'
      | 'win'
      | 'lose'
      | 'tictactoe_x'
      | 'tictactoe_o'
      | 'snake_eat'
      | 'snake_boost'
      | 'snake_crash'
  ) {
    if (!this.sfxEnabled) return;
    
    const ctx = this.getContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    
    try {
      switch (type) {
        case 'click': {
          // Sharp, modern organic bubble click
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(this.randomizePitch(800), now);
          osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
          
          gainNode.gain.setValueAtTime(this.sfxVolume * 0.4, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          
          osc.connect(gainNode);
          if (this.masterGain) gainNode.connect(this.masterGain);
          
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }

        case 'back': {
          // Sliding downward note for back action
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(this.randomizePitch(450), now);
          osc.frequency.linearRampToValueAtTime(200, now + 0.12);
          
          gainNode.gain.setValueAtTime(this.sfxVolume * 0.35, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          
          osc.connect(gainNode);
          if (this.masterGain) gainNode.connect(this.masterGain);
          
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }

        case 'toggle_on': {
          // Double snappy chirps going up
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(this.randomizePitch(500), now);
          osc1.frequency.setValueAtTime(750, now + 0.04);

          gainNode.gain.setValueAtTime(this.sfxVolume * 0.3, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc1.connect(gainNode);
          if (this.masterGain) gainNode.connect(this.masterGain);

          osc1.start(now);
          osc1.stop(now + 0.12);
          break;
        }

        case 'toggle_off': {
          // Double snappy chirps going down
          const osc1 = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(this.randomizePitch(700), now);
          osc1.frequency.setValueAtTime(450, now + 0.04);

          gainNode.gain.setValueAtTime(this.sfxVolume * 0.3, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc1.connect(gainNode);
          if (this.masterGain) gainNode.connect(this.masterGain);

          osc1.start(now);
          osc1.stop(now + 0.12);
          break;
        }

        case 'popup_open': {
          // High chime swooping up
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(this.randomizePitch(380), now);
          osc.frequency.exponentialRampToValueAtTime(1100, now + 0.18);
          
          gainNode.gain.setValueAtTime(this.sfxVolume * 0.2, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          
          osc.connect(gainNode);
          if (this.masterGain) gainNode.connect(this.masterGain);
          
          osc.start(now);
          osc.stop(now + 0.18);
          break;
        }

        case 'popup_close': {
          // Soft sound swooping down
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(this.randomizePitch(900), now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
          
          gainNode.gain.setValueAtTime(this.sfxVolume * 0.2, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          
          osc.connect(gainNode);
          if (this.masterGain) gainNode.connect(this.masterGain);
          
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }

        case 'toast': {
          // Sparkly notifications
          [523.25, 659.25, 783.99].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);
            
            gainNode.gain.setValueAtTime(this.sfxVolume * 0.18, now + idx * 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);
            
            osc.connect(gainNode);
            if (this.masterGain) gainNode.connect(this.masterGain);
            
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.25);
          });
          break;
        }

        case 'level_up': {
          // Celebratory arpeggio chord
          [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);
            
            gainNode.gain.setValueAtTime(this.sfxVolume * 0.25, now + idx * 0.06);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);
            
            osc.connect(gainNode);
            if (this.masterGain) gainNode.connect(this.masterGain);
            
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.35);
          });
          break;
        }

        case 'coin': {
          // Classic Nintendo arcade coin pickup (two quick high notes)
          const playNote = (freq: number, startDelay: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(this.randomizePitch(freq, 0.02), now + startDelay);
            
            gainNode.gain.setValueAtTime(this.sfxVolume * 0.22, now + startDelay);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + startDelay + duration);
            
            osc.connect(gainNode);
            if (this.masterGain) gainNode.connect(this.masterGain);
            
            osc.start(now + startDelay);
            osc.stop(now + startDelay + duration);
          };
          
          playNote(987.77, 0, 0.08); // B5
          playNote(1318.51, 0.08, 0.28); // E6
          break;
        }

        case 'achievement': {
          // Shiny glorious bells ascending
          [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.04);
            
            gainNode.gain.setValueAtTime(this.sfxVolume * 0.15, now + idx * 0.04);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.3);
            
            osc.connect(gainNode);
            if (this.masterGain) gainNode.connect(this.masterGain);
            
            osc.start(now + idx * 0.04);
            osc.stop(now + idx * 0.04 + 0.3);
          });
          break;
        }

        case 'error': {
          // Negative buzzer
          [130, 128].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.02);
            
            gainNode.gain.setValueAtTime(this.sfxVolume * 0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            
            osc.connect(gainNode);
            if (this.masterGain) gainNode.connect(this.masterGain);
            
            osc.start(now);
            osc.stop(now + 0.25);
          });
          break;
        }

        case 'dice_roll': {
          // Rapid organic clicks for dice tumbling
          for (let i = 0; i < 6; i++) {
            const delay = i * 0.07;
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(this.randomizePitch(220 + i * 80, 0.05), now + delay);
            
            gainNode.gain.setValueAtTime(this.sfxVolume * 0.18, now + delay);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);
            
            osc.connect(gainNode);
            if (this.masterGain) gainNode.connect(this.masterGain);
            
            osc.start(now + delay);
            osc.stop(now + delay + 0.06);
          }
          break;
        }

        case 'dice_land': {
          // Warm wood pop
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(this.randomizePitch(330), now);
          osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
          
          gainNode.gain.setValueAtTime(this.sfxVolume * 0.45, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          
          osc.connect(gainNode);
          if (this.masterGain) gainNode.connect(this.masterGain);
          
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }

        case 'piece_move': {
          // Springs or steps
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(this.randomizePitch(300), now);
          osc.frequency.exponentialRampToValueAtTime(620, now + 0.1);
          
          gainNode.gain.setValueAtTime(this.sfxVolume * 0.35, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          
          osc.connect(gainNode);
          if (this.masterGain) gainNode.connect(this.masterGain);
          
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        }

        case 'safe_star': {
          // Glimmering chime
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(this.randomizePitch(1200, 0.02), now);
          osc.frequency.setValueAtTime(1600, now + 0.05);
          
          gainNode.gain.setValueAtTime(this.sfxVolume * 0.25, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          
          osc.connect(gainNode);
          if (this.masterGain) gainNode.connect(this.masterGain);
          
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }

        case 'kill_opponent': {
          // Heavy explosive retro crash
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(this.randomizePitch(180), now);
          osc.frequency.linearRampToValueAtTime(40, now + 0.4);
          
          gainNode.gain.setValueAtTime(this.sfxVolume * 0.6, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          
          osc.connect(gainNode);
          if (this.masterGain) gainNode.connect(this.masterGain);
          
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        }

        case 'win': {
          // Majestic triumphant melody
          [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            
            gainNode.gain.setValueAtTime(this.sfxVolume * 0.35, now + idx * 0.08);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
            
            osc.connect(gainNode);
            if (this.masterGain) gainNode.connect(this.masterGain);
            
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.4);
          });
          break;
        }

        case 'lose': {
          // Sad descending melody
          [587.33, 523.25, 493.88, 440.00, 349.23].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);
            
            gainNode.gain.setValueAtTime(this.sfxVolume * 0.3, now + idx * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
            
            osc.connect(gainNode);
            if (this.masterGain) gainNode.connect(this.masterGain);
            
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.35);
          });
          break;
        }

        case 'tictactoe_x': {
          // Warm woodblock marimba G note
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(this.randomizePitch(392.00), now); // G4
          
          gainNode.gain.setValueAtTime(this.sfxVolume * 0.35, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          
          osc.connect(gainNode);
          if (this.masterGain) gainNode.connect(this.masterGain);
          
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }

        case 'tictactoe_o': {
          // Warm woodblock marimba C note
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(this.randomizePitch(523.25), now); // C5
          
          gainNode.gain.setValueAtTime(this.sfxVolume * 0.35, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          
          osc.connect(gainNode);
          if (this.masterGain) gainNode.connect(this.masterGain);
          
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }

        case 'snake_eat': {
          // Juicy sparkling high-note chime chord
          [659.25, 880.00].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(this.randomizePitch(freq, 0.03), now + idx * 0.05);
            
            gainNode.gain.setValueAtTime(this.sfxVolume * 0.22, now + idx * 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.18);
            
            osc.connect(gainNode);
            if (this.masterGain) gainNode.connect(this.masterGain);
            
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.18);
          });
          break;
        }

        case 'snake_boost': {
          // Revving triangle sweep
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(this.randomizePitch(160), now);
          osc.frequency.exponentialRampToValueAtTime(380, now + 0.1);
          
          gainNode.gain.setValueAtTime(this.sfxVolume * 0.25, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          
          osc.connect(gainNode);
          if (this.masterGain) gainNode.connect(this.masterGain);
          
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        }

        case 'snake_crash': {
          // Detuned explosion for collision
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(this.randomizePitch(120), now);
          osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
          
          gainNode.gain.setValueAtTime(this.sfxVolume * 0.5, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          
          osc.connect(gainNode);
          if (this.masterGain) gainNode.connect(this.masterGain);
          
          osc.start(now);
          osc.stop(now + 0.35);
          break;
        }
      }
    } catch (e) {
      console.warn('Playback error:', e);
    }
  }

  // Starts the procedural ambient background music loops
  static startMusic() {
    if (!this.musicEnabled || this.isMusicPlaying) return;
    
    const ctx = this.getContext();
    if (!ctx) return;
    
    this.isMusicPlaying = true;
    
    // Ambient rhythmic sequence (chords / soft synth)
    const notes = [
      [196.00, 246.94, 293.66], // G Major triad (soft chord)
      [164.81, 196.00, 246.94], // E minor triad
      [220.00, 261.63, 329.63], // A minor triad
      [174.61, 220.00, 261.63]  // F Major triad
    ];
    let chordIndex = 0;
    
    const playAmbientChord = () => {
      const now = ctx.currentTime;
      const currentChord = notes[chordIndex];
      
      currentChord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'sine';
        // Gentle detuning to make it sound warm and rich
        osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 1, now);
        
        // Exquisite ambient volume dynamics
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.musicVolume * 0.12, now + 1.2);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 3.8);
        
        osc.connect(gainNode);
        if (this.masterGain) gainNode.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 4.0);
      });

      // Play a soft bell-like high melody note synchronously
      const melodyFreqs = [523.25, 587.33, 659.25, 783.99, 880.00];
      const selectedMelody = melodyFreqs[Math.floor(Math.random() * melodyFreqs.length)];
      
      const melOsc = ctx.createOscillator();
      const melGain = ctx.createGain();
      melOsc.type = 'sine';
      melOsc.frequency.setValueAtTime(selectedMelody, now + 1.0);
      
      melGain.gain.setValueAtTime(0, now + 1.0);
      melGain.gain.linearRampToValueAtTime(this.musicVolume * 0.14, now + 1.2);
      melGain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
      
      melOsc.connect(melGain);
      if (this.masterGain) melGain.connect(this.masterGain);
      
      melOsc.start(now + 1.0);
      melOsc.stop(now + 4.0);
      
      chordIndex = (chordIndex + 1) % notes.length;
    };
    
    // Initial chord trigger
    playAmbientChord();
    
    // Clean up existing loops if any
    if (this.musicIntervalId) {
      clearInterval(this.musicIntervalId);
    }
    
    // Rhythmical interval of 4 seconds
    this.musicIntervalId = setInterval(() => {
      if (this.musicEnabled && this.ctx && this.ctx.state !== 'suspended') {
        playAmbientChord();
      }
    }, 4000) as unknown as number;
  }

  // Stops background music loop
  static stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicIntervalId) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }
}

export default SoundEngine;
