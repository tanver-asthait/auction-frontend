# Admin Panel Troubleshooting Guide

## "Start Auction" Button - Nothing Happens

When you click "Start Auction" in the admin panel, here's what **should** happen and how to troubleshoot if it doesn't.

---

## Expected Behavior

### 1. **Button Click**

Admin clicks "Start Auction" button

### 2. **Frontend Action**

- Console logs appear:
  ```
  🚀 Admin: Starting auction...
  WebSocket connected: true
  Starting auction...
  📤 Sent startAuction event to backend
  ```
- WebSocket emits `startAuction` event to backend

### 3. **Backend Processing**

Backend should:

- Receive `startAuction` event
- Query database for first unsold player
- Set auction state: `isRunning = true`
- Start countdown timer (e.g., 30 seconds)
- Broadcast `stateUpdate` event to all clients with:
  ```json
  {
    "currentPlayer": { "name": "Player 1", "basePrice": 5000, ... },
    "auctionState": {
      "isRunning": true,
      "highestBid": 5000,
      "timer": 30
    },
    "highestBidTeam": null
  }
  ```
- Send `auctionStarted` event with:
  ```json
  {
    "playerId": "abc123",
    "playerName": "Player 1",
    "basePrice": 5000
  }
  ```

### 4. **Frontend Response**

Admin panel updates:

- Alert popup: "Auction started! First player: Player 1 (Base: $5000)"
- Current Player section shows player details
- Timer starts counting down from 30
- "Start Auction" button becomes disabled
- "Sell Player" button becomes enabled
- Console log: `✅ Auction started!` with event data

---

## Troubleshooting Steps

### Check 1: Is WebSocket Connected?

**Look at the Admin Panel:**

- At the top, you should see: **Connection: ● Connected** (green dot)
- If it says **● Disconnected** (red dot), the WebSocket isn't connected

**Why it might be disconnected:**

- Backend server is not running
- Wrong WebSocket URL in `src/environments/environment.ts`
- CORS issues
- Firewall blocking connection

**Fix:**

1. Check if backend is running: `npm run dev` or similar
2. Verify WebSocket URL matches your backend:
   ```typescript
   // src/environments/environment.ts
   export const environment = {
     apiUrl: "http://localhost:3000/api",
     wsUrl: "http://localhost:3000", // Should match your backend
   };
   ```
3. Check backend console for WebSocket connection logs

---

### Check 2: Are There Players in the Database?

**Backend needs players to start auction**

**Check in your backend:**

```bash
# Example MongoDB query
db.players.find({ status: 'unsold' }).count()
```

**If no players exist:**

1. Add players via API or database seed script
2. Ensure at least one player has `status: 'unsold'`

**Example player document:**

```json
{
  "name": "MS Dhoni",
  "position": "Wicket Keeper",
  "basePrice": 50000,
  "status": "unsold"
}
```

---

### Check 3: Is Backend Handling the Event?

**Open backend console/logs**

When you click "Start Auction", you should see backend logs like:

```
Received startAuction event from socket abc123
Loading first unsold player...
Starting auction for player: MS Dhoni
Broadcasting stateUpdate to all clients
```

**If no logs appear:**

- Backend isn't receiving the event
- Check WebSocket event listener in backend code:
  ```typescript
  socket.on("startAuction", async (data) => {
    // Handler code
  });
  ```

**If error logs appear:**

- Read the error message
- Common issues:
  - Database connection error
  - No unsold players found
  - Missing required fields
  - Permission/authentication issues

---

### Check 4: Browser Console Logs

**Open Browser DevTools (F12) → Console tab**

**Expected logs after clicking "Start Auction":**

```
🚀 Admin: Starting auction...
WebSocket connected: true
Starting auction...
📤 Sent startAuction event to backend
✅ Auction started! {playerId: "abc123", playerName: "MS Dhoni", basePrice: 50000}
```

**If you see errors:**

- `Cannot start auction: WebSocket not connected` → See Check 1
- No logs at all → Button click handler might not be working
- Logs stop after "📤 Sent..." → Backend not responding, see Check 3

---

### Check 5: Network Tab

**Open Browser DevTools (F12) → Network tab → WS (WebSocket)**

1. Click on the WebSocket connection
2. Click on "Start Auction" button
3. In Messages tab, you should see:
   - **Sent:** `startAuction` with empty payload `{}`
   - **Received:** `stateUpdate` with auction state
   - **Received:** `auctionStarted` with player info

**If no messages are sent:**

- WebSocket not connected
- Button is disabled (check button state)

**If sent but no response:**

- Backend not processing the event
- Backend error (check backend logs)

---

## Common Issues & Solutions

### Issue 1: Button is Disabled

**Symptom:** Can't click "Start Auction" button

**Causes:**

- WebSocket not connected (button disabled when disconnected)
- Auction already running (button disabled when `isRunning = true`)

**Solution:**

- Wait for WebSocket to connect (green dot)
- If auction is stuck as "running", restart backend to reset state
- Or call "Next Player" to move forward

---

### Issue 2: Backend Not Starting

**Symptom:** WebSocket never connects, always red dot

