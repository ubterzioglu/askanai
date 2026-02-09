# Database

## Key Tables

- `polls`
  - public poll metadata
  - internal: `creator_key_hash`, `created_by_user_id`
- `questions`, `options`
  - poll structure
- `responses`, `answers`
  - votes / answers (internal; not publicly readable)
  - internal: `ip_hash`, `user_agent_hash`
- `comments`
  - public discussion (publicly readable only via view)
  - internal: `ip_hash`, `text_hash` for duplicate control
- `tickets`
  - moderation/reports (admin-only)
- `poll_views`
  - view tracking (internal; count exposed via API)
- `abuse_events`
  - backend-only rate limiting telemetry

## Public Views

- `polls_public`: safe public poll fields (no `creator_key_hash`, no `created_by_user_id`)
- `comments_public`: safe public comments (only `visible`, no user identifiers)

## Privacy Guarantees

- Sensitive columns are protected by column-level `REVOKE SELECT` for `anon` and `authenticated`.
- RLS is enabled for all tables; permissive client-write policies are removed in `20260209223000_security_hardening_v1.sql`.

