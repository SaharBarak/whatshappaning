# Email Digest & Newsletter

## Status
🟢 Backend Complete

## Acceptance Criteria
- [x] Subscribe/unsubscribe API endpoints
- [x] Double opt-in email confirmation
- [x] Daily digest emails with predictions & cosmic data
- [x] Weekly digest emails with upcoming events & patterns
- [x] Pattern alert emails for high-similarity matches (>80%)
- [x] Preference management (daily/weekly/alerts toggles)
- [x] Timezone-aware scheduling
- [x] Email logging and statistics
- [x] SendGrid + Mailgun provider support

## Technical Approach

### Backend (Complete)

**Database Schema** (`migrations/002_email_subscribers.sql`)
- `email_subscribers` - Subscriber records with preferences, tokens
- `email_logs` - Send history for debugging/analytics

**Email Service** (`src/email/`)
- `index.js` - Core service: subscribe, confirm, unsubscribe, preferences
- `digest.js` - Daily/weekly digest generation and sending
- `templates.js` - HTML/text email templates

**API Routes** (`src/routes/email.js`)
- `POST /api/email/subscribe` - New subscription
- `GET /api/email/confirm?token=` - Confirm subscription
- `GET /api/email/unsubscribe?token=` - One-click unsubscribe
- `POST /api/email/preferences` - Update preferences
- `GET /api/email/preferences?token=` - Get current preferences
- `GET /api/email/stats` - Subscriber/email statistics
- `POST /api/email/send-daily` - Admin: trigger daily digest
- `POST /api/email/send-weekly` - Admin: trigger weekly digest

**Scheduling** (`src/scheduler.js`)
- Daily digest: 8:00 AM UTC
- Weekly digest: Monday 8:00 AM UTC

### Frontend (Pending)
- Email signup form component
- Preference management UI
- Unsubscribe confirmation page

## Configuration

Required environment variables:
```
EMAIL_PROVIDER=sendgrid  # or 'mailgun'
SENDGRID_API_KEY=...     # if using SendGrid
MAILGUN_API_KEY=...      # if using Mailgun
MAILGUN_DOMAIN=...       # if using Mailgun
EMAIL_FROM=digest@whatshappening.app
EMAIL_FROM_NAME=What's Happening
APP_URL=https://whatshappening.app
```

## Out of Scope
- A/B testing for email content
- Advanced segmentation
- Email analytics dashboard
