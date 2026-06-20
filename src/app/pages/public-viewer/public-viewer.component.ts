import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../../services/websocket.service';
import { TeamsService } from '../../services/teams.service';
import { Subscription } from 'rxjs';
import { Player } from '../../models/player.model';
import { Team } from '../../models/team.model';
import { SoundService } from '../../services/sound.service';
import { CelebrationService } from '../../services/celebration.service';
import { PlayersService } from '../../services/players.service';
import { IndianCurrencyPipe } from '../../pipes/indian-currency.pipe';

@Component({
  selector: 'app-public-viewer',
  standalone: true,
  imports: [CommonModule, IndianCurrencyPipe],
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
  topBuys = signal<Player[]>([]);

  // Recent activity
  recentActivity = signal<string[]>([]);

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    public wsService: WebsocketService,
    private teamsService: TeamsService,
    public soundService: SoundService,
    public celebrationService: CelebrationService,
    private playersService: PlayersService
  ) {}

  ngOnInit(): void {
    // Connect to WebSocket
    this.wsService.connect();

    // Fetch all teams
    this.loadTeams();
    this.loadTopBuys();

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
        const prevTimer = this.timer();
        this.timer.set(timerUpdate.timer);
        
        // Play tick sounds
        if (this.isRunning() && timerUpdate.timer !== prevTimer) {
          if (timerUpdate.timer <= 10) {
            this.soundService.playUrgentTick();
          } else {
            this.soundService.playTick();
          }
        }
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
        
        // Audio-visual triggers
        this.soundService.playChime();
        this.celebrationService.triggerBiddingWar();
      },
    });

    // Listen to player sold events
    const soldSub = this.wsService.playerSold$.subscribe({
      next: (sold) => {
        // Reset active bidding war indicator
        this.celebrationService.stopBiddingWar();

        if (sold.teamName) {
          const message = `${sold.playerName} SOLD to ${sold.teamName} for $${sold.finalPrice}!`;
          this.addActivity(`🎉 ` + message);

          // Audio-visual triggers and confetti
          this.soundService.playGavel();
          setTimeout(() => this.soundService.playSoldFanfare(), 850);
          this.celebrationService.triggerConfetti();
          this.celebrationService.triggerGavel(message);
        } else {
          const message = `${sold.playerName} went UNSOLD`;
          this.addActivity(`❌ ` + message);

          // Sound trigger & gavel slam overlay
          this.soundService.playGavel();
          this.celebrationService.triggerGavel(message);
        }
        // Refresh teams to update budgets and players
        this.loadTeams();
        this.loadTopBuys();
      },
    });

    // Listen to auction ended events
    const endedSub = this.wsService.auctionEnded$.subscribe({
      next: (ended) => {
        this.addActivity(`⏹️ Auction ended for ${ended.playerName}`);
        this.loadTopBuys();
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
   * Load top buys from API (sold players sorted by final price descending)
   */
  loadTopBuys(): void {
    this.playersService.getAllPlayers().subscribe({
      next: (players) => {
        const sold = players
          .filter((p) => p.status === 'sold' && p.finalPrice)
          .sort((a, b) => (b.finalPrice || 0) - (a.finalPrice || 0))
          .slice(0, 3);
        this.topBuys.set(sold);
      },
      error: (err) => {
        console.error('Failed to load top buys:', err);
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

  /**
   * Send reaction from public viewer dashboard
   */
  sendReaction(emoji: string): void {
    this.wsService.sendReaction(emoji, 'Public Viewer');
  }

  /**
   * Helper to get team name by its ID
   */
  getTeamName(teamId: string | null): string {
    if (!teamId) return 'N/A';
    const team = this.teams().find((t) => t._id === teamId);
    return team ? team.name : 'Unknown Team';
  }

  /**
   * Procedurally generate football stats based on player name and position
   */
  getPlayerStats(player: Player | null): { overall: number; stats: { label: string; value: number }[] } {
    if (!player) return { overall: 75, stats: [] };
    
    // Hash function to get a deterministic value from player name
    let hash = 0;
    const name = player.name || '';
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seed = Math.abs(hash);
    
    const getStatVal = (min: number, max: number, offset: number) => {
      return min + ((seed + offset) % (max - min + 1));
    };

    const isGK = player.position?.toLowerCase().includes('goalkeeper') || 
                 player.position?.toLowerCase().includes('goal keeper') ||
                 player.position?.toLowerCase() === 'gk';
                 
    // Calculate rating based on base price, capped at 99
    const basePrice = player.basePrice || 5;
    const ratingOffset = Math.min(24, Math.floor((basePrice / 25) * 24));
    const overall = 75 + ratingOffset;

    if (isGK) {
      return {
        overall,
        stats: [
          { label: 'DIV', value: getStatVal(70, 99, 1) },
          { label: 'REF', value: getStatVal(70, 99, 2) },
          { label: 'HAN', value: getStatVal(65, 95, 3) },
          { label: 'SPD', value: getStatVal(50, 85, 4) },
          { label: 'KIC', value: getStatVal(60, 90, 5) },
          { label: 'POS', value: getStatVal(70, 98, 6) }
        ]
      };
    } else {
      const posLower = player.position?.toLowerCase() || '';
      const isDef = posLower.includes('defender') || posLower.includes('back') || posLower === 'def';
      const isMid = posLower.includes('midfielder') || posLower === 'mid';
      const isFwd = posLower.includes('forward') || posLower.includes('striker') || posLower === 'fwd' || posLower === 'att' || posLower.includes('winger');

      // Tailor attributes based on position
      const pac = getStatVal(isFwd ? 80 : isMid ? 70 : 60, 99, 1);
      const sho = getStatVal(isFwd ? 80 : isMid ? 65 : 40, 99, 2);
      const pas = getStatVal(isMid ? 80 : isFwd ? 65 : 55, 99, 3);
      const dri = getStatVal(isMid || isFwd ? 80 : 60, 99, 4);
      const def = getStatVal(isDef ? 80 : isMid ? 60 : 30, 99, 5);
      const phy = getStatVal(isDef ? 80 : 65, 99, 6);

      return {
        overall,
        stats: [
          { label: 'PAC', value: pac },
          { label: 'SHO', value: sho },
          { label: 'PAS', value: pas },
          { label: 'DRI', value: dri },
          { label: 'DEF', value: def },
          { label: 'PHY', value: phy }
        ]
      };
    }
  }

  /**
   * Deterministic jersey number based on player name length/characters
   */
  getJerseyNumber(playerName: string): number {
    if (!playerName) return 10;
    let sum = 0;
    for (let i = 0; i < playerName.length; i++) {
      sum += playerName.charCodeAt(i);
    }
    return (sum % 99) + 1;
  }
}
