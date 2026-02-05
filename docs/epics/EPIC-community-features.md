# Community Features

## Status
🟢 Backend Complete

## Acceptance Criteria
- [x] Comments on predictions
- [x] Emoji reactions (👍 👎 🎯 🔥 🤔 😮 💎 🚀)
- [x] Community predictions with voting
- [x] Accuracy leaderboard
- [x] Anonymous user identity (cookie-based)

## Technical Approach

### Backend (Complete)

**Database Schema** (`migrations/005_community.sql`)
- `community_users` - Anonymous users with cookie ID
- `prediction_comments` - Comments on predictions
- `prediction_reactions` - Emoji reactions
- `community_predictions` - User-submitted predictions
- `community_votes` - Votes on community predictions
- `user_accuracy` - Leaderboard tracking

**API Endpoints** (`/api/community/`)

| Endpoint | Description |
|----------|-------------|
| `GET /me` | Get current user info |
| `PATCH /me` | Update display name |
| `GET /comments/:outcomeId` | Get comments |
| `POST /comments/:outcomeId` | Add comment |
| `DELETE /comments/:id` | Delete comment |
| `GET /reactions/:outcomeId` | Get reactions |
| `POST /reactions/:outcomeId` | Toggle reaction |
| `GET /predictions` | List community predictions |
| `POST /predictions` | Create prediction |
| `GET /predictions/:id/votes` | Get votes |
| `POST /predictions/:id/vote` | Vote on prediction |
| `GET /leaderboard` | Get accuracy leaderboard |
| `GET /emojis` | Get allowed emojis |

### Anonymous Identity
- Cookie-based (`wh_anon_id`)
- Auto-generated on first visit
- Hashed for storage (SHA256)
- Optional display name
- Avatar seed for consistent avatars

### Frontend (Pending)
- Comments UI component
- Reaction buttons
- Community predictions page
- Leaderboard page

## Security
- Content sanitization (no HTML/XSS)
- Rate limiting applies
- Soft delete for comments
- User can only delete own comments

## Out of Scope
- User accounts/authentication
- Direct messaging
- Content moderation tools
- Reputation system
