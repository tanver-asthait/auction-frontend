import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Team, CreateTeamDto, UpdateTeamDto } from '../models/team.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TeamsService {
  private apiUrl = `${environment.apiUrl}/teams`;

  // Signals for reactive state
  teams = signal<Team[]>([]);
  currentTeam = signal<Team | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  // Get all teams
  getAllTeams(): Observable<Team[]> {
    this.loading.set(true);
    return this.http.get<Team[]>(this.apiUrl).pipe(
      tap({
        next: (teams) => {
          this.teams.set(teams);
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

  // Get team by ID
  getTeamById(id: string): Observable<Team> {
    this.loading.set(true);
    return this.http.get<Team>(`${this.apiUrl}/${id}`).pipe(
      tap({
        next: (team) => {
          this.currentTeam.set(team);
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

  // Create new team
  createTeam(teamDto: CreateTeamDto): Observable<Team> {
    this.loading.set(true);
    return this.http.post<Team>(this.apiUrl, teamDto).pipe(
      tap({
        next: (team) => {
          this.teams.update((teams) => [...teams, team]);
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

  // Update team
  updateTeam(id: string, teamDto: UpdateTeamDto): Observable<Team> {
    this.loading.set(true);
    return this.http.put<Team>(`${this.apiUrl}/${id}`, teamDto).pipe(
      tap({
        next: (updatedTeam) => {
          this.teams.update((teams) =>
            teams.map((t) => (t._id === id ? updatedTeam : t))
          );
          if (this.currentTeam()?._id === id) {
            this.currentTeam.set(updatedTeam);
          }
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

  // Delete team
  deleteTeam(id: string): Observable<void> {
    this.loading.set(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap({
        next: () => {
          this.teams.update((teams) => teams.filter((t) => t._id !== id));
          if (this.currentTeam()?._id === id) {
            this.currentTeam.set(null);
          }
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
