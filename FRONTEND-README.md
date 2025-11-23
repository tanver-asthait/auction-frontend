# Football Auction Frontend - Angular 18

Real-time football player auction dashboard built with Angular 18 standalone components and signals.

## 🏗️ Project Structure

```
src/app/
├── models/              # TypeScript interfaces and enums
│   ├── player.model.ts
│   ├── team.model.ts
│   └── auction.model.ts
├── services/            # Angular services
│   ├── websocket.service.ts
│   ├── auction.service.ts
│   ├── players.service.ts
│   └── teams.service.ts
├── pages/               # Page components (standalone)
│   ├── admin/
│   ├── team-owner/
│   └── public-viewer/
├── app.routes.ts        # Route configuration
├── app.config.ts        # App configuration
└── app.component.ts     # Root component
```

## 📦 Features

### Pages
1. **Admin Page** (`/admin`)
   - Start/stop auctions
   - Control auction flow
   - Manage players and teams

2. **Team Owner Page** (`/team-owner`)
   - Place bids
   - View team budget
   - Track owned players

3. **Public Viewer Page** (`/public`)
   - Watch live auction
   - See current bids
   - View auction timer

### Services

#### WebsocketService
- Manages Socket.IO connection
- Reactive connection state with signals
- Event emitter and listener methods
- Auto-reconnection support

#### AuctionService
- Real-time auction state management
- WebSocket event handling
- Signal-based reactive data
- Methods: `placeBid()`, `startAuction()`, `sellPlayer()`, `nextPlayer()`

#### PlayersService
- Player CRUD operations
- REST API integration
- Signal-based state management
- Methods: `getAllPlayers()`, `createPlayer()`, `updatePlayer()`, `deletePlayer()`

#### TeamsService
- Team CRUD operations
- REST API integration
- Signal-based state management
- Methods: `getAllTeams()`, `createTeam()`, `updateTeam()`, `deleteTeam()`

## 🚀 Getting Started

### Prerequisites
- Node.js v20.11.1+ or v22+
- npm 8.0.0+
- Backend server running on http://localhost:3000

### Installation

```bash
cd frontend/auction-client
npm install
```

### Development Server

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`

### Build

```bash
npm run build
# or
ng build
```

Build artifacts stored in `dist/` directory.

## 🔧 Configuration

### Environment Variables

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  wsUrl: 'http://localhost:3000'
};
```

### Routes

- `/` → Redirects to `/public`
- `/admin` → Admin Dashboard
- `/team-owner` → Team Owner Dashboard
- `/public` → Public Auction Viewer
- `**` → Redirects to `/public`

## 📡 WebSocket Events

### Client Events (Emit)
- `bid` - Place a bid
- `startAuction` - Start auction for player
- `sellPlayer` - Sell current player
- `nextPlayer` - Move to next player

### Server Events (Listen)
- `stateUpdate` - Full auction state
- `timerUpdate` - Timer countdown
- `bidPlaced` - New bid notification
- `playerSold` - Player sale notification
- `auctionStarted` - Auction start notification
- `auctionEnded` - Auction end notification
- `error` - Error messages

## 🎨 Styling

- Uses SCSS for styling
- Global styles in `src/styles.scss`
- Component-specific styles in respective `.scss` files

## 📊 Data Models

### Player
```typescript
{
  _id: string;
  name: string;
  position: string;
  basePrice: number;
  finalPrice: number | null;
  boughtBy: string | null;
  status: 'pending' | 'auctioning' | 'sold';
}
```

### Team
```typescript
{
  _id: string;
  name: string;
  budget: number;
  players: string[];
}
```

### AuctionState
```typescript
{
  _id: string;
  currentPlayerId: string | null;
  highestBid: number;
  highestBidTeamId: string | null;
  timer: number;
  isRunning: boolean;
}
```

## 🔄 Signals Usage

All services use Angular signals for reactive state management:

```typescript
// Example: AuctionService
auctionState = signal<AuctionState | null>(null);
currentPlayer = signal<Player | null>(null);
timer = signal<number>(0);
isRunning = signal<boolean>(false);

// In components:
constructor() {
  private auctionService = inject(AuctionService);
}

// Access signals
const timer = this.auctionService.timer();
const isRunning = this.auctionService.isRunning();
```

## 🧪 Testing

```bash
npm test
# or
ng test
```

## 📝 TODO

- [ ] Implement UI for Admin page
- [ ] Implement UI for Team Owner page
- [ ] Implement UI for Public Viewer page
- [ ] Add authentication/authorization
- [ ] Add error boundary components
- [ ] Add loading states and spinners
- [ ] Add toast notifications
- [ ] Add responsive design
- [ ] Add E2E tests

## 🤝 Backend Integration

Connects to NestJS backend:
- REST API: `http://localhost:3000`
- WebSocket: `http://localhost:3000`

Ensure backend is running before starting frontend.

## 📚 Technologies

- **Angular 18** - Framework
- **TypeScript 5.3** - Language
- **RxJS** - Reactive programming
- **Socket.IO Client** - WebSocket communication
- **Angular Signals** - Reactive state management
- **SCSS** - Styling
- **Standalone Components** - Component architecture

## 🏃‍♂️ Quick Start Example

```typescript
// In any component
import { Component, OnInit, inject } from '@angular/core';
import { AuctionService } from './services/auction.service';

@Component({
  selector: 'app-example',
  standalone: true,
  template: `
    <div>
      <p>Timer: {{ auctionService.timer() }}</p>
      <p>Running: {{ auctionService.isRunning() }}</p>
      <button (click)="placeBid()">Place Bid</button>
    </div>
  `
})
export class ExampleComponent implements OnInit {
  auctionService = inject(AuctionService);

  ngOnInit() {
    this.auctionService.connect();
  }

  placeBid() {
    this.auctionService.placeBid('playerId', 'teamId', 100);
  }
}
```

---

**Ready for UI implementation!** 🎉
