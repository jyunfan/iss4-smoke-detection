# RLS Policy Map

This file maps each table to intended access by actor.

## Actors

- `sensor_owner`: authenticated user with `app_users.role = sensor_owner`
- `sponsor`: authenticated user with `app_users.role = sponsor`
- `service_role`: backend server key, bypasses RLS in Supabase

## Table Access Matrix

| Table | Sensor Owner | Sponsor | Service Role |
|---|---|---|---|
| `app_users` | read/update own row | read/update own row | full |
| `sensor_devices` | CRUD own devices | none | full |
| `sponsor_campaigns` | none | CRUD own campaigns | full |
| `reward_zones` | none | CRUD zones under own campaigns | full |
| `zone_enrollments` | CRUD on owned devices | optional read via API aggregation | full |
| `sensor_readings` | read own devices | no direct read by default | full |
| `eligibility_checks` | no direct read by default | read own campaign checks | full |
| `reward_payouts` | read own device payouts | read own campaign payouts | full |
| `campaign_budget_ledger` | none | read own campaign ledger | full |
| `campaign_membership_stats` | none | read own campaign stats | full |
| `audit_events` | read own actor events | read own actor events | full |

## Notes

- Reward and eligibility writes should be server-owned. Do not allow browser clients to insert into:
  - `eligibility_checks`
  - `reward_payouts`
  - `campaign_budget_ledger`
- If sponsor needs owner-level analytics, expose curated API endpoints instead of broad table grants.
- Keep RLS simple and strict first, then open scoped policies when needed by real UI use cases.
