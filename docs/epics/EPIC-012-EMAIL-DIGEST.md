# EPIC-012: Email Digest & Newsletter

**Status:** Proposed  
**Created:** 2026-02-04  
**Author:** Arc (Project Manager)

---

## Problem Statement

WhatsHappening has push notifications (EPIC-005), but:

1. **Not everyone enables push** - Many users disable browser notifications
2. **No email option** - Users can't receive predictions via email
3. **No scheduled summaries** - No daily/weekly digest option
4. **Missing audience** - Email reaches users push notifications can't

Email remains the most reliable way to reach users.

---

## Proposed Solution

Implement **Email Digest & Newsletter** system:

### 1. Digest Types
- **Daily Digest** - Morning summary of today's predictions
- **Weekly Digest** - Week ahead outlook every Sunday
- **Pattern Alerts** - Immediate email when >80% pattern match

### 2. Email Content
- Today's key predictions with probabilities
- Notable cosmic events (eclipses, retrogrades)
- Pattern matches and historical comparisons
- Quick link to full dashboard

### 3. Subscription Management
- Email signup form (no account required)
- Preference selection (daily/weekly/alerts)
- One-click unsubscribe
- GDPR compliant

---

## Email Template Example

```
Subject: 🌙 What's Happening — Feb 4, 2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TODAY'S PREDICTIONS

📈 Market Volatility: 73% [HIGH]
   Contributing: Full Moon, Mercury Direct

🌕 Moon: Full Moon in Leo (96%)
☿️ Mercury: Direct in Aquarius
🎴 Tarot: The Tower

⚠️ PATTERN ALERT
85% match with Feb 14, 2024
What happened then: SPX -2.1% over 3 days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

View full dashboard →

Unsubscribe | Manage preferences
```

---

## Affected Components

| Component | Changes |
|-----------|---------|
| `backend/src/email/` | New - Email service |
| `backend/src/routes/api.js` | Subscription endpoints |
| `backend/src/scheduler.js` | Digest scheduling |
| `backend/templates/` | New - Email templates |
| `frontend/index.html` | Email signup form |

---

## Success Criteria

- [ ] **Email Signup**: Simple form, no account needed
- [ ] **Daily Digest**: Sends at configured time (default 7 AM)
- [ ] **Weekly Digest**: Sends Sunday morning
- [ ] **Pattern Alerts**: Immediate on detection
- [ ] **Unsubscribe**: One-click, instant
- [ ] **Deliverability**: >95% inbox placement

---

## Tasks (Post-Approval)

1. Choose email provider (SendGrid, Mailgun, or SES)
2. Create subscribers database table
3. Build email templates (HTML + plain text)
4. Implement subscription endpoints
5. Add digest scheduling to scheduler.js
6. Create signup form in frontend
7. Implement unsubscribe flow
8. Test deliverability

---

## Technical Approach

```javascript
// backend/src/email/digest.js
const sgMail = require('@sendgrid/mail');

async function sendDailyDigest() {
  const subscribers = await getActiveSubscribers('daily');
  const predictions = await getTodayPredictions();
  const template = renderDigestTemplate(predictions);
  
  for (const subscriber of subscribers) {
    await sgMail.send({
      to: subscriber.email,
      from: 'digest@whatshappening.app',
      subject: `🌙 What's Happening — ${formatDate(new Date())}`,
      html: template,
      text: toPlainText(template)
    });
  }
}

// Schedule: 7 AM UTC daily
cron.schedule('0 7 * * *', sendDailyDigest);
```

---

## Database Schema

```sql
CREATE TABLE email_subscribers (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  preferences JSONB DEFAULT '{
    "daily": true,
    "weekly": false,
    "alerts": true
  }',
  timezone TEXT DEFAULT 'UTC',
  confirmed BOOLEAN DEFAULT false,
  confirm_token TEXT,
  unsubscribe_token TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_sent TIMESTAMP
);
```

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| Email provider setup | 1-2 hours |
| Database & endpoints | 2-3 hours |
| Email templates | 3-4 hours |
| Digest scheduling | 2-3 hours |
| Signup form | 1-2 hours |
| Testing & deliverability | 2-3 hours |
| **Total** | **11-17 hours** |

---

## Notes

Email complements push notifications - it reaches users who don't enable push, provides a permanent record, and works across all devices. The digest format gives users a quick summary without requiring them to visit the site daily, while still driving traffic for those who want more detail.
