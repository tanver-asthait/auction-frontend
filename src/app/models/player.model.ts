export enum PlayerStatus {
  PENDING = 'pending',
  AUCTIONING = 'auctioning',
  SOLD = 'sold'
}

export interface Player {
  _id: string;
  name: string;
  position: string;
  basePrice: number;
  finalPrice: number | null;
  boughtBy: string | null;
  image?: string;
  status: PlayerStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlayerDto {
  name: string;
  position: string;
  basePrice: number;
  finalPrice?: number;
  boughtBy?: string;
  image?: string;
  status?: PlayerStatus;
}

export interface UpdatePlayerDto {
  name?: string;
  position?: string;
  basePrice?: number;
  finalPrice?: number;
  boughtBy?: string;
  image?: string;
  status?: PlayerStatus;
}
