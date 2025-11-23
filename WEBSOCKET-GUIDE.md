# WebSocket Service Documentation

## Overview

The `WebsocketService` provides a complete Angular client for real-time auction communication using Socket.IO. It handles connection management, event listening, and command sending for all auction operations.

## Installation

Make sure `socket.io-client` is installed:

```bash
npm install socket.io-client
```

## Service API

### Connection Methods

#### `connect(url?: string): void`

Connects to the WebSocket server.

- **Parameters:**
  - `url` (optional): WebSocket server URL. Defaults to `environment.wsUrl`
- **Example:**

```typescript
this.wsService.connect(); // Uses default URL
// or
this.wsService.connect("http://localhost:3000");
```

#### `disconnect(): void`

Disconnects from the WebSocket server.

```typescript
this.wsService.disconnect();
```

#### `isConnected(): boolean`

Returns the current connection status.

```typescript
if (this.wsService.isConnected()) {
  console.log("Connected!");
}
```

### Auction Control Methods

#### `startAuction(): void`

Starts the auction (Admin only).

```typescript
this.wsService.startAuction();
```

#### `nextPlayer(): void`

Moves to the next player (Admin only).

```typescript
this.wsService.nextPlayer();
```

#### `sendBid(teamId: string): void`

Places a bid for the current player.

- **Parameters:**
  - `teamId`: ID of the team placing the bid
- **Example:**

```typescript
this.wsService.sendBid("team-123");
```

### Event Listening Methods

#### `listenToState(): Observable<AuctionStateUpdate>`

Returns an Observable that emits auction state updates.

```typescript
this.wsService.listenToState().subscribe((state) => {
  console.log("Current player:", state.currentPlayer?.name);
  console.log("Highest bid:", state.auctionState.highestBid);
  console.log("Highest bidder:", state.highestBidTeam?.name);
});
```

#### `listenToTimer(): Observable<TimerUpdate>`

Returns an Observable that emits timer updates (every second).

```typescript
this.wsService.listenToTimer().subscribe((timer) => {
  console.log("Time remaining:", timer.timer);
});
```

### Event Observables

#### `state$: Observable<AuctionStateUpdate>`

Observable for auction state changes.

#### `timer$: Observable<TimerUpdate>`

Observable for timer updates.

#### `bidPlaced$: Observable<BidPlacedEvent>`

Observable for bid placed events.

```typescript
this.wsService.bidPlaced$.subscribe((bid) => {
  console.log(`${bid.teamName} bid $${bid.bidAmount}`);
});
```

#### `playerSold$: Observable<PlayerSoldEvent>`

Observable for player sold events.

```typescript
this.wsService.playerSold$.subscribe((sold) => {
  console.log(`${sold.playerName} sold to ${sold.teamName} for $${sold.finalPrice}`);
});
```

#### `auctionStarted$: Observable<AuctionStartedEvent>`

Observable for auction started events.

```typescript
this.wsService.auctionStarted$.subscribe((started) => {
  console.log(`Auction started for ${started.playerName}`);
});
```

### Connection State Signals

#### `connected: Signal<boolean>`

Reactive signal for connection status.

```typescript
// In template
{
  {
    wsService.connected() ? "Connected" : "Disconnected";
  }
}

// In component
if (this.wsService.connected()) {
  // Do something
}
```

#### `error: Signal<string | null>`

Reactive signal for error messages.

```typescript
// In template
<p *ngIf="wsService.error()">Error: {{ wsService.error() }}</p>

// In component
const errorMsg = this.wsService.error();
```

## Usage Examples

### Admin Component

```typescript
import { Component, OnInit, OnDestroy } from "@angular/core";
import { WebsocketService } from "./services/websocket.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-admin",
  templateUrl: "./admin.component.html",
})
export class AdminComponent implements OnInit, OnDestroy {
  currentPlayer: string = "";
  highestBid: number = 0;
  timer: number = 0;

  private subscriptions: Subscription[] = [];

  constructor(private wsService: WebsocketService) {}

  ngOnInit(): void {
    // Connect to WebSocket
    this.wsService.connect();

    // Subscribe to auction state
    const stateSub = this.wsService.listenToState().subscribe((state) => {
      this.currentPlayer = state.currentPlayer?.name || "";
      this.highestBid = state.auctionState.highestBid;
    });

    // Subscribe to timer
    const timerSub = this.wsService.listenToTimer().subscribe((timer) => {
      this.timer = timer.timer;
    });

    this.subscriptions.push(stateSub, timerSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  startAuction(): void {
    this.wsService.startAuction();
  }

  nextPlayer(): void {
    this.wsService.nextPlayer();
  }
}
```

