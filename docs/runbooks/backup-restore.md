# Backup & Disaster Recovery Runbook

> Audit 12 P0.9 — ToneCraft data lives in two places:
> 1. **Neon Postgres** — all relational data (users, chats, messages, prompts, knowledge file records, subscriptions, usage).
> 2. **Cloudflare R2** — uploaded file objects (attachments + knowledge documents) under `uploads/` and `knowledge/`.

## RPO / RTO targets

| Tier | Target |
|---|---|
| Database (Neon PITR) | RPO ≤ 1 min (default) · RTO ≤ 15 min |
| R2 file objects | RPO ≤ 24 h (lifecycle snapshot) · RTO ≤ 1 h |

---

## 1. Database (Neon Postgres)

### Continuous backups (already on by default)

Neon provides **point-in-time recovery (PITR)** for all paid branches and 7-day PITR on
the free tier. Keep it enabled — do not disable.

- Verify: **Neon Console → Branches → (branch) → Backup** shows PITR enabled.
- The `main` branch (production) must be the PITR target. **Never `reset` the prod branch from an older snapshot without a restore drill.**

### Scheduled snapshots (recommended)

Neon free tier keeps 7 days of PITR. For a hard snapshot baseline:

1. **Neon Console → Branches → main → Create branch → "Create as copy"** at least weekly.
   Name it `backup-yyyy-mm-dd`.
2. Retention: delete snapshots older than 30 days (PITR covers the last 7 anyway).

### Restore procedure (database)

1. **Fail fast — stop writes.** Deploy `next.config`/env so the app is read-only or take a
   maintenance window. Point `DATABASE_URL` at a new branch, not the live one.
2. In Neon Console, create a **new branch from the target PITR time**:
   `Branches → New branch → Data from → Point in time → pick timestamp`.
3. Point the app at the new branch (update `DATABASE_URL` / `DIRECT_URL` in the env and redeploy).
4. Verify: `SELECT count(*) FROM "Message"` matches expectations; spot-check a chat.

### Restore drill (test quarterly)

1. Create a copy branch, restore it, and boot a staging deployment against it.
2. Confirm auth (Clerk), billing (Paddle), and knowledge retrieval all work against the copy.

---

## 2. Cloudflare R2 (file objects)

### Lifecycle rules (recommended)

R2 does not keep deleted-object history by itself. Add a lifecycle rule to retain deleted
objects for 30 days so accidental deletes are recoverable:

```
Bucket → Lifecycle Rules → New rule
- Rule name: retain-deleted-30d
- Match prefix: (all)
- Action: Delete expired objects
- Expiration: 30 days after deletion
```

Additionally, **export a copy of uploads** weekly to a separate bucket or to another region
(billing: negligible for typical ToneCraft volume).

### Restore procedure (objects)

1. **R2 Console → Bucket → Objects** → `uploads/` or `knowledge/`.
2. If a file was deleted < 30 days and lifecycle retention is on, the object is still there —
   restore via the console or `s3 cp` from the deleted marker.
3. If the whole bucket is lost, restore from the weekly export (re-upload via the export tooling).

---

## 3. What NOT to do

- ❌ Do not store backups only in the same Neon project (branch copies share the PITR window).
  Weekly branch snapshots mitigate this.
- ❌ Do not disable PITR to "save money".
- ❌ Do not run `prisma migrate reset` against production.
- ❌ Do not restore by hand-editing rows; always restore the whole branch.

---

## 4. Incident checklist

1. Confirm scope: database, R2, or both.
2. Follow the matching restore procedure above.
3. After restore, run the smoke journeys: login → open chat → send message → open library →
   download an export.
4. File a post-mortem entry in `docs/audits/` if the restore exposed a gap in this runbook.
