import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamsService } from '../../services/teams.service';
import { Team, CreateTeamDto, UpdateTeamDto } from '../../models/team.model';

@Component({
  selector: 'app-teams-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teams-management.component.html',
  styleUrl: './teams-management.component.scss',
})
export class TeamsManagementComponent implements OnInit {
  // Teams data
  teams = signal<Team[]>([]);

  // Form state
  isCreating = signal<boolean>(false);
  editingTeamId = signal<string | null>(null);

  // Form data
  formData = signal({
    name: '',
    budget: 100000,
  });

  // UI state
  showDeleteConfirm = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  constructor(public teamsService: TeamsService) {}

  ngOnInit(): void {
    this.loadTeams();
  }

  /**
   * Load all teams from API
   */
  loadTeams(): void {
    this.teamsService.getAllTeams().subscribe({
      next: (teams) => {
        this.teams.set(teams);
      },
      error: (err) => {
        this.showError('Failed to load teams: ' + err.message);
      },
    });
  }

  /**
   * Show create form
   */
  showCreateForm(): void {
    this.isCreating.set(true);
    this.editingTeamId.set(null);
    this.formData.set({ name: '', budget: 100000 });
    this.clearMessages();
  }

  /**
   * Show edit form
   */
  showEditForm(team: Team): void {
    this.isCreating.set(false);
    this.editingTeamId.set(team._id);
    this.formData.set({
      name: team.name,
      budget: team.budget,
    });
    this.clearMessages();
  }

  /**
   * Cancel form
   */
  cancelForm(): void {
    this.isCreating.set(false);
    this.editingTeamId.set(null);
    this.formData.set({ name: '', budget: 100000 });
    this.clearMessages();
  }

  /**
   * Create new team
   */
  createTeam(): void {
    const data = this.formData();

    if (!data.name.trim()) {
      this.showError('Team name is required');
      return;
    }

    if (data.budget < 0) {
      this.showError('Budget must be positive');
      return;
    }

    const createDto: CreateTeamDto = {
      name: data.name.trim(),
      budget: data.budget,
    };

    this.teamsService.createTeam(createDto).subscribe({
      next: (team) => {
        this.showSuccess(`Team "${team.name}" created successfully!`);
        this.loadTeams();
        this.cancelForm();
      },
      error: (err) => {
        this.showError('Failed to create team: ' + err.message);
      },
    });
  }

  /**
   * Update existing team
   */
  updateTeam(): void {
    const teamId = this.editingTeamId();
    const data = this.formData();

    if (!teamId) return;

    if (!data.name.trim()) {
      this.showError('Team name is required');
      return;
    }

    if (data.budget < 0) {
      this.showError('Budget must be positive');
      return;
    }

    const updateDto: UpdateTeamDto = {
      name: data.name.trim(),
      budget: data.budget,
    };

    this.teamsService.updateTeam(teamId, updateDto).subscribe({
      next: (team) => {
        this.showSuccess(`Team "${team.name}" updated successfully!`);
        this.loadTeams();
        this.cancelForm();
      },
      error: (err) => {
        this.showError('Failed to update team: ' + err.message);
      },
    });
  }

  /**
   * Show delete confirmation
   */
  confirmDelete(teamId: string): void {
    this.showDeleteConfirm.set(teamId);
  }

  /**
   * Cancel delete
   */
  cancelDelete(): void {
    this.showDeleteConfirm.set(null);
  }

  /**
   * Delete team
   */
  deleteTeam(teamId: string): void {
    const team = this.teams().find((t) => t._id === teamId);

    this.teamsService.deleteTeam(teamId).subscribe({
      next: () => {
        this.showSuccess(`Team "${team?.name}" deleted successfully!`);
        this.loadTeams();
        this.showDeleteConfirm.set(null);
      },
      error: (err) => {
        this.showError('Failed to delete team: ' + err.message);
        this.showDeleteConfirm.set(null);
      },
    });
  }

  /**
   * Get team dashboard URL
   */
  getTeamDashboardUrl(teamId: string): string {
    return `/team-owner/${teamId}`;
  }

  /**
   * Copy URL to clipboard
   */
  copyTeamUrl(teamId: string): void {
    const url = window.location.origin + this.getTeamDashboardUrl(teamId);
    navigator.clipboard
      .writeText(url)
      .then(() => {
        this.showSuccess('Team URL copied to clipboard!');
      })
      .catch(() => {
        this.showError('Failed to copy URL');
      });
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.successMessage.set(message);
    this.errorMessage.set(null);
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.errorMessage.set(message);
    this.successMessage.set(null);
  }

  /**
   * Clear all messages
   */
  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  /**
   * Get player count for a team
   */
  getPlayerCount(team: Team): number {
    return team.players?.length || 0;
  }
}