### Team Owner Component

```typescript
import { Component, OnInit, OnDestroy } from "@angular/core";
import { WebsocketService } from "./services/websocket.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-team-owner",
  templateUrl: "./team-owner.component.html",
})
export class TeamOwnerComponent implements OnInit, OnDestroy {
  teamId: string = "team-123"; // Get from auth service
  currentBid: number = 0;
  canBid: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(private wsService: WebsocketService) {}

  ngOnInit(): void {
    this.wsService.connect();

    const stateSub = this.wsService.listenToState().subscribe((state) => {
      this.currentBid = state.auctionState.highestBid;
      this.canBid = state.auctionState.isRunning;
    });

    const bidSub = this.wsService.bidPlaced$.subscribe((bid) => {
      console.log("New bid:", bid);
    });

    this.subscriptions.push(stateSub, bidSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  placeBid(): void {
    this.wsService.sendBid(this.teamId);
  }
}
```

### Public Viewer Component

```typescript
import { Component, OnInit, OnDestroy } from "@angular/core";
import { WebsocketService } from "./services/websocket.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-public-viewer",
  templateUrl: "./public-viewer.component.html",
})
export class PublicViewerComponent implements OnInit, OnDestroy {
  currentPlayer: any = null;
  currentBid: number = 0;
  highestBidder: string = "";
  timer: number = 0;
  recentEvents: string[] = [];

  private subscriptions: Subscription[] = [];

  constructor(private wsService: WebsocketService) {}

  ngOnInit(): void {
    this.wsService.connect();

    // Listen to state
    const stateSub = this.wsService.listenToState().subscribe((state) => {
      this.currentPlayer = state.currentPlayer;
      this.currentBid = state.auctionState.highestBid;
      this.highestBidder = state.highestBidTeam?.name || "None";
    });

    // Listen to timer
    const timerSub = this.wsService.listenToTimer().subscribe((timer) => {
      this.timer = timer.timer;
    });

    // Listen to bids
    const bidSub = this.wsService.bidPlaced$.subscribe((bid) => {
      this.addEvent(`${bid.teamName} bid $${bid.bidAmount}`);
    });

    // Listen to player sold
    const soldSub = this.wsService.playerSold$.subscribe((sold) => {
      this.addEvent(`${sold.playerName} sold for $${sold.finalPrice}`);
    });

    this.subscriptions.push(stateSub, timerSub, bidSub, soldSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private addEvent(message: string): void {
    this.recentEvents.unshift(message);
    if (this.recentEvents.length > 10) {
      this.recentEvents.pop();
    }
  }
}
```

## Data Models

### AuctionStateUpdate

```typescript
interface AuctionStateUpdate {
  auctionState: {
    _id: string;
    currentPlayerId: string | null;
    highestBid: number;
    highestBidTeamId: string | null;
    timer: number;
    isRunning: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  currentPlayer: Player | null;
  highestBidTeam: Team | null;
}
```

### TimerUpdate

```typescript
interface TimerUpdate {
  timer: number;
  playerId: string;
}
```

### BidPlacedEvent

```typescript
interface BidPlacedEvent {
  playerId: string;
  teamId: string;
  bidAmount: number;
  teamName: string;
}
```

### PlayerSoldEvent

```typescript
interface PlayerSoldEvent {
  playerId: string;
  teamId: string | null;
  finalPrice: number;
  playerName: string;
  teamName: string | null;
}
```

### AuctionStartedEvent

```typescript
interface AuctionStartedEvent {
  playerId: string;
  playerName: string;
  basePrice: number;
}
```

## WebSocket Events (Server → Client)

