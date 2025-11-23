import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WebsocketService } from './websocket.service';
import { 
  AuctionState, 
  AuctionStateUpdate, 
  TimerUpdate, 
  BidDto,
  BidPlacedEvent,
  PlayerSoldEvent,
  AuctionStartedEvent,
  AuctionEndedEvent,
  AuctionErrorEvent
} from '../models/auction.model';
import { Player } from '../models/player.model';
import { Team } from '../models/team.model';

@Injectable({
  providedIn: 'root'
})
export class AuctionService {
  private apiUrl = 'http://localhost:3000/auction';
  private ws = inject(WebsocketService);
  private http = inject(HttpClient);
  
  // Auction state signals
  auctionState = signal<AuctionState | null>(null);
  currentPlayer = signal<Player | null>(null);
  highestBidTeam = signal<Team | null>(null);
  timer = signal<number>(0);
  isRunning = signal<boolean>(false);
  
  // Event signals
  lastBid = signal<BidPlacedEvent | null>(null);
  lastSale = signal<PlayerSoldEvent | null>(null);
  lastError = signal<string | null>(null);
  
  // Loading state
  loading = signal<boolean>(false);

  constructor() {
    this.setupWebSocketListeners();
  }

  // Initialize WebSocket connection
  connect(): void {
    this.ws.connect();
  }

  // Disconnect WebSocket
  disconnect(): void {
    this.ws.disconnect();
  }

  // Setup all WebSocket event listeners
  private setupWebSocketListeners(): void {
    // State updates
    this.ws.on<AuctionStateUpdate>('stateUpdate', (data) => {
      this.auctionState.set(data.auctionState);
      this.currentPlayer.set(data.currentPlayer);
      this.highestBidTeam.set(data.highestBidTeam);
      this.timer.set(data.auctionState.timer);
      this.isRunning.set(data.auctionState.isRunning);
    });

    // Timer updates
    this.ws.on<TimerUpdate>('timerUpdate', (data) => {
      this.timer.set(data.timer);
    });

    // Bid placed
    this.ws.on<BidPlacedEvent>('bidPlaced', (data) => {
      this.lastBid.set(data);
      console.log(`Bid placed: ${data.teamName} bid ${data.bidAmount} for player ${data.playerId}`);
    });

    // Player sold
    this.ws.on<PlayerSoldEvent>('playerSold', (data) => {
      this.lastSale.set(data);
      console.log(`Player sold: ${data.playerName} to ${data.teamName || 'No team'} for ${data.finalPrice}`);
    });

    // Auction started
    this.ws.on<AuctionStartedEvent>('auctionStarted', (data) => {
      console.log(`Auction started: ${data.playerName} at base price ${data.basePrice}`);
    });

    // Auction ended
    this.ws.on<AuctionEndedEvent>('auctionEnded', (data) => {
      console.log(`Auction ended for: ${data.playerName}`);
    });

    // Errors
    this.ws.on<AuctionErrorEvent>('error', (data) => {
      this.lastError.set(data.message);
      console.error('Auction error:', data.message);
    });
  }

  // Get current auction state (REST)
  getAuctionState(): Observable<AuctionStateUpdate> {
    this.loading.set(true);
    return this.http.get<AuctionStateUpdate>(`${this.apiUrl}/state`);
  }

  // Place a bid (WebSocket)
  placeBid(playerId: string, teamId: string, bidAmount: number): void {
    const bidData: BidDto = { playerId, teamId, bidAmount };
    this.ws.emit('bid', bidData);
  }

  // Start auction for a player (WebSocket - Admin only)
  startAuction(playerId: string): void {
    this.ws.emit('startAuction', { playerId });
  }

  // Sell current player (WebSocket - Admin only)
  sellPlayer(): void {
    this.ws.emit('sellPlayer', {});
  }

  // Move to next player (WebSocket - Admin only)
  nextPlayer(): void {
    this.ws.emit('nextPlayer', {});
  }

  // Clear error
  clearError(): void {
    this.lastError.set(null);
  }

  // Clear last bid
  clearLastBid(): void {
    this.lastBid.set(null);
  }

  // Clear last sale
  clearLastSale(): void {
    this.lastSale.set(null);
  }
}
