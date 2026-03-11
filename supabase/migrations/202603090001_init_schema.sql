-- Initial schema for incentive-driven smoke monitoring
-- Hybrid model:
-- - Supabase: Postgres + Auth + RLS
-- - Custom backend: business logic, eligibility checks, payout writes

create extension if not exists pgcrypto;

-- Optional for geo matching in later phase:
-- create extension if not exists postgis;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- User profile mapped to auth.users
create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('sensor_owner', 'sponsor', 'admin')),
  display_name text,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_app_users_updated_at
before update on public.app_users
for each row execute function public.set_updated_at();

create table if not exists public.sensor_devices (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.app_users(id) on delete cascade,
  external_device_id text not null,
  provider text not null default 'purpleair',
  nickname text,
  install_lon double precision,
  install_lat double precision,
  status text not null default 'active' check (status in ('active', 'paused', 'retired')),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_device_id),
  check (install_lon is null or (install_lon >= -180 and install_lon <= 180)),
  check (install_lat is null or (install_lat >= -90 and install_lat <= 90))
);

create trigger trg_sensor_devices_updated_at
before update on public.sensor_devices
for each row execute function public.set_updated_at();

create table if not exists public.sponsor_campaigns (
  id uuid primary key default gen_random_uuid(),
  sponsor_user_id uuid not null references public.app_users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'ended')),
  hourly_reward_amount numeric(12,2) not null check (hourly_reward_amount >= 0),
  budget_limit numeric(12,2) not null check (budget_limit >= 0),
  reserved_budget numeric(12,2) not null default 0 check (reserved_budget >= 0),
  spent_budget numeric(12,2) not null default 0 check (spent_budget >= 0),
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at is null or start_at is null or end_at > start_at)
);

create trigger trg_sponsor_campaigns_updated_at
before update on public.sponsor_campaigns
for each row execute function public.set_updated_at();

