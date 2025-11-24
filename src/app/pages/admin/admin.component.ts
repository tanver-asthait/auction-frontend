import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { WebsocketService } from '../../services/websocket.service';
import { Subscription, interval } from 'rxjs';
import { Player, PlayerStatus } from '../../models/player.model';
import { Team } from '../../models/team.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit, OnDestroy {
  // Enhanced signals for reactive state
  currentPlayer = signal<Player | null>(null);
  highestBid = signal<number>(0);
  highestBidder = signal<string>('None');
  timer = signal<number>(0);
  isRunning = signal<boolean>(false);
  lastSoldInfo = signal<string>('');
  
  // New enhanced state
  totalPlayers = signal<number>(0);
  soldPlayers = signal<number>(0);
  remainingPlayers = signal<number>(0);
  totalRevenue = signal<number>(0);
  teams = signal<Team[]>([]);
  recentBids = signal<any[]>([]);
  auctionStartTime = signal<Date | null>(null);
  currentDateTime = signal<string>('');

  // Animation states
  timerPulse = signal<boolean>(false);
  newBidAnimation = signal<boolean>(false);

  // Expose Math for template
  Math = Math;

  // Subscriptions
  private subscriptions: Subscription[] = [];
  private clockInterval?: any;

  constructor(public wsService: WebsocketService, private http: HttpClient) {}

  ngOnInit(): void {
    // Connect to WebSocket
    this.wsService.connect();
    
    // Start clock
    this.startClock();
    
    // Load initial data
    this.loadTeams();
    this.loadPlayerStats();

    // Listen to auction state updates
    const stateSub = this.wsService.listenToState().subscribe({
      next: (state: any) => {
        // Backend sends flat structure, not nested
        // Handle both formats for compatibility
        const isNested = !!state.auctionState;

        this.currentPlayer.set(state.currentPlayer);

        if (isNested) {
          this.highestBid.set(state.auctionState?.highestBid || 0);
          this.highestBidder.set(state.highestBidTeam?.name || 'None');
          this.isRunning.set(state.auctionState?.isRunning || false);
          this.timer.set(state.auctionState?.timer || 0);
        } else {
          // Flat format (what backend actually sends)
          this.highestBid.set(state.highestBid || 0);
          this.highestBidder.set(state.highestBidTeam?.name || 'None');
          this.isRunning.set(state.isRunning || false);
          this.timer.set(state.timer || 0);
        }
        
        // Trigger timer pulse animation when timer changes
        this.triggerTimerPulse();
      },
      error: (err) => {
        console.error('State subscription error:', err);
      },
    });

    // Listen to timer updates
    const timerSub = this.wsService.listenToTimer().subscribe({
      next: (timerUpdate) => {
        this.timer.set(timerUpdate.timer);
        this.triggerTimerPulse();
      },
      error: (err) => {
        console.error('Timer subscription error:', err);
      },
    });

    // Listen to bid placed events
    const bidSub = this.wsService.bidPlaced$.subscribe({
      next: (bid) => {
        console.log(`Bid placed: ${bid.teamName} - $${bid.bidAmount}`);
        
        // Add to recent bids
        this.recentBids.update(bids => [
          { ...bid, timestamp: new Date() },
          ...bids.slice(0, 4) // Keep only last 5 bids
        ]);
        
        // Trigger new bid animation
        this.triggerBidAnimation();
      },
    });

    // Listen to player sold events
    const soldSub = this.wsService.playerSold$.subscribe({
      next: (sold) => {
        console.log(
          `Player sold: ${sold.playerName} to ${
            sold.teamName || 'No one'
          } for $${sold.finalPrice}`
        );

        // Update UI with sold information
        if (sold.teamName) {
          const message = `✅ ${sold.playerName} SOLD to ${sold.teamName} for $${sold.finalPrice}`;
          this.lastSoldInfo.set(message);
          
          // Update revenue
          this.totalRevenue.update(rev => rev + (sold.finalPrice || 0));
        } else {
          const message = `❌ ${sold.playerName} UNSOLD (No bids)`;
          this.lastSoldInfo.set(message);
        }

        // Refresh stats
        this.loadPlayerStats();

        // Clear the sold info after 8 seconds
        setTimeout(() => {
          this.lastSoldInfo.set('');
        }, 8000);
      },
    });

    // Listen to auction started events
    const startedSub = this.wsService.auctionStarted$.subscribe({
      next: (event) => {
        console.log('✅ Auction started!', event);
        this.auctionStartTime.set(new Date());
      },
    });

    // Listen to auction ended events
    const endedSub = this.wsService.auctionEnded$.subscribe({
      next: (event) => {
        console.log('🏁 Auction ended!', event);
        this.auctionStartTime.set(null);
      },
    });

    // Store subscriptions
    this.subscriptions.push(
      stateSub,
      timerSub,
      bidSub,
      soldSub,
      startedSub,
      endedSub
    );
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    
    // Clear clock interval
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  private startClock(): void {
    this.updateCurrentTime();
    this.clockInterval = setInterval(() => {
      this.updateCurrentTime();
    }, 1000);
  }

  private updateCurrentTime(): void {
    const now = new Date();
    this.currentDateTime.set(now.toLocaleString());
  }

  private loadTeams(): void {
    this.http.get<Team[]>(`${environment.apiUrl}/teams`).subscribe({
      next: (teams) => {
        this.teams.set(teams);
      },
      error: (err) => {
        console.error('Failed to load teams:', err);
      }
    });
  }

  private loadPlayerStats(): void {
    this.http.get<Player[]>(`${environment.apiUrl}/players`).subscribe({
      next: (players) => {
        const total = players.length;
        const sold = players.filter(p => p.status === PlayerStatus.SOLD).length;
        const remaining = players.filter(p => p.status === PlayerStatus.PENDING).length;
        
        this.totalPlayers.set(total);
        this.soldPlayers.set(sold);
        this.remainingPlayers.set(remaining);
        
        // Calculate total revenue
        const revenue = players
          .filter(p => p.status === PlayerStatus.SOLD && p.finalPrice)
          .reduce((sum, p) => sum + (p.finalPrice || 0), 0);
        this.totalRevenue.set(revenue);
      },
      error: (err) => {
        console.error('Failed to load player stats:', err);
      }
    });
  }

  private triggerTimerPulse(): void {
    this.timerPulse.set(true);
    setTimeout(() => this.timerPulse.set(false), 300);
  }

  private triggerBidAnimation(): void {
    this.newBidAnimation.set(true);
    setTimeout(() => this.newBidAnimation.set(false), 600);
  }

  // Utility methods
  getTimerColor(): string {
    const time = this.timer();
    if (time <= 10) return '#dc3545'; // Red
    if (time <= 30) return '#fd7e14'; // Orange
    return '#28a745'; // Green
  }

  getTimerDisplay(): string {
    const time = this.timer();
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getProgressPercentage(): number {
    if (this.totalPlayers() === 0) return 0;
    return (this.soldPlayers() / this.totalPlayers()) * 100;
  }

  getAuctionDuration(): string {
    if (!this.auctionStartTime()) return '--';
    const start = this.auctionStartTime()!;
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getPositionArray(position: string): string[] {
    return position ? position.split(',').map(p => p.trim()) : [];
  }

  /**
   * Start the auction
   */
  startAuction(): void {
    console.log('🚀 Admin: Starting auction...');
    console.log('WebSocket connected:', this.wsService.connected());

    // Fetch the first unsold player from the API
    this.http.get<Player[]>(`${environment.apiUrl}/players`).subscribe({
      next: (players) => {
        // Find first player that is 'pending' (not sold yet)
        const firstUnsoldPlayer = players.find(
          (p) => p.status === PlayerStatus.PENDING
        );

        if (!firstUnsoldPlayer) {
          alert('❌ No unsold players found! Please add players first.');
          console.error('No unsold players available');
          return;
        }

        console.log(
          'Found first unsold player:',
          firstUnsoldPlayer.name,
          firstUnsoldPlayer._id
        );
        console.log(
          '📤 Sending startAuction event with playerId:',
          firstUnsoldPlayer._id
        );

        // Start auction with the first player's ID
        this.wsService.startAuction(firstUnsoldPlayer._id);
      },
      error: (err) => {
        console.error('Failed to fetch players:', err);
        alert('❌ Failed to load players. Check console for details.');
      },
    });
  }

  /**
   * Move to the next player
   */
  nextPlayer(): void {
    this.wsService.nextPlayer();
  }

  /**
   * Sell current player
   */
  sellPlayer(): void {
    const currentPlayerId = this.currentPlayer()?._id;
    if (!currentPlayerId) {
      alert('❌ No player currently in auction!');
      return;
    }
    console.log('🔨 Selling player:', currentPlayerId);
    this.wsService.sellPlayer(currentPlayerId);
  }
}
