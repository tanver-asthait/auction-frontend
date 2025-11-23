import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuctionStateUpdate,
  TimerUpdate,
  BidPlacedEvent,
  PlayerSoldEvent,
  AuctionStartedEvent,
  AuctionEndedEvent,
  AuctionErrorEvent,
} from '../models/auction.model';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket: Socket | null = null;

  // Signals for connection state
  connected = signal<boolean>(false);
  error = signal<string | null>(null);

  // Subjects for real-time events
  private stateSubject = new Subject<AuctionStateUpdate>();
  private timerSubject = new Subject<TimerUpdate>();
  private bidPlacedSubject = new Subject<BidPlacedEvent>();
  private playerSoldSubject = new Subject<PlayerSoldEvent>();
  private auctionStartedSubject = new Subject<AuctionStartedEvent>();
  private auctionEndedSubject = new Subject<AuctionEndedEvent>();
  private auctionErrorSubject = new Subject<AuctionErrorEvent>();

  // Public observables
  state$ = this.stateSubject.asObservable();
  timer$ = this.timerSubject.asObservable();
  bidPlaced$ = this.bidPlacedSubject.asObservable();
  playerSold$ = this.playerSoldSubject.asObservable();
  auctionStarted$ = this.auctionStartedSubject.asObservable();
  auctionEnded$ = this.auctionEndedSubject.asObservable();
  auctionError$ = this.auctionErrorSubject.asObservable();

  constructor() {}

  /**
   * Connect to WebSocket server
   * @param url - WebSocket server URL (defaults to environment.wsUrl)
   */
  connect(url: string = environment.wsUrl): void {
    if (this.socket?.connected) {
      console.log('Already connected to WebSocket');
      return;
    }

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.connected.set(true);
      this.error.set(null);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.connected.set(false);
    });

    this.socket.on('connect_error', (err: Error) => {
      console.error('WebSocket connection error:', err);
      this.error.set(err.message);
      this.connected.set(false);
    });

    // Setup automatic listeners
    this.setupEventListeners();
  }

  /**
   * Setup automatic event listeners for auction events
   * These listeners match the backend WebSocket event names
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Listen to 'stateUpdate' from backend (not 'auctionState')
    this.socket.on('stateUpdate', (data: AuctionStateUpdate) => {
      console.log('Auction state update:', data);
      this.stateSubject.next(data);
    });

    this.socket.on('timerUpdate', (data: TimerUpdate) => {
      this.timerSubject.next(data);
    });

    this.socket.on('bidPlaced', (data: BidPlacedEvent) => {
      console.log('Bid placed:', data);
      this.bidPlacedSubject.next(data);
    });

    this.socket.on('playerSold', (data: PlayerSoldEvent) => {
      console.log('Player sold:', data);
      this.playerSoldSubject.next(data);
    });

    this.socket.on('auctionStarted', (data: AuctionStartedEvent) => {
      console.log('Auction started:', data);
      this.auctionStartedSubject.next(data);
    });

    this.socket.on('auctionEnded', (data: AuctionEndedEvent) => {
      console.log('Auction ended:', data);
      this.auctionEndedSubject.next(data);
    });

    this.socket.on('error', (data: AuctionErrorEvent) => {
      console.error('Auction error:', data);
      this.auctionErrorSubject.next(data);
      this.error.set(data.message);
    });
  }

  /**
   * Listen to auction state changes
   * @returns Observable of auction state updates
   */
  listenToState(): Observable<AuctionStateUpdate> {
    return this.state$;
  }

  /**
   * Listen to timer updates
   * @returns Observable of timer updates
   */
  listenToTimer(): Observable<TimerUpdate> {
    return this.timer$;
  }

  /**
   * Send a bid for the current player
   * @param teamId - ID of the team placing the bid
   * @param playerId - ID of the player being bid on (optional, can be tracked by backend)
   * @param bidAmount - Bid amount (optional, backend can auto-increment)
   *
   * Note: For simplified usage, you can just pass teamId and the backend
   * will handle incrementing the bid. For full control, pass all parameters.
   */
  sendBid(teamId: string, playerId?: string, bidAmount?: number): void {
    if (!this.socket?.connected) {
      console.error('Cannot send bid: WebSocket not connected');
      this.error.set('WebSocket not connected');
      return;
    }

    console.log('Sending bid from team:', teamId);

    // Backend expects 'bid' event
    if (playerId && bidAmount) {
      // Full bid with explicit values
      const bidData = { playerId, teamId, bidAmount };
      console.log('📤 Emitting "bid" event with data:', bidData);
      this.socket.emit('bid', bidData);
    } else {
      // If no playerId/bidAmount provided, still send bid event with just teamId
      // Backend should handle auto-increment
      const bidData = { teamId };
      console.log('📤 Emitting "bid" event with data:', bidData);
      this.socket.emit('bid', bidData);
    }
  }

  /**
   * Start the auction (admin only)
   * @param playerId - Optional player ID to start auction for specific player
   */
  startAuction(playerId?: string): void {
    if (!this.socket?.connected) {
      console.error('Cannot start auction: WebSocket not connected');
      this.error.set('WebSocket not connected');
      return;
    }

    console.log(
      'Starting auction...',
      playerId ? `for player ${playerId}` : ''
    );

    if (playerId) {
      this.socket.emit('startAuction', { playerId });
    } else {
      this.socket.emit('startAuction', {});
    }
  }

  /**
   * Move to the next player (admin only)
   * Backend will automatically select the next unsold player
   */
  nextPlayer(): void {
    if (!this.socket?.connected) {
      console.error('Cannot move to next player: WebSocket not connected');
      this.error.set('WebSocket not connected');
      return;
    }

    console.log(
      '📤 Requesting next player (backend will auto-select next unsold player)...'
    );
    this.socket.emit('nextPlayer', {});
  }

  /**
   * Sell the current player to the highest bidder (admin only)
   * @param playerId - ID of the player to sell (optional, backend will use current player if not provided)
   */
  sellPlayer(playerId?: string): void {
    if (!this.socket?.connected) {
      console.error('Cannot sell player: WebSocket not connected');
      this.error.set('WebSocket not connected');
      return;
    }

    console.log(
      'Selling current player...',
      playerId ? `ID: ${playerId}` : '(using current)'
    );
    this.socket.emit('sellPlayer', playerId ? { playerId } : {});
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected.set(false);
    }
  }

  emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.error('Cannot emit: WebSocket not connected');
      this.error.set('WebSocket not connected');
      return;
    }
    this.socket.emit(event, data);
  }

  on<T = any>(event: string, callback: (data: T) => void): void {
    if (!this.socket) {
      console.error('Cannot listen: WebSocket not initialized');
      return;
    }
    this.socket.on(event, callback);
  }

  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  once<T = any>(event: string, callback: (data: T) => void): void {
    if (!this.socket) {
      console.error('Cannot listen once: WebSocket not initialized');
      return;
    }
    this.socket.once(event, callback);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
