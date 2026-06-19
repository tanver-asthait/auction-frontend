import { Injectable, signal } from '@angular/core';
import confetti from 'canvas-confetti';

@Injectable({
  providedIn: 'root',
})
export class CelebrationService {
  // Signals for visual overlay triggers
  gavelActive = signal<boolean>(false);
  gavelText = signal<string>('');
  
  // Track if a bidding war is active
  biddingWarActive = signal<boolean>(false);
  private biddingWarTimeout: any = null;

  constructor() {}

  /**
   * Fire a confetti burst celebration
   */
  triggerConfetti(): void {
    // Left side burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.1, y: 0.8 },
      colors: ['#ffd700', '#ff007f', '#00e1d9', '#a200ff', '#28a745']
    });
    
    // Right side burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.9, y: 0.8 },
      colors: ['#ffd700', '#ff007f', '#00e1d9', '#a200ff', '#28a745']
    });

    // Middle fireworks
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 90,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
      });
    }, 250);
  }

  /**
   * Trigger the full-screen gavel strike animation overlay
   */
  triggerGavel(text: string): void {
    this.gavelText.set(text);
    this.gavelActive.set(true);

    setTimeout(() => {
      this.gavelActive.set(false);
    }, 2500); // Overlay duration
  }

  /**
   * Activate bidding war mode (CSS indicators, faster timer visual, etc.)
   */
  triggerBiddingWar(): void {
    if (this.biddingWarTimeout) {
      clearTimeout(this.biddingWarTimeout);
    }
    
    this.biddingWarActive.set(true);
    
    // Reset after 8 seconds of no bidding activity
    this.biddingWarTimeout = setTimeout(() => {
      this.biddingWarActive.set(false);
    }, 8000);
  }

  /**
   * Deactivate bidding war mode
   */
  stopBiddingWar(): void {
    if (this.biddingWarTimeout) {
      clearTimeout(this.biddingWarTimeout);
    }
    this.biddingWarActive.set(false);
  }
}
