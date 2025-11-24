import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WebsocketService } from '../../services/websocket.service';
import { TeamsService } from '../../services/teams.service';
import { Subscription } from 'rxjs';
import { Player } from '../../models/player.model';
import { Team } from '../../models/team.model';

@Component({
  selector: 'app-team-owner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-owner.component.html',
  styleUrl: './team-owner.component.scss',
})
export class TeamOwnerComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private teamsService = inject(TeamsService);

  // Team information (loaded from route and API)
  teamId = signal<string>('');
  teamName = signal<string>('Loading...');
  budget = signal<number>(0);
  teamNotFound = signal<boolean>(false);

  // Auction state signals
  currentPlayer = signal<Player | null>(null);
  highestBid = signal<number>(0);
  highestBidder = signal<string>('None');
  highestBidderTeamId = signal<string | null>(null);
  timer = signal<number>(0);
  isRunning = signal<boolean>(false);
  lastSoldInfo = signal<string>(''); // Track last sold player info

  // Computed signals
  isHighestBidder = computed(() => {
    return this.highestBidderTeamId() === this.teamId();
  });

  // Bid increment must be $1 to match backend validation
  bidIncrement = computed(() => {
    return 1; // Backend expects exactly +$1 increments
  });

  nextBidAmount = computed(() => {
    return this.highestBid() + this.bidIncrement();
  });

  canBid = computed(() => {
    return (
      this.wsService.connected() &&
      this.isRunning() &&
      !this.isHighestBidder() &&
      this.nextBidAmount() <= this.budget() &&
      this.timer() > 0
    );
  });

  remainingBudget = computed(() => {
    return this.budget() - this.nextBidAmount();
  });

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(public wsService: WebsocketService) {}

  ngOnInit(): void {
    // Get team ID from route parameter
    const teamIdFromRoute = this.route.snapshot.paramMap.get('teamId');

    if (!teamIdFromRoute) {
      console.error('No team ID provided in route');
      this.teamNotFound.set(true);
      return;
    }

    this.teamId.set(teamIdFromRoute);

    // Load team data from API
    this.loadTeamData(teamIdFromRoute);

    // Connect to WebSocket
    this.wsService.connect();

    // Request current state immediately after connecting
    setTimeout(() => {
      if (this.wsService.connected()) {
        console.log('🔄 Requesting current auction state...');
        this.wsService.requestCurrentState();
      } else {
        console.log('⏳ WebSocket not connected yet, state will be sent automatically on connect');
      }
    }, 1000);

    // Listen to auction state updates
    const stateSub = this.wsService.listenToState().subscribe({
      next: (state: any) => {
        console.log('📡 Team Owner received state update:', state);

        // Backend sends flat structure, not nested
        // Handle both formats for compatibility
        const isNested = !!state.auctionState;

        if (isNested) {
          // Nested format: { auctionState: {...}, currentPlayer, highestBidTeam }
          this.currentPlayer.set(state.currentPlayer);
          this.highestBid.set(state.auctionState?.highestBid || 0);
          this.highestBidder.set(state.highestBidTeam?.name || 'None');
          this.highestBidderTeamId.set(
            state.auctionState?.highestBidTeamId || null
          );
          this.isRunning.set(state.auctionState?.isRunning || false);
          this.timer.set(state.auctionState?.timer || 0);
        } else {
          // Flat format (what backend actually sends): { currentPlayer, highestBid, timer, isRunning, ... }
          this.currentPlayer.set(state.currentPlayer);
          this.highestBid.set(state.highestBid || 0);
          this.highestBidder.set(state.highestBidTeam?.name || 'None');
          this.highestBidderTeamId.set(state.highestBidTeamId || null);
          this.isRunning.set(state.isRunning || false);
          this.timer.set(state.timer || 0);
        }

        console.log('✅ Updated state:');
        console.log('  - Current player:', this.currentPlayer()?.name || 'None');
        console.log('  - Is running:', this.isRunning());
        console.log('  - Timer:', this.timer());
        console.log('  - Highest bid:', this.highestBid());
        console.log('  - Can bid:', this.canBid());
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

        // If this team placed the bid, show feedback
        if (bid.teamId === this.teamId()) {
          console.log('✅ Your bid was placed successfully!');
        }
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
        if (sold.teamId === this.teamId()) {
          // This team won the player
          const message = `🎉 Congratulations! You won ${sold.playerName} for $${sold.finalPrice}`;
          this.lastSoldInfo.set(message);
          alert(message);
          // Refresh team data to get updated budget
          this.refreshTeamData();
        } else if (sold.teamName) {
          // Another team won
          const message = `${sold.playerName} sold to ${sold.teamName} for $${sold.finalPrice}`;
          this.lastSoldInfo.set(message);
        } else {
          // No one won (unsold)
          const message = `${sold.playerName} went unsold (No bids)`;
          this.lastSoldInfo.set(message);
        }

        // Clear the sold info after 10 seconds
        setTimeout(() => {
          this.lastSoldInfo.set('');
        }, 10000);
      },
    });

    // Listen to auction errors
    const errorSub = this.wsService.auctionError$.subscribe({
      next: (error) => {
        console.error('❌ Auction error:', error);
        alert(`Error: ${error.message}`);
      },
    });

    // Store subscriptions
    this.subscriptions.push(stateSub, timerSub, bidSub, soldSub, errorSub);
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Load team data from API
   */
  private loadTeamData(teamId: string): void {
    this.teamsService.getTeamById(teamId).subscribe({
      next: (team: Team) => {
        this.teamName.set(team.name);
        this.budget.set(team.budget);
        this.teamNotFound.set(false);
        console.log(`Loaded team: ${team.name} with budget $${team.budget}`);
      },
      error: (err) => {
        console.error('Failed to load team:', err);
        this.teamNotFound.set(true);
        this.teamName.set('Team Not Found');
      },
    });
  }

  /**
   * Refresh team data (call after winning a player)
   */
  private refreshTeamData(): void {
    const currentTeamId = this.teamId();
    if (currentTeamId) {
      this.teamsService.getTeamById(currentTeamId).subscribe({
        next: (team: Team) => {
          this.budget.set(team.budget);
        },
        error: (err) => {
          console.error('Failed to refresh team:', err);
        },
      });
    }
  }

  /**
   * Place a bid for the current player
   */
  placeBid(): void {
    console.log('🎯 Attempting to place bid...');
    console.log('📊 Current state:', {
      canBid: this.canBid(),
      isRunning: this.isRunning(),
      timer: this.timer(),
      currentPlayer: this.currentPlayer(),
      highestBid: this.highestBid(),
      budget: this.budget(),
      isConnected: this.wsService.connected()
    });

    if (!this.canBid()) {
      console.warn('❌ Cannot place bid at this time. Reasons:');
      console.warn('  - Connected:', this.wsService.connected());
      console.warn('  - Auction running:', this.isRunning());
      console.warn('  - Timer > 0:', this.timer() > 0);
      console.warn('  - Not highest bidder:', !this.isHighestBidder());
      console.warn('  - Can afford bid:', this.nextBidAmount() <= this.budget());
      alert('❌ Cannot place bid at this time. Check auction status.');
      return;
    }

    const currentPlayer = this.currentPlayer();
    if (!currentPlayer || !currentPlayer._id) {
      console.error('❌ No current player to bid on');
      console.error('Current player object:', currentPlayer);
      alert('❌ No player is currently being auctioned. Please wait for the admin to start an auction.');
      return;
    }

    const playerId = currentPlayer._id;
    const bidAmount = this.nextBidAmount();
    
    console.log(`🚀 Placing bid: Team ${this.teamId()}, Player ${playerId} (${currentPlayer.name}), Amount $${bidAmount}`);

    // Show immediate feedback
    const confirmMessage = `Place bid of $${bidAmount} for ${currentPlayer.name}?\n\nThis will leave you with $${this.remainingBudget()} remaining budget.`;
    
    if (!confirm(confirmMessage)) {
      console.log('🚫 Bid cancelled by user');
      return;
    }

    this.wsService.sendBid(this.teamId(), playerId, bidAmount);
  }

  /**
   * Helper method to split position string into array
   * Position is stored as comma-separated string, e.g., "Goal Keeper,Midfielder"
   */
  getPositionArray(position: string): string[] {
    if (!position) return [];
    return position.split(',').map(pos => pos.trim()).filter(pos => pos.length > 0);
  }

  /**
   * Request current auction state from server
   * Useful for debugging connection issues
   */
  requestCurrentState(): void {
    console.log('🔄 Requesting current auction state...');
    this.wsService.requestCurrentState();
  }
}
