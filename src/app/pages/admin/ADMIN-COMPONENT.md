# Admin Component - Usage Guide

## Overview

The Admin Component provides a control panel for managing the auction. It displays real-time auction data and provides controls for starting auctions, selling players, and moving to the next player.

## Features Implemented

### ✅ Display Features

1. **Connection Status** - Shows WebSocket connection state (Connected/Disconnected)
2. **Current Player** - Displays selected player's name, position, base price, and status
3. **Timer Display** - Shows countdown timer in seconds
4. **Highest Bid** - Shows current highest bid amount
5. **Highest Bidder** - Shows name of team with highest bid
6. **Auction Status** - Shows if auction is running

### ✅ Admin Controls

1. **Start Auction** - Starts the auction for the next player
2. **Sell Player** - Sells current player to highest bidder
3. **Next Player** - Moves to the next player in queue

## Technical Implementation

### Angular Signals Usage

```typescript
currentPlayer = signal<Player | null>(null);
highestBid = signal<number>(0);
highestBidder = signal<string>("None");
timer = signal<number>(0);
isRunning = signal<boolean>(false);
```

### WebSocket Service Integration

```typescript
// Connect on init
this.wsService.connect();

// Listen to state updates
this.wsService.listenToState().subscribe((state) => {
  this.currentPlayer.set(state.currentPlayer);
  this.highestBid.set(state.auctionState.highestBid);
  // ...
});

// Listen to timer
this.wsService.listenToTimer().subscribe((timer) => {
  this.timer.set(timer.timer);
});

// Admin actions
this.wsService.startAuction();
this.wsService.sellPlayer();
this.wsService.nextPlayer();
```

## Access the Component

Navigate to: `http://localhost:4200/admin`

## Button States

### Start Auction Button

- **Enabled**: When connected and auction is NOT running
- **Disabled**: When disconnected OR auction is already running

### Sell Player Button

- **Enabled**: When connected and auction IS running
- **Disabled**: When disconnected OR auction is NOT running

### Next Player Button

- **Enabled**: When connected
- **Disabled**: When disconnected

## Real-time Updates

The component automatically updates when:

- New player is selected
- Bids are placed
- Timer counts down
- Player is sold
- Auction state changes

## Component Structure

```
admin/
├── admin.component.ts      # Component logic with signals
├── admin.component.html    # Template with @if syntax
└── admin.component.scss    # Minimal styling
```

## Key Methods

### `ngOnInit()`

- Connects to WebSocket
- Sets up subscriptions to state and timer updates
- Listens to bid and player sold events

### `ngOnDestroy()`

- Cleans up all subscriptions to prevent memory leaks

### `startAuction()`

- Calls `wsService.startAuction()`
- Backend selects next available player

### `sellPlayer()`

- Calls `wsService.sellPlayer()`
- Awards current player to highest bidder

### `nextPlayer()`

- Calls `wsService.nextPlayer()`
- Moves to next player (regardless of bids)

## Error Handling

- Connection errors displayed in red
- Console logs for bid and sale events
- Error signal from WebSocket service shown in UI

## Testing

1. **Start the backend server** (port 3000)
2. **Start the frontend** (`npm start`)
3. **Navigate to** `http://localhost:4200/admin`
4. **Check connection status** - Should show green "Connected"
5. **Click "Start Auction"** - Should begin auction for first player
6. **Monitor timer** - Should count down
7. **Test buttons** - Verify enable/disable states work correctly

## Example Flow

1. Admin clicks "Start Auction"
2. Backend selects next pending player
3. Timer starts counting down
4. Teams place bids (via Team Owner page)
5. Admin sees highest bid update in real-time
6. When ready, admin clicks "Sell Player"
7. Player awarded to highest bidder
8. Admin clicks "Next Player" to continue

## Console Logs

The component logs important events:

```
✓ Bid placed: Eagles - $45000
✓ Player sold: John Doe to Eagles for $45000
✗ State subscription error: ...
```

## Responsive Design

- Max width: 800px
- Centered layout
- Works on desktop and tablet
- Buttons wrap on smaller screens

## Dependencies

- `CommonModule` - For @if directive
- `WebsocketService` - For real-time communication
- `Player` and `Team` models - For type safety

---

**Component Route:** `/admin`  
**Access Level:** Admin only (no auth implemented yet)  
**Real-time:** Yes (WebSocket)
