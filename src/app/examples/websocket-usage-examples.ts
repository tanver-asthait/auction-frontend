/**
 * WebSocket Service Usage Examples
 *
 * This file contains practical examples of how to use the WebSocketService
 * in different components (Admin, Team Owner, Public Viewer)
 */

import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { WebsocketService } from '../services/websocket.service';
import { Subscription } from 'rxjs';

// ============================================================================
// EXAMPLE 1: Admin Component
// ============================================================================

@Component({
  selector: 'app-admin-example',
  template: `
    <div>
      <h2>Admin Panel</h2>
      <button (click)="startAuction()">Start Auction</button>
      <button (click)="nextPlayer()">Next Player</button>

      <div *ngIf="currentPlayer">
        <h3>Current Player: {{ currentPlayer }}</h3>
        <p>Highest Bid: {{ highestBid }}</p>
        <p>Timer: {{ timer }}s</p>
      </div>
    </div>
  `,
})
export class AdminExampleComponent implements OnInit, OnDestroy {
  currentPlayer: string | null = null;
  highestBid: number = 0;
  timer: number = 0;
  private subscriptions: Subscription[] = [];

  constructor(private wsService: WebsocketService) {}

  ngOnInit(): void {
    // Connect to WebSocket
    this.wsService.connect();

    // Listen to auction state updates
    const stateSub = this.wsService.listenToState().subscribe((state) => {
      this.currentPlayer = state.currentPlayer?.name || null;
      this.highestBid = state.auctionState.highestBid;
    });

    // Listen to timer updates
    const timerSub = this.wsService.listenToTimer().subscribe((timer) => {
      this.timer = timer.timer;
    });

    this.subscriptions.push(stateSub, timerSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  startAuction(): void {
    this.wsService.startAuction();
  }

  nextPlayer(): void {
    this.wsService.nextPlayer();
  }
}

// ============================================================================
// EXAMPLE 2: Team Owner Component
// ============================================================================

@Component({
  selector: 'app-team-owner-example',
  template: `
    <div>
      <h2>Team Owner: {{ teamName }}</h2>

      <div class="player-info">
        <h3>{{ currentPlayerName }}</h3>
        <p>Current Bid: {{ currentBid }}</p>
        <p>Your Budget: {{ budget }}</p>
        <p>Timer: {{ timer }}s</p>
      </div>

      <button (click)="placeBid()" [disabled]="!canBid">Place Bid</button>
    </div>
  `,
})
export class TeamOwnerExampleComponent implements OnInit, OnDestroy {
  teamId: string = 'team-123'; // Get from route or auth service
  teamName: string = 'Eagles';
  budget: number = 100000;

  currentPlayerName: string = '';
  currentBid: number = 0;
  timer: number = 0;
  canBid: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(private wsService: WebsocketService) {}

  ngOnInit(): void {
    // Connect to WebSocket
    this.wsService.connect();

    // Listen to auction state
    const stateSub = this.wsService.listenToState().subscribe((state) => {
      this.currentPlayerName = state.currentPlayer?.name || '';
      this.currentBid = state.auctionState.highestBid;

      // Calculate if team can bid
      const nextBid = this.currentBid + 1000; // Increment amount
      this.canBid =
        state.auctionState.isRunning &&
        nextBid <= this.budget &&
        this.timer > 0;
    });

    // Listen to timer
    const timerSub = this.wsService.listenToTimer().subscribe((timer) => {
      this.timer = timer.timer;
    });

    // Listen to bid events
    const bidSub = this.wsService.bidPlaced$.subscribe((bid) => {
      console.log(`${bid.teamName} placed a bid of $${bid.bidAmount}`);
    });

    // Listen to player sold events
    const soldSub = this.wsService.playerSold$.subscribe((sold) => {
      console.log(
        `${sold.playerName} sold to ${sold.teamName} for $${sold.finalPrice}`
      );
      // Update budget if this team bought the player
      if (sold.teamId === this.teamId) {
        this.budget -= sold.finalPrice;
      }
    });

    this.subscriptions.push(stateSub, timerSub, bidSub, soldSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  placeBid(): void {
    this.wsService.sendBid(this.teamId);
  }
}

// ============================================================================
// EXAMPLE 3: Public Viewer Component
// ============================================================================

@Component({
  selector: 'app-public-viewer-example',
  template: `
    <div>
      <h2>Live Auction</h2>

      <div class="auction-status">
        <p>Status: {{ isRunning ? 'Active' : 'Paused' }}</p>
      </div>

      <div class="current-player" *ngIf="currentPlayer">
        <h3>{{ currentPlayer.name }}</h3>
        <p>Position: {{ currentPlayer.position }}</p>
        <p>Base Price: {{ currentPlayer.basePrice }}</p>
        <p>Current Bid: {{ currentBid }}</p>
        <p>Highest Bidder: {{ highestBidder }}</p>
        <p>Time Left: {{ timer }}s</p>
      </div>

      <div class="recent-bids">
        <h4>Recent Activity</h4>
        <ul>
          <li *ngFor="let event of recentEvents">{{ event }}</li>
        </ul>
      </div>
    </div>
  `,
})
export class PublicViewerExampleComponent implements OnInit, OnDestroy {
  isRunning: boolean = false;
  currentPlayer: any = null;
  currentBid: number = 0;
  highestBidder: string = '';
  timer: number = 0;
  recentEvents: string[] = [];

  private subscriptions: Subscription[] = [];

  constructor(private wsService: WebsocketService) {}

  ngOnInit(): void {
    // Connect to WebSocket
    this.wsService.connect();

    // Listen to auction state
    const stateSub = this.wsService.listenToState().subscribe((state) => {
      this.isRunning = state.auctionState.isRunning;
      this.currentPlayer = state.currentPlayer;
      this.currentBid = state.auctionState.highestBid;
      this.highestBidder = state.highestBidTeam?.name || 'None';
    });

    // Listen to timer
    const timerSub = this.wsService.listenToTimer().subscribe((timer) => {
      this.timer = timer.timer;
    });

    // Listen to auction started
    const startedSub = this.wsService.auctionStarted$.subscribe((started) => {
      this.addEvent(
        `Auction started for ${started.playerName} at $${started.basePrice}`
      );
    });

    // Listen to bids
    const bidSub = this.wsService.bidPlaced$.subscribe((bid) => {
      this.addEvent(`${bid.teamName} bid $${bid.bidAmount}`);
    });

    // Listen to player sold
    const soldSub = this.wsService.playerSold$.subscribe((sold) => {
      const message = sold.teamName
        ? `${sold.playerName} SOLD to ${sold.teamName} for $${sold.finalPrice}!`
        : `${sold.playerName} UNSOLD`;
      this.addEvent(message);
    });

    this.subscriptions.push(stateSub, timerSub, startedSub, bidSub, soldSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private addEvent(message: string): void {
    this.recentEvents.unshift(message);
    if (this.recentEvents.length > 10) {
      this.recentEvents.pop();
    }
  }
}

// ============================================================================
// EXAMPLE 4: Using Signals (Modern Angular)
// ============================================================================

@Component({
  selector: 'app-signals-example',
  template: `
    <div>
      <h2>Auction Monitor (with Signals)</h2>

      <!-- Connection Status (using signal from service) -->
      <p>Connected: {{ wsService.connected() ? '✅' : '❌' }}</p>

      <!-- Auction State -->
      <div *ngIf="auctionState()">
        <h3>{{ auctionState()?.currentPlayer?.name }}</h3>
        <p>Bid: {{ auctionState()?.auctionState.highestBid }}</p>
        <p>Timer: {{ currentTimer() }}s</p>
      </div>
    </div>
  `,
})
export class SignalsExampleComponent implements OnInit, OnDestroy {
  // Using signals for reactive state
  auctionState = signal<any>(null);
  currentTimer = signal<number>(0);

  private subscriptions: Subscription[] = [];

  constructor(public wsService: WebsocketService) {}

  ngOnInit(): void {
    this.wsService.connect();

    // Update signals from observables
    const stateSub = this.wsService.listenToState().subscribe((state) => {
      this.auctionState.set(state);
    });

    const timerSub = this.wsService.listenToTimer().subscribe((timer) => {
      this.currentTimer.set(timer.timer);
    });

    this.subscriptions.push(stateSub, timerSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

// ============================================================================
// USAGE SUMMARY
// ============================================================================

/**
 * Key Points:
 *
 * 1. CONNECTING:
 *    this.wsService.connect(); // Uses environment.wsUrl by default
 *
 * 2. LISTENING TO STATE:
 *    this.wsService.listenToState().subscribe(state => {
 *      // Handle auction state updates
 *    });
 *
 * 3. LISTENING TO TIMER:
 *    this.wsService.listenToTimer().subscribe(timer => {
 *      // Handle timer updates (fires every second)
 *    });
 *
 * 4. SENDING BID (Team Owner):
 *    this.wsService.sendBid(teamId);
 *
 * 5. START AUCTION (Admin):
 *    this.wsService.startAuction();
 *
 * 6. NEXT PLAYER (Admin):
 *    this.wsService.nextPlayer();
 *
 * 7. OTHER EVENTS:
 *    - this.wsService.bidPlaced$ - Observable of bid events
 *    - this.wsService.playerSold$ - Observable of player sold events
 *    - this.wsService.auctionStarted$ - Observable of auction started events
 *
 * 8. CONNECTION STATUS:
 *    - this.wsService.connected() - Signal for connection status
 *    - this.wsService.error() - Signal for error messages
 *    - this.wsService.isConnected() - Method to check connection
 *
 * 9. CLEANUP:
 *    Always unsubscribe in ngOnDestroy() to prevent memory leaks
 */
