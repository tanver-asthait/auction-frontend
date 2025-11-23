import { Player } from './player.model';
import { Team } from './team.model';

export interface AuctionState {
  _id: string;
  currentPlayerId: string | null;
  highestBid: number;
  highestBidTeamId: string | null;
  timer: number;
  isRunning: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BidDto {
  playerId: string;
  teamId: string;
  bidAmount: number;
}

export interface AuctionStateUpdate {
  auctionState: AuctionState;
  currentPlayer: Player | null;
  highestBidTeam: Team | null;
}

export interface TimerUpdate {
  timer: number;
  playerId: string;
}

export interface BidPlacedEvent {
  playerId: string;
  teamId: string;
  bidAmount: number;
  teamName: string;
}

export interface PlayerSoldEvent {
  playerId: string;
  teamId: string | null;
  finalPrice: number;
  playerName: string;
  teamName: string | null;
}

export interface AuctionStartedEvent {
  playerId: string;
  playerName: string;
  basePrice: number;
}

export interface AuctionEndedEvent {
  playerId: string;
  playerName: string;
}

export interface AuctionErrorEvent {
  message: string;
  code?: string;
}
