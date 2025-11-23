import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../../services/websocket.service';
import { TeamsService } from '../../services/teams.service';
import { Subscription } from 'rxjs';
import { Player } from '../../models/player.model';
import { Team } from '../../models/team.model';

@Component({
  selector: 'app-public-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-viewer.component.html',
  styleUrl: './public-viewer.component.scss',
})
export class PublicViewerComponent implements OnInit, OnDestroy {
  // Auction state signals
  currentPlayer = signal<Player | null>(null);
  highestBid = signal<number>(0);
  highestBidder = signal<string>('None');
  timer = signal<number>(0);
  isRunning = signal<boolean>(false);

  // Teams data signals
  teams = signal<Team[]>([]);

  // Recent activity
  recentActivity = signal<string[]>([]);

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    public wsService: WebsocketService,
    private teamsService: TeamsService
  ) {}

  ngOnInit(): void {
    // Connect to WebSocket
    this.wsService.connect();

    // Fetch all teams
    this.loadTeams();

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

    // Listen to auction started events
    const startedSub = this.wsService.auctionStarted$.subscribe({
      next: (started) => {
        this.addActivity(
          `🎬 Auction started for ${started.playerName} at $${started.basePrice}`
        );
      },
    });

    // Listen to bid placed events
    const bidSub = this.wsService.bidPlaced$.subscribe({
      next: (bid) => {
        this.addActivity(`💰 ${bid.teamName} bid $${bid.bidAmount}`);
        // Refresh teams to update budgets
        this.loadTeams();
      },
    });

    // Listen to player sold events
    const soldSub = this.wsService.playerSold$.subscribe({
      next: (sold) => {
        if (sold.teamName) {
          this.addActivity(
            `🎉 ${sold.playerName} SOLD to ${sold.teamName} for $${sold.finalPrice}!`
          );
        } else {
          this.addActivity(`❌ ${sold.playerName} UNSOLD`);
        }
        // Refresh teams to update budgets and players
        this.loadTeams();
      },
    });

    // Listen to auction ended events
    const endedSub = this.wsService.auctionEnded$.subscribe({
      next: (ended) => {
        this.addActivity(`⏹️ Auction ended for ${ended.playerName}`);
      },
    });

    // Store subscriptions
    this.subscriptions.push(
      stateSub,
      timerSub,
      startedSub,
      bidSub,
      soldSub,
      endedSub
    );
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Load all teams from the API
   */
  private loadTeams(): void {
    this.teamsService.getAllTeams().subscribe({
      next: (teams) => {
        this.teams.set(teams);
      },
      error: (err) => {
        console.error('Failed to load teams:', err);
      },
    });
  }

  /**
   * Add activity to the recent activity list
   */
  private addActivity(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const activity = `[${timestamp}] ${message}`;

    this.recentActivity.update((activities) => {
      const newActivities = [activity, ...activities];
      // Keep only last 10 activities
      return newActivities.slice(0, 10);
    });
  }

  /**
   * Get the count of players bought by a team
   */
  getPlayerCount(team: Team): number {
    return team.players?.length || 0;
  }
}