**Check:**

```bash
# Is backend running?
ps aux | grep node

# Try starting backend
cd /path/to/backend
npm run dev
```

**Verify backend is listening:**

```
Server listening on port 3000
WebSocket server initialized
```

---

### Issue 3: CORS Error

**Symptom:** Browser console shows CORS error

**Fix backend CORS config:**

```typescript
// backend/src/main.ts or app.ts
app.enableCors({
  origin: "http://localhost:4200", // Your Angular dev server
  credentials: true,
});
```

---

### Issue 4: Wrong Event Name

**Symptom:** Frontend sends event but backend doesn't receive it

**Verify event names match:**

Frontend (`websocket.service.ts`):

```typescript
this.socket.emit("startAuction", {});
```

Backend:

```typescript
socket.on("startAuction", async (data) => {
  // Handler
});
```

If names don't match, update one to match the other.

---

### Issue 5: No Players Loaded

**Symptom:** Backend logs "No unsold players found"

**Solution:**

1. Add players via Teams Management or API
2. Seed database with sample players
3. Ensure player `status` field is `'unsold'`

**Example seed script:**

```typescript
const players = [
  { name: "MS Dhoni", position: "WK", basePrice: 50000, status: "unsold" },
  { name: "Virat Kohli", position: "BAT", basePrice: 75000, status: "unsold" },
  { name: "Jasprit Bumrah", position: "BOWL", basePrice: 60000, status: "unsold" },
];

await Player.insertMany(players);
```

---

## Testing the Flow

### Manual Test Steps:

1. **Start Backend**

   ```bash
   cd backend
   npm run dev
   ```

   Wait for: `Server listening on port 3000`

2. **Start Frontend**

   ```bash
   cd frontend/auction-client
   npm start
   ```

   Wait for: `Compiled successfully`

3. **Open Admin Panel**

   - Navigate to `http://localhost:4200/admin`
   - Check connection status: Should be **● Connected** (green)

4. **Create Teams** (if not done)

   - Go to `http://localhost:4200/teams-management`
   - Create 2-3 teams with budgets

5. **Add Players** (if not done)

   - Use backend API to add players
   - OR create players in database directly

6. **Click "Start Auction"**

   - Open browser console (F12)
   - Click button
   - Watch console logs
   - Should see alert popup
   - Timer should start counting down

7. **Verify Other Pages**
   - Open team owner page: `http://localhost:4200/team-owner/{teamId}`
   - Open public viewer: `http://localhost:4200/public`
   - Both should show current player and timer

---

## Debug Checklist

Use this checklist to systematically debug:

- [ ] Backend server is running
- [ ] Frontend dev server is running
- [ ] WebSocket connection is established (green dot)
- [ ] At least one player exists with status 'unsold'
- [ ] At least one team exists with budget > 0
- [ ] Browser console shows no errors
- [ ] Backend console shows no errors
- [ ] Network tab shows WebSocket messages being sent
- [ ] Button is not disabled
- [ ] CORS is configured correctly
- [ ] Environment URLs are correct

---

## Quick Debug Commands

### Check Backend Status

```bash
# Backend logs
tail -f backend/logs/app.log  # if you have logging

# Check port
lsof -i :3000

# Test API endpoint
curl http://localhost:3000/api/health
```

### Check Database

```bash
# MongoDB
mongosh
use auction-db
db.players.find({ status: 'unsold' }).pretty()
db.teams.find().pretty()
```

### Check Frontend

```bash
# Check environment
cat src/environments/environment.ts

# Check running processes
ps aux | grep ng

# Restart frontend
npm start
```

---

## Still Not Working?

If you've tried all the above and it still doesn't work:

1. **Check the full event flow:**

   - Add `console.log` statements in backend startAuction handler
   - Add `console.log` statements in frontend WebSocket service
   - Trace the exact point where it fails

2. **Verify backend implementation:**

   - Does backend have a `startAuction` event handler?
   - Does it query for unsold players?
   - Does it emit `stateUpdate` and `auctionStarted` events?

3. **Check for middleware/guards:**

   - Is there authentication blocking the event?
   - Are there any middleware intercepting WebSocket events?

4. **Test with simpler payload:**

   ```typescript
   // In browser console
   wsService.socket.emit("startAuction", {}, (response) => {
     console.log("Response:", response);
   });
   ```

5. **Compare with working backend:**
   - Check if there's example/demo code that works
   - Compare event names and payload structures

---

## Success Indicators

You'll know it's working when:

✅ Browser console shows all expected logs
✅ Alert popup appears with player name
✅ Timer starts counting down
✅ Current player section populates
✅ "Start Auction" button becomes disabled
✅ "Sell Player" button becomes enabled
✅ Backend console shows auction started
✅ Other pages (team-owner, public) also update
✅ Team owners can start placing bids

---

## Related Documentation

- [WebSocket Guide](./WEBSOCKET-GUIDE.md)
- [Backend Compatibility](./BACKEND-COMPATIBILITY.md)
- [Admin Component](./src/app/pages/admin/README.md)
- [Teams Management](./TEAMS-MANAGEMENT-GUIDE.md)
