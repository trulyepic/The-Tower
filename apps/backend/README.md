# Backend (Planned)

Target stack:
- Supabase (Postgres/Auth/RLS/Edge Functions)

Responsibilities:
1. Authoritative quest start/claim validation
2. Reward and XP calculation
3. Class/job unlock validation
4. Daily reset and progression consistency
5. Audit/event logs for balancing and anti-cheat

Implementation note:
- Keep gameplay formulas in shared modules where practical, but enforce final reward validation server-side.

