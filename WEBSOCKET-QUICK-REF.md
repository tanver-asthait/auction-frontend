# WebSocket Service - Quick Reference

## Import

```typescript
import { WebsocketService } from "./services/websocket.service";
```

## Functions

### 1. connect()

```typescript
// Connect to WebSocket server
this.wsService.connect();

// Connect to custom URL
this.wsService.connect("http://localhost:4000");
```

### 2. listenToState()

```typescript
// Subscribe to auction state updates
this.wsService.listenToState().subscribe((state) => {
  console.log("Current player:", state.currentPlayer?.name);
  console.log("Highest bid:", state.auctionState.highestBid);
  console.log("Highest bidder:", state.highestBidTeam?.name);
  console.log("Is running:", state.auctionState.isRunning);
  console.log("Timer:", state.auctionState.timer);
});
```

### 3. listenToTimer()

```typescript
// Subscribe to timer updates (fires every second)
this.wsService.listenToTimer().subscribe((timer) => {
  console.log("Time remaining:", timer.timer, "seconds");
});
```

### 4. sendBid(teamId)

```typescript
// Place a bid (Team Owner action)
const teamId = "team-123";

// Simple bid - backend auto-increments
this.wsService.sendBid(teamId);

// OR explicit bid with full control
this.wsService.sendBid(teamId, playerId, bidAmount);
```

### 5. startAuction(playerId?)

```typescript
// Start the auction (Admin action)

// Start for specific player
this.wsService.startAuction("player-456");

// OR let backend choose
this.wsService.startAuction();
```

### 6. nextPlayer()

```typescript
// Move to next player (Admin action)
this.wsService.nextPlayer();
```

### 7. sellPlayer()

```typescript
// Sell current player (Admin action)
this.wsService.sellPlayer();
```

## Component Example

```typescript
import { Component, OnInit, OnDestroy } from "@angular/core";
import { WebsocketService } from "./services/websocket.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-my-component",
  templateUrl: "./my-component.html",
})
export class MyComponent implements OnInit, OnDestroy {
  teamId = "team-123";
  currentPlayer = "";
  highestBid = 0;
  timer = 0;

  private subs: Subscription[] = [];

  constructor(private wsService: WebsocketService) {}

  ngOnInit(): void {
    // 1. Connect
    this.wsService.connect();

    // 2. Listen to state
    this.subs.push(
      this.wsService.listenToState().subscribe((state) => {
        this.currentPlayer = state.currentPlayer?.name || "";
        this.highestBid = state.auctionState.highestBid;
      })
    );

    // 3. Listen to timer
    this.subs.push(
      this.wsService.listenToTimer().subscribe((timer) => {
        this.timer = timer.timer;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => sub.unsubscribe());
  }

  // 4. Place bid
  placeBid(): void {
    this.wsService.sendBid(this.teamId);
  }

  // 5. Start auction (admin)
  startAuction(): void {
    this.wsService.startAuction();
  }

  // 6. Next player (admin)
  nextPlayer(): void {
    this.wsService.nextPlayer();
  }

  // 7. Sell player (admin)
  sellPlayer(): void {
    this.wsService.sellPlayer();
  }
}
```

## Template Example

```html
<!-- Connection Status -->
<p>Connected: {{ wsService.connected() ? 'Yes' : 'No' }}</p>

<!-- Current State -->
<div>
  <h3>{{ currentPlayer }}</h3>
  <p>Bid: {{ highestBid }}</p>
  <p>Timer: {{ timer }}s</p>
</div>

<!-- Actions -->
<button (click)="placeBid()">Place Bid</button>
<button (click)="startAuction()">Start Auction</button>
<button (click)="nextPlayer()">Next Player</button>
<button (click)="sellPlayer()">Sell Player</button>
```

## Additional Events

```typescript
// Listen to bid placed events
this.wsService.bidPlaced$.subscribe((bid) => {
  console.log(`${bid.teamName} bid $${bid.bidAmount}`);
});

// Listen to player sold events
this.wsService.playerSold$.subscribe((sold) => {
  console.log(`${sold.playerName} sold to ${sold.teamName} for $${sold.finalPrice}`);
});

// Listen to auction started events
this.wsService.auctionStarted$.subscribe((started) => {
  console.log(`Auction started for ${started.playerName}`);
});

// Listen to auction ended events
this.wsService.auctionEnded$.subscribe((ended) => {
  console.log(`Auction ended for ${ended.playerName}`);
});

// Listen to error events
this.wsService.auctionError$.subscribe((error) => {
  console.error(`Auction error: ${error.message}`);
});
```

## Connection Management

```typescript
// Check connection status
if (this.wsService.isConnected()) {
  console.log("WebSocket is connected");
}

// Access connection signal
const isConnected = this.wsService.connected();

// Access error signal
const error = this.wsService.error();

// Disconnect
this.wsService.disconnect();
```

## Complete Flow

1. **Component loads** → Call `connect()`
2. **Subscribe to events** → Use `listenToState()` and `listenToTimer()`
3. **User actions** → Call `sendBid()`, `startAuction()`, or `nextPlayer()`
4. **Server responds** → Receive updates via subscriptions
5. **Component destroys** → Unsubscribe all subscriptions

---

For full documentation, see [WEBSOCKET-GUIDE.md](./WEBSOCKET-GUIDE.md)
