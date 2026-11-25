# CLAUDE.md

## Bibles: CRM sync + feed compliance (org-wide law, 2026-11-24)

Two laws live in `RealSavvy/agnt-admin/docs/` and are served by the agnt-knowledge MCP. Read the bible before touching that area; if code contradicts it, the bible wins.

- **CRM SYNC BIBLE** (`docs/CRM-SYNC-BIBLE.md`, knowledge key `crm-sync-bible`): our CRM (agnt-crm), Follow Up Boss and SureSend are twins. They hold the same contacts, tags, stages, assignments, notes, events and deletions, in both directions, at all times. Connecting FUB or SureSend means syncing at the next interval; backlog pushes never use FUB `/v1/events` (it fires action plans); a one-way or stalled sync is a bug.
- **FEED COMPLIANCE BIBLE** (`docs/FEED-COMPLIANCE-BIBLE.md`, knowledge key `feed-compliance-bible`): every MLS disclaimer and attribution rule is met before approval, and the source of those rules is the compliance API (`/api/compliance/*`), never a hand-copied string.
