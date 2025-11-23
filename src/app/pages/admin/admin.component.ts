import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { WebsocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';
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
  // Signals for reactive state
  currentPlayer = signal<Player | null>(null);
  highestBid = signal<number>(0);
  highestBidder = signal<string>('None');
  timer = signal<number>(0);
  isRunning = signal<boolean>(false);

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(public wsService: WebsocketService, private http: HttpClient) {}

  ngOnInit(): void {
    // Connect to WebSocket
    this.wsService.connect();

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
      },
      error: (err) => {
        console.error('State subscription error:', err);
      },
    });

    // Listen to timer updates
    const timerSub = this.wsService.listenToTimer().subscribe({
      next: (timerUpdate) => {
        this.timer.set(timerUpdate.timer);
      },
      error: (err) => {
        console.error('Timer subscription error:', err);
      },
    });

    // Listen to bid placed events
    const bidSub = this.wsService.bidPlaced$.subscribe({
      next: (bid) => {
        console.log(`Bid placed: ${bid.teamName} - $${bid.bidAmount}`);
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
      },
    });

    // Listen to auction started events
    const startedSub = this.wsService.auctionStarted$.subscribe({
      next: (event) => {
        console.log('✅ Auction started!', event);
        alert(
          `Auction started! First player: ${event.playerName} (Base: $${event.basePrice})`
        );
      },
    });

    // Listen to auction ended events
    const endedSub = this.wsService.auctionEnded$.subscribe({
      next: (event) => {
        console.log('🏁 Auction ended!', event);
        alert('Auction has ended!');
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
    this.wsService.sellPlayer();
  }
}
