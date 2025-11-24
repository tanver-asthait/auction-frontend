import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Player, CreatePlayerDto, UpdatePlayerDto, PlayerStatus } from '../../models/player.model';
import { PlayersService } from '../../services/players.service';

@Component({
  selector: 'app-players-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './players-management.component.html',
  styleUrls: ['./players-management.component.scss']
})
export class PlayersManagementComponent implements OnInit {
  players: Player[] = [];
  playerForm: FormGroup;
  selectedPlayer: Player | null = null;
  isEditing = false;
  showForm = false;
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;
  loading = false;

  positions = ['Goal Keeper', 'Forward', 'Midfielder', 'Defender'];
  selectedPositions: string[] = [];

  constructor(
    private fb: FormBuilder,
    private playersService: PlayersService
  ) {
    this.playerForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadPlayers();
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      position: ['', Validators.required], // Will store comma-separated values
      basePrice: [0, [Validators.required, Validators.min(0.1)]]
    });
  }

  loadPlayers(): void {
    this.loading = true;
    this.playersService.getAllPlayers().subscribe({
      next: (players: Player[]) => {
        this.players = players;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading players:', error);
        this.loading = false;
      }
    });
  }

  onShowCreateForm(): void {
    this.resetForm();
    this.showForm = true;
    this.isEditing = false;
    this.selectedPlayer = null;
  }

  onEditPlayer(player: Player): void {
    this.selectedPlayer = player;
    this.isEditing = true;
    this.showForm = true;
    
    // Parse comma-separated positions
    this.selectedPositions = player.position ? player.position.split(',').map(p => p.trim()) : [];
    
    this.playerForm.patchValue({
      name: player.name,
      position: player.position,
      basePrice: player.basePrice
    });

    if (player.image) {
      this.imagePreview = player.image;
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedImageFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onRemoveImage(): void {
    this.selectedImageFile = null;
    this.imagePreview = null;
  }

  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  async onSubmit(): Promise<void> {
    if (this.playerForm.valid) {
      this.loading = true;
      
      const formData = this.playerForm.value;
      let imageData: string | undefined;

      // Convert image to base64 if selected
      if (this.selectedImageFile) {
        try {
          imageData = await this.convertFileToBase64(this.selectedImageFile);
        } catch (error) {
          console.error('Error converting image to base64:', error);
          this.loading = false;
          return;
        }
      }

      if (this.isEditing && this.selectedPlayer) {
        // Update existing player
        const updateData: UpdatePlayerDto = {
          ...formData,
          ...(imageData && { image: imageData })
        };

        this.playersService.updatePlayer(this.selectedPlayer._id, updateData).subscribe({
          next: () => {
            this.loadPlayers();
            this.resetForm();
            this.loading = false;
          },
          error: (error: any) => {
            console.error('Error updating player:', error);
            this.loading = false;
          }
        });
      } else {
        // Create new player
        const createData: CreatePlayerDto = {
          ...formData,
          ...(imageData && { image: imageData })
        };

        this.playersService.createPlayer(createData).subscribe({
          next: () => {
            this.loadPlayers();
            this.resetForm();
            this.loading = false;
          },
          error: (error: any) => {
            console.error('Error creating player:', error);
            this.loading = false;
          }
        });
      }
    }
  }

  onDeletePlayer(player: Player): void {
    if (confirm(`Are you sure you want to delete ${player.name}?`)) {
      this.loading = true;
      this.playersService.deletePlayer(player._id).subscribe({
        next: () => {
          this.loadPlayers();
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error deleting player:', error);
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.resetForm();
  }

  onTogglePosition(position: string): void {
    const index = this.selectedPositions.indexOf(position);
    if (index > -1) {
      this.selectedPositions.splice(index, 1);
    } else {
      this.selectedPositions.push(position);
    }
    
    // Update form control with comma-separated values
    const positionValue = this.selectedPositions.join(',');
    this.playerForm.patchValue({ position: positionValue });
  }

  isPositionSelected(position: string): boolean {
    return this.selectedPositions.includes(position);
  }

  resetForm(): void {
    this.playerForm.reset();
    this.showForm = false;
    this.isEditing = false;
    this.selectedPlayer = null;
    this.selectedImageFile = null;
    this.imagePreview = null;
    this.selectedPositions = [];
  }

  getStatusBadgeClass(status: PlayerStatus): string {
    switch (status) {
      case PlayerStatus.PENDING:
        return 'badge-pending';
      case PlayerStatus.AUCTIONING:
        return 'badge-auctioning';
      case PlayerStatus.SOLD:
        return 'badge-sold';
      default:
        return 'badge-pending';
    }
  }

  getPositionArray(position: string): string[] {
    return position ? position.split(',').map(p => p.trim()) : [];
  }
}