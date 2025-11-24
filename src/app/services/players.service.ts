import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  Player,
  CreatePlayerDto,
  UpdatePlayerDto,
  PlayerStatus,
} from '../models/player.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PlayersService {
  private apiUrl = `${environment.apiUrl}/players`;

  // Signals for reactive state
  players = signal<Player[]>([]);
  currentPlayer = signal<Player | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  // Get all players
  getAllPlayers(): Observable<Player[]> {
    this.loading.set(true);
    return this.http.get<Player[]>(this.apiUrl).pipe(
      tap({
        next: (players) => {
          this.players.set(players);
          this.loading.set(false);
          this.error.set(null);
        },
        error: (err) => {
          this.error.set(err.message);
          this.loading.set(false);
        },
      })
    );
  }

  // Get player by ID
  getPlayerById(id: string): Observable<Player> {
    this.loading.set(true);
    return this.http.get<Player>(`${this.apiUrl}/${id}`).pipe(
      tap({
        next: (player) => {
          this.currentPlayer.set(player);
          this.loading.set(false);
          this.error.set(null);
        },
        error: (err) => {
          this.error.set(err.message);
          this.loading.set(false);
        },
      })
    );
  }

  // Get players by status
  getPlayersByStatus(status: PlayerStatus): Observable<Player[]> {
    this.loading.set(true);
    return this.http.get<Player[]>(`${this.apiUrl}/status/${status}`).pipe(
      tap({
        next: (players) => {
          this.loading.set(false);
          this.error.set(null);
        },
        error: (err) => {
          this.error.set(err.message);
          this.loading.set(false);
        },
      })
    );
  }

  // Create new player
  createPlayer(playerDto: CreatePlayerDto): Observable<Player> {
    this.loading.set(true);
    return this.http.post<Player>(this.apiUrl, playerDto).pipe(
      tap({
        next: (player) => {
          this.players.update((players) => [...players, player]);
          this.loading.set(false);
          this.error.set(null);
        },
        error: (err) => {
          this.error.set(err.message);
          this.loading.set(false);
        },
      })
    );
  }

  // Update player
  updatePlayer(id: string, playerDto: UpdatePlayerDto): Observable<Player> {
    this.loading.set(true);
    return this.http.put<Player>(`${this.apiUrl}/${id}`, playerDto).pipe(
      tap({
        next: (updatedPlayer) => {
          this.players.update((players) =>
            players.map((p) => (p._id === id ? updatedPlayer : p))
          );
          this.loading.set(false);
          this.error.set(null);
        },
        error: (err) => {
          this.error.set(err.message);
          this.loading.set(false);
        },
      })
    );
  }

  // Delete player
  deletePlayer(id: string): Observable<void> {
    this.loading.set(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap({
        next: () => {
          this.players.update((players) => players.filter((p) => p._id !== id));
          this.loading.set(false);
          this.error.set(null);
        },
        error: (err) => {
          this.error.set(err.message);
          this.loading.set(false);
        },
      })
    );
  }

  // Clear error
  clearError(): void {
    this.error.set(null);
  }
}
