-- =============================================================================
-- Retention policy (Phase 8.14 — D2)
-- -----------------------------------------------------------------------------
-- UsageRecord grows one row per AI call forever; Notification grows per event
-- and is only removed by user-initiated clearAll. Run on a schedule (e.g. a
-- daily cron on the DB host, or Vercel Cron → a maintenance endpoint) to keep
-- the hot tables bounded.
--
-- Suggested schedule: daily at 03:00 UTC. Both statements are idempotent.
-- =============================================================================

-- Usage history: keep 90 days of per-call records (analytics need ~30d; 90d
-- is a safe margin for trending).
DELETE FROM "UsageRecord"
 WHERE "createdAt" < NOW() - INTERVAL '90 days';

-- Read notifications: keep 90 days of read rows (they are soft-deleted via
-- readAt; clearAll hard-deletes). Unread notifications are always kept.
DELETE FROM "Notification"
 WHERE "readAt" IS NOT NULL
   AND "createdAt" < NOW() - INTERVAL '90 days';
