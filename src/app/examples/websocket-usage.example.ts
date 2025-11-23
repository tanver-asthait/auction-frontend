import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { WebsocketService } from '../services/websocket.service';
import {
  AuctionStateUpdate,
  TimerUpdate,
  BidPlacedEvent,
  PlayerSoldEvent,
} from '../models/auction.model';

/**
 * Example component demonstrating WebSocket service usage
 *
 * This component shows how to:
 * - Connect to WebSocket server
 * - Listen to auction state updates
 * - Listen to timer updates
 * - Send bids
 * - Start auction (admin)
 * - Move to next player (admin)
 */
@Component({
  selector: 'app-websocket-usage-example',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="websocket-example">
      <h2>WebSocket Service Usage Example</h2>

      <!-- Connection Status -->
      <div class="connection-status">
        <h3>Connection Status</h3>
        <p>Connected: {{ wsService.connected() ? 'Yes' : 'No' }}</p>
        <p>Error: {{ wsService.error() || 'None' }}</p>
        <button (click)="connect()" [disabled]="wsService.connected()">
          Connect
        </button>
        <button (click)="disconnect()" [disabled]="!wsService.connected()">
          Disconnect
        </button>
      </div>

      <!-- Current Auction State -->
      <div class="auction-state" *ngIf="currentState()">
        <h3>Current Auction State</h3>
        <p>
          Running: {{ currentState()?.auctionState.isRunning ? 'Yes' : 'No' }}
        </p>
        <p>
          Current Player: {{ currentState()?.currentPlayer?.name || 'None' }}
        </p>
        <p>
          Highest Bid:
          {{ '$' + (currentState()?.auctionState.highestBid || 0) }}
        </p>
        <p>
          Highest Bidder: {{ currentState()?.highestBidTeam?.name || 'None' }}
        </p>
        <p>Timer: {{ currentTimer() }}s</p>
      </div>

      <!-- Admin Controls -->
      <div class="admin-controls">
        <h3>Admin Controls</h3>
        <button (click)="startAuction()" [disabled]="!wsService.connected()">
          Start Auction
        </button>
        <button (click)="nextPlayer()" [disabled]="!wsService.connected()">
          Next Player
        </button>
      </div>

      <!-- Team Owner Controls -->
      <div class="team-controls">
        <h3>Team Owner Controls</h3>
        <input
          type="text"
          [(ngModel)]="teamId"
          placeholder="Enter your team ID"
        />
        <button
          (click)="placeBid()"
          [disabled]="!wsService.connected() || !teamId"
        >
          Place Bid
        </button>
      </div>

      <!-- Recent Events -->
      <div class="events">
        <h3>Recent Events</h3>
        <div class="event-list">
          <div *ngFor="let event of recentEvents()" class="event">
            {{ event }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .websocket-example {
        padding: 20px;
        font-family: Arial, sans-serif;
      }

      .connection-status,
      .auction-state,
      .admin-controls,
      .team-controls,
      .events {
        margin: 20px 0;
        padding: 15px;
        border: 1px solid #ddd;
        border-radius: 5px;
      }

      h2 {
        color: #333;
      }

      h3 {
        color: #666;
        margin-top: 0;
      }

      button {
        padding: 8px 16px;
        margin: 5px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }

      button:hover:not(:disabled) {
        background-color: #0056b3;
      }

      input {
        padding: 8px;
        margin: 5px;
        border: 1px solid #ddd;
        border-radius: 4px;
        width: 200px;
      }

      .event-list {
        max-height: 200px;
        overflow-y: auto;
      }

      .event {
        padding: 5px;
        margin: 5px 0;
        background-color: #f8f9fa;
        border-left: 3px solid #007bff;
      }
    `,
  ],
})
export class WebsocketUsageExampleComponent implements OnInit, OnDestroy {
  // Signals for reactive state
  currentState = signal<AuctionStateUpdate | null>(null);
  currentTimer = signal<number>(0);
  recentEvents = signal<string[]>([]);

  // Team ID for placing bids
  teamId: string = '';

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(public wsService: WebsocketService) {}

  ngOnInit(): void {
    // Auto-connect on component init
    this.connect();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    this.wsService.connect();
    this.addEvent('Connecting to WebSocket server...');
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.wsService.disconnect();
    this.addEvent('Disconnected from WebSocket server');
  }

  /**
   * Setup subscriptions to WebSocket events
   */
  private setupSubscriptions(): void {
    // Listen to auction state updates
    const stateSub = this.wsService.listenToState().subscribe({
      next: (state: AuctionStateUpdate) => {
        this.currentState.set(state);
        this.addEvent(
          `State updated: Player ${state.currentPlayer?.name || 'None'}`
        );
      },
      error: (err) => {
        console.error('State subscription error:', err);
        this.addEvent(`Error: ${err.message}`);
      },
    });

    // Listen to timer updates
    const timerSub = this.wsService.listenToTimer().subscribe({
      next: (timer: TimerUpdate) => {
        this.currentTimer.set(timer.timer);
      },
      error: (err) => {
        console.error('Timer subscription error:', err);
      },
    });

    // Listen to bid placed events
    const bidSub = this.wsService.bidPlaced$.subscribe({
      next: (bid: BidPlacedEvent) => {
        this.addEvent(`${bid.teamName} bid $${bid.bidAmount}`);
      },
      error: (err) => {
        console.error('Bid subscription error:', err);
      },
    });

    // Listen to player sold events
    const soldSub = this.wsService.playerSold$.subscribe({
      next: (sold: PlayerSoldEvent) => {
        this.addEvent(
          `${sold.playerName} sold to ${sold.teamName || 'No one'} for $${
            sold.finalPrice
          }`
        );
      },
      error: (err) => {
        console.error('Sold subscription error:', err);
      },
    });

    // Listen to auction started events
    const startedSub = this.wsService.auctionStarted$.subscribe({
      next: (started) => {
        this.addEvent(`Auction started for ${started.playerName}`);
      },
      error: (err) => {
        console.error('Started subscription error:', err);
      },
    });

    // Store subscriptions for cleanup
    this.subscriptions.push(stateSub, timerSub, bidSub, soldSub, startedSub);
  }

  /**
   * Place a bid (Team Owner action)
   */
  placeBid(): void {
    if (!this.teamId) {
      alert('Please enter your team ID');
      return;
    }

    this.wsService.sendBid(this.teamId);
    this.addEvent(`Bid placed by team ${this.teamId}`);
  }

  /**
   * Start the auction (Admin action)
   */
  startAuction(): void {
    this.wsService.startAuction();
    this.addEvent('Start auction command sent');
  }

  /**
   * Move to next player (Admin action)
   */
  nextPlayer(): void {
    this.wsService.nextPlayer();
    this.addEvent('Next player command sent');
  }

  /**
   * Add an event to the recent events list
   */
  private addEvent(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const events = [...this.recentEvents()];
    events.unshift(`[${timestamp}] ${message}`);

    // Keep only last 10 events
    if (events.length > 10) {
      events.pop();
    }

    this.recentEvents.set(events);
  }
}
