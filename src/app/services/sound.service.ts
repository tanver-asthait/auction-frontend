import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SoundService {
  private audioCtx: AudioContext | null = null;
  
  // Signal to control sound globally
  soundEnabled = signal<boolean>(true);

  constructor() {}

  /**
   * Lazily initialize AudioContext (browsers block early AudioContext creation)
   */
  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    
    // Resume context if suspended (common in browsers after user inactivity)
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    
    return this.audioCtx;
  }

  /**
   * Helper to play a quick synthesized tick at custom frequency
   */
  private playTickAtFreq(frequency: number, volume: number, duration: number): void {
    if (!this.soundEnabled()) return;
    
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.01);
    } catch (e) {
      console.warn('Failed to play audio:', e);
    }
  }

  /**
   * Helper to play a generic oscillator tone
   */
  private playTone(frequency: number, type: OscillatorType, volume: number, duration: number): void {
    if (!this.soundEnabled()) return;

    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.05);
    } catch (e) {
      console.warn('Failed to play audio:', e);
    }
  }

  /**
   * Toggle sound globally
   */
  toggleSound(): boolean {
    this.soundEnabled.update(enabled => !enabled);
    return this.soundEnabled();
  }

  /**
   * Play a clock tick (low, brief click)
   */
  playTick(): void {
    this.playTickAtFreq(600, 0.04, 0.04);
  }

  /**
   * Play an urgent countdown tick (dual click, higher pitch)
   */
  playUrgentTick(): void {
    this.playTickAtFreq(1000, 0.06, 0.04);
    setTimeout(() => {
      this.playTickAtFreq(900, 0.04, 0.03);
    }, 80);
  }

  /**
   * Play a bidding success chime (arpeggio of C major chord)
   */
  playChime(): void {
    if (!this.soundEnabled()) return;
    
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.08, 0.15);
      }, index * 70);
    });
  }

  /**
   * Play a wooden gavel strike sound (rapid double/triple knock)
   */
  playGavel(): void {
    if (!this.soundEnabled()) return;

    const playKnock = (delay: number, gainVal: number) => {
      setTimeout(() => {
        try {
          const ctx = this.getAudioContext();
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(140, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.1);
          
          gainNode.gain.setValueAtTime(gainVal, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
          
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.13);
        } catch (e) {
          console.warn('Failed to play knock:', e);
        }
      }, delay);
    };

    playKnock(0, 0.5);
    playKnock(100, 0.35);
    playKnock(200, 0.15);
  }

  /**
   * Play a triumphant fanfare when a player is sold
   */
  playSoldFanfare(): void {
    if (!this.soundEnabled()) return;

    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      
      const playNote = (freq: number, startDelay: number, duration: number, volume: number = 0.08) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        gainNode.gain.setValueAtTime(0.0001, now + startDelay);
        gainNode.gain.linearRampToValueAtTime(volume, now + startDelay + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + startDelay + duration);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(now + startDelay);
        osc.stop(now + startDelay + duration + 0.05);
      };

      // Triumphant rising arpeggio: C4 -> E4 -> G4 -> C5 chord
      playNote(261.63, 0.0, 0.15);    // C4
      playNote(329.63, 0.12, 0.15);   // E4
      playNote(392.00, 0.24, 0.15);   // G4
      
      // Final chord
      playNote(523.25, 0.36, 0.5, 0.08);   // C5
      playNote(659.25, 0.36, 0.5, 0.06);   // E5
      playNote(783.99, 0.36, 0.5, 0.06);   // G5
    } catch (e) {
      console.warn('Failed to play fanfare:', e);
    }
  }

  /**
   * Play an error buzzer sound
   */
  playError(): void {
    if (!this.soundEnabled()) return;

    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(70, ctx.currentTime + 0.22);
      
      gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.26);
    } catch (e) {
      console.warn('Failed to play error buzzer:', e);
    }
  }
}
