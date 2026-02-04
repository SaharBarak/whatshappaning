# EPIC-019: Community Features

**Status:** Proposed  
**Created:** 2026-02-04  
**Author:** Arc (Project Manager)

---

## Problem Statement

WhatsHappening is a solo experience:

1. **No community** - Users can't interact with each other
2. **No discussions** - Can't discuss predictions or patterns
3. **No shared insights** - Individual discoveries stay private
4. **Missing engagement** - No reason to return for social interaction

---

## Proposed Solution

**Community Features** for user interaction:

### 1. Comments & Reactions
- Comments on daily predictions
- Emoji reactions (🎯 accurate, 🤔 skeptical, etc.)
- Upvote helpful comments
- Anonymous or display name

### 2. Community Predictions
- Users submit their own predictions
- Community voting on accuracy
- Leaderboard of accurate predictors
- "Wisdom of crowds" aggregation

### 3. Discussion Forums
- Topic-based discussions
- Pattern analysis threads
- Strategy sharing
- Event-specific discussions (eclipses, retrogrades)

---

## Affected Components

| Component | Changes |
|-----------|---------|
| `backend/src/community/` | New - Comments, votes, forums |
| `backend/src/routes/community.js` | New - Community endpoints |
| `frontend/js/community.js` | New - Community UI |
| Database | New tables for comments, votes, threads |

---

## Success Criteria

- [ ] **Comments**: Add comments to predictions
- [ ] **Reactions**: Quick emoji feedback
- [ ] **Moderation**: Report/hide inappropriate content
- [ ] **Anonymous**: No account required (cookie-based identity)
- [ ] **Leaderboard**: Track prediction accuracy

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| Database schema | 2-3 hours |
| Comments API | 3-4 hours |
| Reactions system | 2-3 hours |
| Community predictions | 4-5 hours |
| Frontend UI | 4-5 hours |
| Moderation tools | 2-3 hours |
| **Total** | **17-23 hours** |

---

## Notes

Community features transform passive viewers into active participants. When users discuss predictions and share insights, they become invested in the platform. The leaderboard gamifies accuracy and encourages return visits.
