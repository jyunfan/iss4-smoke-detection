# Next.js + Supabase Project Structure (Hybrid)

This is the recommended structure for the two-role system (`sensor_owner`, `sponsor`) with server-owned payout logic.

## Directory Layout

```text
.
├─ app/
│  ├─ (public)/
│  │  ├─ page.tsx
│  │  └─ login/page.tsx
│  ├─ (owner)/
│  │  ├─ owner/layout.tsx
│  │  ├─ owner/dashboard/page.tsx
│  │  ├─ owner/devices/page.tsx
│  │  ├─ owner/zones/page.tsx
│  │  └─ owner/rewards/page.tsx
│  ├─ (sponsor)/
│  │  ├─ sponsor/layout.tsx
│  │  ├─ sponsor/dashboard/page.tsx
│  │  ├─ sponsor/campaigns/page.tsx
│  │  └─ sponsor/campaigns/[campaignId]/
│  │     ├─ zones/page.tsx
│  │     ├─ settings/page.tsx
│  │     └─ rewards/page.tsx
│  ├─ api/
│  │  ├─ owner/
│  │  │  ├─ devices/route.ts
│  │  │  ├─ zones/route.ts
│  │  │  └─ rewards/route.ts
│  │  ├─ sponsor/
│  │  │  ├─ campaigns/route.ts
│  │  │  ├─ campaigns/[campaignId]/zones/route.ts
│  │  │  ├─ campaigns/[campaignId]/settings/route.ts
│  │  │  └─ campaigns/[campaignId]/rewards/route.ts
│  │  ├─ jobs/
│  │  │  └─ payout-hourly/route.ts
│  │  └─ webhooks/
│  │     └─ sensor-provider/route.ts
│  └─ layout.tsx
├─ components/
│  ├─ owner/
│  ├─ sponsor/
│  ├─ maps/
│  └─ shared/
├─ lib/
│  ├─ auth/
│  │  ├─ roles.ts
│  │  └─ guards.ts
│  ├─ supabase/
│  │  ├─ client.ts
│  │  ├─ server.ts
│  │  └─ service-role.ts
│  ├─ db/
│  │  ├─ queries/
│  │  │  ├─ owner.ts
│  │  │  ├─ sponsor.ts
│  │  │  └─ payout.ts
│  │  └─ mutations/
│  │     ├─ owner.ts
│  │     ├─ sponsor.ts
│  │     └─ payout.ts
│  ├─ domain/
│  │  ├─ eligibility/
│  │  │  ├─ rules.ts
│  │  │  └─ evaluator.ts
│  │  ├─ payouts/
│  │  │  ├─ calculator.ts
│  │  │  └─ ledger.ts
│  │  └─ zones/
│  │     └─ geo.ts
│  ├─ validation/
│  │  ├─ owner.ts
│  │  └─ sponsor.ts
│  └─ types/
│     ├─ db.ts
│     ├─ owner.ts
│     └─ sponsor.ts
├─ supabase/
│  └─ migrations/
│     └─ 202603090001_init_schema.sql
├─ db_schema.md
└─ docs/
   └─ rls_policy_map.md
```

## API Boundaries

### Owner APIs

- `GET /api/owner/devices`: list owned devices
- `POST /api/owner/devices`: register device
- `GET /api/owner/zones`: list joinable/joined zones for owner devices
- `POST /api/owner/zones`: join zone
- `GET /api/owner/rewards`: payout history for owned devices

### Sponsor APIs

- `GET /api/sponsor/campaigns`: list sponsor campaigns
- `POST /api/sponsor/campaigns`: create campaign
- `PATCH /api/sponsor/campaigns/[campaignId]/settings`: update budget and reward amount
- `GET /api/sponsor/campaigns/[campaignId]/zones`: list zones
- `POST /api/sponsor/campaigns/[campaignId]/zones`: add zone
- `PATCH /api/sponsor/campaigns/[campaignId]/zones`: edit zone
- `GET /api/sponsor/campaigns/[campaignId]/rewards`: payout records + aggregates

### Internal Job API

- `POST /api/jobs/payout-hourly`
  - protected by secret token or platform scheduler auth
  - uses service-role DB client
  - steps:
    1. find active campaigns
    2. find active zones and enrolled sensors
    3. evaluate eligibility
    4. write `eligibility_checks`
    5. write `reward_payouts`
    6. write `campaign_budget_ledger`
    7. update campaign spent totals

## Auth + Authorization Strategy

- Use Supabase Auth for identity.
- Create `app_users` row at first login with role.
- Frontend reads only through role-specific APIs.
- API handlers check:
  - authenticated user exists
  - role matches expected role
  - record ownership (campaign owner, device owner)
- Service role is only used in server-side jobs and never exposed to browser.

## Query Strategy

- Read-heavy pages (`dashboard`, `rewards`) should use server components or API aggregation endpoints.
- Keep payout writes in transactions to avoid partial ledger writes.
- Use append-only pattern for payout and budget ledger tables.

## First Build Order

1. Auth bootstrap + `app_users` role provisioning
2. Owner device registration flow
3. Sponsor campaign + zone + settings flow
4. Sponsor reward history read endpoint
5. Hourly payout job endpoint (dry-run mode first)
6. Enable real write mode for payouts and budget ledger

## Minimal API Contract Examples

### Create zone

```json
{
  "campaignId": "uuid",
  "name": "Zone A",
  "centerLon": -122.084,
  "centerLat": 37.422,
  "radiusMeters": 1500
}
```

### Update campaign settings

```json
{
  "hourlyRewardAmount": 25.0,
  "budgetLimit": 5000.0,
  "status": "active"
}
```

### List reward history response

```json
{
  "items": [
    {
      "payoutHour": "2026-03-09T09:00:00Z",
      "zoneName": "Zone A",
      "sensorCount": 7,
      "amount": 175.0,
      "status": "recorded"
    }
  ],
  "summary": {
    "totalAmount": 2380.0,
    "totalRows": 96
  }
}
```
