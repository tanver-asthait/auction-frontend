# Football Player Auction System - Frontend

A real-time Angular application for managing football player auctions with WebSocket integration, featuring admin controls, public viewing, and team owner interfaces.

## 🚀 Features

- **Real-time Updates**: WebSocket-based live auction updates via Socket.IO
- **Three User Interfaces**:
  - **Admin Dashboard**: Full auction control (start, bid management, sell players)
  - **Public Viewer**: Live auction display for spectators
  - **Team Owner Portal**: Team-specific bidding interface with budget tracking
- **Responsive Design**: Glass-morphism UI with mobile support
- **State Management**: Angular Signals for reactive state
- **Environment Configuration**: Separate configs for local and production

## 📋 System Requirements

- Node.js 18.19.1+ or 20.11.1+
- Angular CLI 18.2.21
- npm 6.11.0+ or yarn 1.13.0+

## 📁 Project Structure

```
frontend/auction-client/
├── src/
│   ├── app/
│   │   ├── pages/
│   │   │   ├── admin/                    # Admin dashboard
│   │   │   │   ├── admin.component.ts    # Auction controls, timer, sell player
│   │   │   │   ├── admin.component.html
│   │   │   │   └── admin.component.scss  # Glass-morphism styles
│   │   │   ├── public-viewer/            # Public display
│   │   │   │   └── public-viewer.component.ts
│   │   │   ├── team-owner/               # Team bidding interface
│   │   │   │   └── team-owner.component.ts
│   │   │   ├── players-management/       # CRUD for players
│   │   │   └── teams-management/         # CRUD for teams
│   │   ├── services/
│   │   │   ├── websocket.service.ts      # Socket.IO client
│   │   │   ├── auction.service.ts        # Auction API + WebSocket
│   │   │   ├── players.service.ts        # Players CRUD
│   │   │   └── teams.service.ts          # Teams CRUD
│   │   ├── models/
│   │   │   ├── auction.model.ts          # Auction interfaces
│   │   │   ├── player.model.ts           # Player types
│   │   │   └── team.model.ts             # Team interfaces
│   │   └── app.routes.ts                 # Route configuration
│   ├── environments/
│   │   ├── environment.ts                # Local config
│   │   └── environment.prod.ts           # Production config
│   ├── styles/
│   │   ├── _variables.scss               # Design tokens
│   │   ├── _mixins.scss                  # Reusable style patterns
│   │   ├── _animations.scss              # Keyframe animations
│   │   └── styles.scss                   # Global styles
│   └── server.js                         # Express server for routing
├── public/
│   ├── _redirects                        # Netlify/Render redirects
│   └── .htaccess                         # Apache redirects
├── render.yaml                           # Render deployment config
├── netlify.toml                          # Netlify deployment config
└── angular.json
```

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Install Express for production server
npm install express
```

## 🏃 Running the Application

### Development Mode (with Angular Dev Server)

```bash
# Local development with localhost backend
npm run start:local
# Opens at http://localhost:4200

# Development with production backend
npm run start:prod
```

### Production Mode (with Express Server)

```bash
# Build the application
npm run build

# Serve with Express (handles routing)
npm start
# Opens at http://localhost:8080
```

The Express server serves the built Angular app and handles client-side routing correctly.

## 🌐 Application Routes

| Route                 | Component          | Description          | Access      |
| --------------------- | ------------------ | -------------------- | ----------- |
| `/public`             | Public Viewer      | Live auction display | Everyone    |
| `/admin`              | Admin Dashboard    | Auction controls     | Admin only  |
| `/team-owner/:teamId` | Team Owner         | Bidding interface    | Team owners |
| `/players`            | Players Management | CRUD operations      | Admin       |
| `/teams`              | Teams Management   | CRUD operations      | Admin       |

**Default redirect**: `/` → `/public`

## 🔧 Environment Configuration

### Local Development (`environment.ts`)

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:3001",
  wsUrl: "http://localhost:3001",
};
```

### Production (`environment.prod.ts`)

```typescript
export const environment = {
  production: true,
  apiUrl: "https://realtime-auction-manager.onrender.com",
  wsUrl: "https://realtime-auction-manager.onrender.com",
};
```

The Angular build automatically replaces `environment.ts` with `environment.prod.ts` during production builds.

## 🎨 Styling Architecture

### Shared SCSS Files

**`styles/_variables.scss`** - Design tokens:

- Colors: `$primary-color`, `$success-light`, `$warning-color`, etc.
- Spacing: `$spacing-xs` to `$spacing-xl`
- Shadows: `$shadow-sm` to `$shadow-xl`
- Breakpoints: `$mobile`, `$tablet`, `$desktop`

**`styles/_mixins.scss`** - Reusable patterns:

- `@mixin glass-card` - Glass-morphism card
- `@mixin gradient-background` - Animated gradient
- `@mixin status-badge($type)` - Status indicators
- `@mixin button-primary/success/danger` - Button styles
- `@mixin mobile/tablet/desktop` - Responsive breakpoints

**`styles/_animations.scss`** - Animations:

- `@keyframes pulse`, `blink`, `slideIn`, `fadeIn`, `bounce`, `shake`, `glow`

### Usage Example

```scss
@import "../../../styles/variables";
@import "../../../styles/mixins";

.my-card {
  @include glass-card;
  padding: $spacing-lg;

  .status {
    @include status-badge("success");
  }

  @include mobile {
    padding: $spacing-sm;
  }
}
```

## 📡 WebSocket Integration

### WebSocket Service (`websocket.service.ts`)

