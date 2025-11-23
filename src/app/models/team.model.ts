export interface Team {
  _id: string;
  name: string;
  budget: number;
  players: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTeamDto {
  name: string;
  budget?: number;
  players?: string[];
}

export interface UpdateTeamDto {
  name?: string;
  budget?: number;
  players?: string[];
}
