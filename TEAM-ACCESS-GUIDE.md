# Team Owner Access Guide

## 🔐 How Team Identification Works

The team-owner page now uses **URL-based team identification** through route parameters.

## 📍 Access Your Team Dashboard

Each team accesses their dashboard through a unique URL:

```
http://localhost:4200/team-owner/{TEAM_ID}
```

### Examples:

- **Team Eagles:** `http://localhost:4200/team-owner/673e8c5a2b1c3d4e5f6a7b8c`
- **Team Lions:** `http://localhost:4200/team-owner/673e8c5a2b1c3d4e5f6a7b8d`
- **Team Tigers:** `http://localhost:4200/team-owner/673e8c5a2b1c3d4e5f6a7b8e`

## 🔍 How to Get Your Team ID

### Option 1: From Backend API

```bash
curl http://localhost:3000/teams
```

This will return all teams with their IDs:

```json
[
  {
    "_id": "673e8c5a2b1c3d4e5f6a7b8c",
    "name": "Eagles",
    "budget": 100000,
    "players": []
  },
  {
    "_id": "673e8c5a2b1c3d4e5f6a7b8d",
    "name": "Lions",
    "budget": 100000,
    "players": []
  }
]
```

### Option 2: From Admin Panel (Future Enhancement)

Once created, admin can generate team URLs

### Option 3: From Database

```javascript
// MongoDB query
db.teams.find({}, { name: 1, _id: 1 });
```

## ✨ What Happens When You Access

1. **Route loads:** `/team-owner/YOUR-TEAM-ID`
2. **Component reads team ID** from URL
3. **Fetches team data** from API (name, budget, players)
4. **Displays personalized dashboard** with your team info
5. **Bids are sent** with your team ID

## 🎯 Features

### ✅ Automatic Team Loading

- Team name shown in header
- Current budget displayed
- No manual team selection needed

### ✅ Personalized Experience

- "YOU" indicator when you're highest bidder
- Congratulations message when you win
- Budget updates in real-time

### ✅ Error Handling

- Clear error message if team ID not found
- Instructions on proper URL format
- Prevents bidding without valid team

## 🚫 Error Messages

### Team Not Found

If you see this error:

```
❌ Team Not Found
The team ID provided in the URL could not be found.
Please check the URL and try again.
Example: /team-owner/your-team-id
```

**Possible causes:**

- Incorrect team ID in URL
- Team deleted from database
- Backend not running

## 🔧 Technical Implementation

### Route Configuration

```typescript
// app.routes.ts
{
  path: 'team-owner/:teamId',
  component: TeamOwnerComponent,
  title: 'Team Owner Dashboard'
}
```

### Component Logic

```typescript
// team-owner.component.ts
ngOnInit() {
  // Read team ID from route
  const teamId = this.route.snapshot.paramMap.get('teamId');

  // Fetch team data from API
  this.teamsService.getTeamById(teamId).subscribe(team => {
    this.teamName.set(team.name);
    this.budget.set(team.budget);
  });

  // Bids include team ID
  this.wsService.sendBid(teamId);
}
```

## 🌐 Deployment Considerations

### Production URLs

```
https://auction.example.com/team-owner/673e8c5a2b1c3d4e5f6a7b8c
```

### Shareable Links

Teams can bookmark or share their specific URLs:

- Save to browser bookmarks
- Share via email/SMS
- Display as QR code

## 🔮 Future Enhancements

### Option 1: Query Parameter Alternative

```
/team-owner?teamId=673e8c5a2b1c3d4e5f6a7b8c
```

### Option 2: Team Selection Page

```
/team-owner → Shows list of teams to select
/team-owner/selected → After selection
```

### Option 3: Authentication

```
Login → JWT token → Team ID from token
```

### Option 4: Short Codes

```
/team-owner/EAGLES
/team-owner/LIONS
```

Map friendly names to IDs

## 📋 Quick Reference

| Scenario         | URL Pattern            | Example                   |
| ---------------- | ---------------------- | ------------------------- |
| Access dashboard | `/team-owner/{teamId}` | `/team-owner/673e8c5a...` |
| Team not found   | Shows error screen     | N/A                       |
| No team ID       | Shows error screen     | N/A                       |

## 🎪 Testing

### Test with Multiple Teams

1. Open multiple browser windows
2. Each with different team ID
3. Start auction from admin
4. Place bids from different teams
5. See real-time updates in all windows

### Test Error Handling

```
http://localhost:4200/team-owner/invalid-id
→ Should show "Team Not Found" error
```

## 💡 Benefits

✅ **Simple** - Just share URL, no login needed  
✅ **Secure** - Each team has unique URL  
✅ **Flexible** - Easy to add auth later  
✅ **Bookmarkable** - Teams can save their URL  
✅ **Shareable** - Can forward URL to team members

---

**Current Implementation:** Route Parameter  
**Status:** ✅ Production Ready  
**Auth Required:** ❌ Not yet (team ID in URL)