```typescript
// In your component
constructor(private wsService: WebsocketService) {}

ngOnInit() {
  // Connect to WebSocket
  this.wsService.connect();

  // Listen to auction state
  this.wsService.listenToState().subscribe(state => {
    console.log('Auction state:', state);
  });

  // Listen to timer
  this.wsService.listenToTimer().subscribe(timer => {
    console.log('Timer:', timer.timer);
  });

  // Place a bid
  this.wsService.placeBid(teamId, playerId, amount);
}

ngOnDestroy() {
  this.wsService.disconnect();
}
```

### Available WebSocket Methods

| Method                  | Parameters                 | Description                  |
| ----------------------- | -------------------------- | ---------------------------- |
| `connect()`             | -                          | Connect to WebSocket server  |
| `disconnect()`          | -                          | Disconnect from server       |
| `listenToState()`       | -                          | Observable for state updates |
| `listenToTimer()`       | -                          | Observable for timer updates |
| `placeBid()`            | `teamId, playerId, amount` | Place a bid                  |
| `startAuction()`        | `playerId?`                | Start auction (admin)        |
| `sellPlayer()`          | `playerId?`                | Sell player (admin)          |
| `nextPlayer()`          | `playerId?`                | Move to next player (admin)  |
| `requestCurrentState()` | -                          | Request full state sync      |

### Observables for Events

```typescript
// Subscribe to specific events
this.wsService.bidPlaced$.subscribe((event) => {
  console.log("Bid placed:", event);
});

this.wsService.playerSold$.subscribe((event) => {
  console.log("Player sold:", event);
});

this.wsService.auctionError$.subscribe((error) => {
  console.error("Auction error:", error);
});
```

## 🏗️ Build Configuration

### Development Build

```bash
npm run build:local
# Output: dist/auction-client/browser/
# Uses environment.ts (localhost)
```

### Production Build

```bash
npm run build:prod
# Output: dist/auction-client/browser/
# Uses environment.prod.ts (production URLs)
```

### Bundle Size Budget

Configured in `angular.json`:

- Initial bundle: Max 2MB
- Component styles: Max 20kB per component
- Warnings appear at 1MB for bundles, 15kB for styles

## 🚀 Deployment

### Deployment to Render

1. **Create Web Service** (not Static Site)
2. **Configuration**:
   ```yaml
   Build Command: npm install && npm run build
   Start Command: npm start
   Environment: Node
   ```
3. **The Express server (`server.js`) handles routing**

### Deployment to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Vercel auto-detects Angular and handles routing
```

### Deployment to Netlify

```bash
# Using netlify.toml (already configured)
# Just connect your Git repository

# Or use Netlify CLI
npm install -g netlify-cli
netlify deploy --prod
```

The `netlify.toml` and `_redirects` files handle Angular routing automatically.

## 🔌 API Integration

All services use environment-based URLs:

```typescript
// services/teams.service.ts
private apiUrl = `${environment.apiUrl}/teams`;

// Automatically uses:
// - http://localhost:3001/teams (development)
// - https://your-backend.onrender.com/teams (production)
```

### HTTP Services

**PlayersService:**

- `getAllPlayers()`, `getPlayerById(id)`, `createPlayer(dto)`, `updatePlayer(id, dto)`, `deletePlayer(id)`

**TeamsService:**

- `getAllTeams()`, `getTeamById(id)`, `createTeam(dto)`, `updateTeam(id, dto)`, `deleteTeam(id)`

**AuctionService:**

- `getCurrentState()`, `startAuction(playerId)`, `resetAuction()`
- Plus WebSocket methods

All services use Angular Signals for reactive state management.

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:cov

# E2E tests
npm run e2e
```

## 🛠️ Tech Stack

| Technology           | Version  | Purpose                       |
| -------------------- | -------- | ----------------------------- |
| **Angular**          | 18.2.0   | Frontend framework            |
| **TypeScript**       | 5.5.2    | Type-safe JavaScript          |
| **RxJS**             | 7.8.0    | Reactive programming          |
| **Socket.IO Client** | 4.8.1    | WebSocket communication       |
| **SCSS**             | -        | Styling with variables/mixins |
| **Express**          | 4.18.2   | Production server for routing |
| **Angular Signals**  | Built-in | Reactive state management     |

## 📖 Additional Documentation

- **[FRONTEND-README.md](./FRONTEND-README.md)** - Original setup guide
- **[PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md)** - Detailed structure
- **[WEBSOCKET-GUIDE.md](./WEBSOCKET-GUIDE.md)** - WebSocket integration
- **[TEAM-ACCESS-GUIDE.md](./TEAM-ACCESS-GUIDE.md)** - Team owner guide
- **[ADMIN-TROUBLESHOOTING.md](./ADMIN-TROUBLESHOOTING.md)** - Admin issues

## 🐛 Common Issues

### Issue: Routes don't work after page refresh

**Solution**: Use Express server (`npm start`) instead of `ng serve` in production.

### Issue: Cannot connect to backend

**Solution**: Check `environment.ts`/`environment.prod.ts` URLs match your backend.

### Issue: WebSocket disconnects frequently

**Solution**: Ensure CORS is configured on backend with your frontend URL.

### Issue: Build exceeds budget

**Solution**: Bundle budgets are already increased in `angular.json`. If needed, further optimize by:

- Lazy loading modules
- Reducing component styles
- Using shared SCSS more

## 🔐 Security Notes

- CORS configured on backend for specific frontend origins
- No sensitive data in frontend code
- Environment variables not exposed (server-side only)
- CSP headers configured in deployment configs

## 📝 License

MIT

## 👥 Contributors

Built for real-time football player auction management.

---

**Quick Start:**

```bash
npm install
npm run build
npm start
```

Visit `http://localhost:8080` and start auctioning! 🎉