| Event Name       | Description                | Data Type             |
| ---------------- | -------------------------- | --------------------- |
| `auctionState`   | Auction state update       | `AuctionStateUpdate`  |
| `timerUpdate`    | Timer countdown            | `TimerUpdate`         |
| `bidPlaced`      | Bid was placed             | `BidPlacedEvent`      |
| `playerSold`     | Player sold/unsold         | `PlayerSoldEvent`     |
| `auctionStarted` | Auction started for player | `AuctionStartedEvent` |

## WebSocket Events (Client → Server)

| Event Name     | Description         | Payload              |
| -------------- | ------------------- | -------------------- |
| `startAuction` | Start auction       | none                 |
| `nextPlayer`   | Move to next player | none                 |
| `placeBid`     | Place a bid         | `{ teamId: string }` |

## Best Practices

1. **Always connect in ngOnInit:**

   ```typescript
   ngOnInit(): void {
     this.wsService.connect();
   }
   ```

2. **Always unsubscribe in ngOnDestroy:**

   ```typescript
   ngOnDestroy(): void {
     this.subscriptions.forEach(sub => sub.unsubscribe());
   }
   ```

3. **Check connection status before emitting:**

   ```typescript
   if (this.wsService.isConnected()) {
     this.wsService.sendBid(teamId);
   }
   ```

4. **Use signals for reactive UI:**

   ```html
   <p>Status: {{ wsService.connected() ? 'Online' : 'Offline' }}</p>
   ```

5. **Handle errors gracefully:**
   ```typescript
   this.wsService.listenToState().subscribe({
     next: (state) => {
       /* handle state */
     },
     error: (err) => console.error("State error:", err),
   });
   ```

## Configuration

Update `environment.ts` with your WebSocket server URL:

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000",
  wsUrl: "http://localhost:3000", // WebSocket server URL
};
```

## Troubleshooting

### Connection Issues

1. **Check server is running:**

   ```bash
   curl http://localhost:3000/health
   ```

2. **Check WebSocket URL in environment:**

   - Ensure `environment.wsUrl` points to correct server
   - Use `http://` not `ws://` (Socket.IO handles protocol)

3. **Check browser console:**
   - Look for connection errors
   - Verify WebSocket handshake

### Not Receiving Events

1. **Verify subscription:**

   ```typescript
   this.wsService.listenToState().subscribe((state) => {
     console.log("State received:", state);
   });
   ```

2. **Check connection status:**

   ```typescript
   console.log("Connected:", this.wsService.isConnected());
   ```

3. **Verify server is emitting events:**
   - Check server logs
   - Test with Socket.IO client

## Advanced Usage

### Custom Event Listeners

```typescript
// Listen to custom events
this.wsService.on("customEvent", (data) => {
  console.log("Custom event:", data);
});

// Emit custom events
this.wsService.emit("customEvent", { data: "value" });

// Remove listener
this.wsService.off("customEvent");
```

### One-time Listeners

```typescript
this.wsService.once("auctionComplete", (data) => {
  console.log("Auction completed!", data);
});
```

## Testing

### Mock Service

```typescript
class MockWebsocketService {
  connected = signal(true);
  error = signal<string | null>(null);

  state$ = new Subject<AuctionStateUpdate>();
  timer$ = new Subject<TimerUpdate>();

  connect = jasmine.createSpy("connect");
  disconnect = jasmine.createSpy("disconnect");
  sendBid = jasmine.createSpy("sendBid");
  startAuction = jasmine.createSpy("startAuction");
  nextPlayer = jasmine.createSpy("nextPlayer");

  listenToState() {
    return this.state$.asObservable();
  }
  listenToTimer() {
    return this.timer$.asObservable();
  }
  isConnected() {
    return true;
  }
}
```

### Component Test

```typescript
describe("AdminComponent", () => {
  let component: AdminComponent;
  let wsService: MockWebsocketService;

  beforeEach(() => {
    wsService = new MockWebsocketService();
    component = new AdminComponent(wsService as any);
  });

  it("should connect on init", () => {
    component.ngOnInit();
    expect(wsService.connect).toHaveBeenCalled();
  });

  it("should start auction", () => {
    component.startAuction();
    expect(wsService.startAuction).toHaveBeenCalled();
  });
});
```

## Support

For issues or questions, refer to:

- Socket.IO documentation: https://socket.io/docs/v4/
- Angular documentation: https://angular.dev/