create table if not exists public.reward_zones (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.sponsor_campaigns(id) on delete cascade,
  name text not null,
  center_lon double precision not null check (center_lon >= -180 and center_lon <= 180),
  center_lat double precision not null check (center_lat >= -90 and center_lat <= 90),
  radius_meters integer not null check (radius_meters > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_reward_zones_updated_at
before update on public.reward_zones
for each row execute function public.set_updated_at();

create table if not exists public.zone_enrollments (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.reward_zones(id) on delete cascade,
  device_id uuid not null references public.sensor_devices(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'left', 'blocked')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  created_at timestamptz not null default now(),
  unique (zone_id, device_id)
);

create table if not exists public.sensor_readings (
  id bigserial primary key,
  device_id uuid not null references public.sensor_devices(id) on delete cascade,
  observed_at timestamptz not null,
  observed_lon double precision,
  observed_lat double precision,
  pm25 double precision,
  humidity double precision,
  temperature_c double precision,
  is_online boolean not null,
  ingestion_source text,
  created_at timestamptz not null default now(),
  check (observed_lon is null or (observed_lon >= -180 and observed_lon <= 180)),
  check (observed_lat is null or (observed_lat >= -90 and observed_lat <= 90))
);

create table if not exists public.eligibility_checks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.sponsor_campaigns(id) on delete cascade,
  zone_id uuid not null references public.reward_zones(id) on delete cascade,
  device_id uuid not null references public.sensor_devices(id) on delete cascade,
  check_hour timestamptz not null,
  is_eligible boolean not null,
  reason_code text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (campaign_id, zone_id, device_id, check_hour)
);

create table if not exists public.reward_payouts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.sponsor_campaigns(id) on delete cascade,
  zone_id uuid not null references public.reward_zones(id) on delete cascade,
  device_id uuid not null references public.sensor_devices(id) on delete cascade,
  payout_hour timestamptz not null,
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'recorded' check (status in ('recorded', 'settled', 'reversed')),
  eligibility_check_id uuid references public.eligibility_checks(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (campaign_id, zone_id, device_id, payout_hour)
);

create table if not exists public.campaign_budget_ledger (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.sponsor_campaigns(id) on delete cascade,
  entry_type text not null check (entry_type in ('funding', 'reserve', 'payout', 'release', 'adjustment')),
  amount numeric(12,2) not null,
  reference_type text,
  reference_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.app_users(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.campaign_membership_stats (
  campaign_id uuid primary key references public.sponsor_campaigns(id) on delete cascade,
  active_zone_count integer not null default 0,
  active_device_count integer not null default 0,
  last_computed_at timestamptz
);

create index if not exists idx_sensor_devices_owner_user_id
  on public.sensor_devices (owner_user_id);

create index if not exists idx_sponsor_campaigns_sponsor_user_id
  on public.sponsor_campaigns (sponsor_user_id);

create index if not exists idx_reward_zones_campaign_id
  on public.reward_zones (campaign_id);

create index if not exists idx_zone_enrollments_device_id
  on public.zone_enrollments (device_id);

create index if not exists idx_zone_enrollments_zone_id
  on public.zone_enrollments (zone_id);

create index if not exists idx_sensor_readings_device_id_observed_at
  on public.sensor_readings (device_id, observed_at desc);

create index if not exists idx_eligibility_checks_campaign_hour
  on public.eligibility_checks (campaign_id, check_hour desc);

create index if not exists idx_reward_payouts_campaign_hour
  on public.reward_payouts (campaign_id, payout_hour desc);

create index if not exists idx_reward_payouts_device_hour
  on public.reward_payouts (device_id, payout_hour desc);

create index if not exists idx_campaign_budget_ledger_campaign_created
  on public.campaign_budget_ledger (campaign_id, created_at desc);

-- Helper role-check functions for RLS
create or replace function public.is_sensor_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users u
    where u.id = auth.uid()
      and u.role = 'sensor_owner'
  );
$$;

create or replace function public.is_sponsor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users u
    where u.id = auth.uid()
      and u.role = 'sponsor'
  );
$$;

-- RLS
alter table public.app_users enable row level security;
alter table public.sensor_devices enable row level security;
alter table public.sponsor_campaigns enable row level security;
alter table public.reward_zones enable row level security;
alter table public.zone_enrollments enable row level security;
alter table public.sensor_readings enable row level security;
alter table public.eligibility_checks enable row level security;
alter table public.reward_payouts enable row level security;
alter table public.campaign_budget_ledger enable row level security;
alter table public.audit_events enable row level security;
alter table public.campaign_membership_stats enable row level security;

-- app_users: self profile
create policy app_users_select_self
  on public.app_users
  for select
  using (id = auth.uid());

create policy app_users_insert_self
  on public.app_users
  for insert
  with check (id = auth.uid());

create policy app_users_update_self
  on public.app_users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- sensor_devices: owners can CRUD own devices
create policy sensor_devices_owner_select
  on public.sensor_devices
  for select
  using (owner_user_id = auth.uid());

create policy sensor_devices_owner_insert
  on public.sensor_devices
  for insert
  with check (
    owner_user_id = auth.uid()
    and public.is_sensor_owner()
  );

create policy sensor_devices_owner_update
  on public.sensor_devices
  for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy sensor_devices_owner_delete
  on public.sensor_devices
  for delete
  using (owner_user_id = auth.uid());

-- sponsor_campaigns: sponsor can CRUD own campaigns
create policy sponsor_campaigns_owner_select
  on public.sponsor_campaigns
  for select
  using (sponsor_user_id = auth.uid());

create policy sponsor_campaigns_owner_insert
  on public.sponsor_campaigns
  for insert
  with check (
    sponsor_user_id = auth.uid()
    and public.is_sponsor()
  );

create policy sponsor_campaigns_owner_update
  on public.sponsor_campaigns
  for update
  using (sponsor_user_id = auth.uid())
  with check (sponsor_user_id = auth.uid());

create policy sponsor_campaigns_owner_delete
  on public.sponsor_campaigns
  for delete
  using (sponsor_user_id = auth.uid());

-- reward_zones: sponsor manages zones through campaign ownership
create policy reward_zones_sponsor_select
  on public.reward_zones
  for select
  using (
    exists (
      select 1
      from public.sponsor_campaigns c
      where c.id = reward_zones.campaign_id
        and c.sponsor_user_id = auth.uid()
    )
  );

create policy reward_zones_sponsor_insert
  on public.reward_zones
  for insert
  with check (
    exists (
      select 1
      from public.sponsor_campaigns c
      where c.id = reward_zones.campaign_id
        and c.sponsor_user_id = auth.uid()
    )
  );

create policy reward_zones_sponsor_update
  on public.reward_zones
  for update
  using (
    exists (
      select 1
      from public.sponsor_campaigns c
      where c.id = reward_zones.campaign_id
        and c.sponsor_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sponsor_campaigns c
      where c.id = reward_zones.campaign_id
        and c.sponsor_user_id = auth.uid()
    )
  );

create policy reward_zones_sponsor_delete
  on public.reward_zones
  for delete
  using (
    exists (
      select 1
      from public.sponsor_campaigns c
      where c.id = reward_zones.campaign_id
        and c.sponsor_user_id = auth.uid()
    )
  );

-- zone_enrollments: sensor owner can manage enrollments for owned devices
create policy zone_enrollments_owner_select
  on public.zone_enrollments
  for select
  using (
    exists (
      select 1
      from public.sensor_devices d
      where d.id = zone_enrollments.device_id
        and d.owner_user_id = auth.uid()
    )
  );

create policy zone_enrollments_owner_insert
  on public.zone_enrollments
  for insert
  with check (
    exists (
      select 1
      from public.sensor_devices d
      where d.id = zone_enrollments.device_id
        and d.owner_user_id = auth.uid()
    )
  );

create policy zone_enrollments_owner_update
  on public.zone_enrollments
  for update
  using (
    exists (
      select 1
      from public.sensor_devices d
      where d.id = zone_enrollments.device_id
        and d.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sensor_devices d
      where d.id = zone_enrollments.device_id
        and d.owner_user_id = auth.uid()
    )
  );

create policy zone_enrollments_owner_delete
  on public.zone_enrollments
  for delete
  using (
    exists (
      select 1
      from public.sensor_devices d
      where d.id = zone_enrollments.device_id
        and d.owner_user_id = auth.uid()
    )
  );

-- sensor_readings: owners can read own device readings; only service inserts/writes
create policy sensor_readings_owner_select
  on public.sensor_readings
  for select
  using (
    exists (
      select 1
      from public.sensor_devices d
      where d.id = sensor_readings.device_id
        and d.owner_user_id = auth.uid()
    )
  );

-- eligibility_checks: sponsor can read checks for own campaigns
create policy eligibility_checks_sponsor_select
  on public.eligibility_checks
  for select
  using (
    exists (
      select 1
      from public.sponsor_campaigns c
      where c.id = eligibility_checks.campaign_id
        and c.sponsor_user_id = auth.uid()
    )
  );

-- reward_payouts: owner reads own payouts; sponsor reads own campaign payouts
create policy reward_payouts_owner_select
  on public.reward_payouts
  for select
  using (
    exists (
      select 1
      from public.sensor_devices d
      where d.id = reward_payouts.device_id
        and d.owner_user_id = auth.uid()
    )
  );

create policy reward_payouts_sponsor_select
  on public.reward_payouts
  for select
  using (
    exists (
      select 1
      from public.sponsor_campaigns c
      where c.id = reward_payouts.campaign_id
        and c.sponsor_user_id = auth.uid()
    )
  );

-- campaign budget: sponsor can read own campaign ledger
create policy campaign_budget_ledger_sponsor_select
  on public.campaign_budget_ledger
  for select
  using (
    exists (
      select 1
      from public.sponsor_campaigns c
      where c.id = campaign_budget_ledger.campaign_id
        and c.sponsor_user_id = auth.uid()
    )
  );

-- stats: sponsor can read own campaign stats
create policy campaign_membership_stats_sponsor_select
  on public.campaign_membership_stats
  for select
  using (
    exists (
      select 1
      from public.sponsor_campaigns c
      where c.id = campaign_membership_stats.campaign_id
        and c.sponsor_user_id = auth.uid()
    )
  );

-- audit events: sponsors and sensor owners can read their own actor events
create policy audit_events_actor_select
  on public.audit_events
  for select
  using (actor_user_id = auth.uid());
