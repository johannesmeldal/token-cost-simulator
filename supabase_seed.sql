-- ============================================================
-- AI Governance Simulator — Supabase schema + seed
-- Kjør dette i Supabase SQL Editor (Database → SQL Editor → New query)
-- ============================================================

-- ---- TABLES ------------------------------------------------

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  total_budget_credits bigint not null,
  currency text default 'NOK',
  tokens_per_nok integer default 10000,
  created_at timestamptz default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  allocated_credits bigint default 0,
  manager_user_id uuid, -- FK added after users table exists (see below)
  created_at timestamptz default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  team_id uuid references teams(id) on delete set null,
  name text not null,
  role text check (role in ('org_admin', 'team_admin', 'developer')) default 'developer',
  simulation_profile text check (simulation_profile in ('normal_developer', 'power_user', 'intern', 'experimental_user')) default 'normal_developer',
  quota_credits bigint default 0,
  is_enabled boolean default true,
  created_at timestamptz default now()
);

-- ---- MIGRATION: rename token-named columns to credits ------
-- Disse feltene har alltid lagret kreditter, ikke rå tokens (se CLAUDE.md).
-- Guardet med information_schema-sjekk slik at dette er trygt å kjøre både
-- mot en frisk database (kolonnene heter allerede *_credits over) og mot en
-- eksisterende database som fortsatt har de gamle *_tokens-navnene.
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'organizations' and column_name = 'total_budget_tokens') then
    alter table organizations rename column total_budget_tokens to total_budget_credits;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'teams' and column_name = 'allocated_tokens') then
    alter table teams rename column allocated_tokens to allocated_credits;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'users' and column_name = 'quota_tokens') then
    alter table users rename column quota_tokens to quota_credits;
  end if;
end $$;

-- Add FK from teams.manager_user_id → users.id (deferred to avoid circular dependency).
-- Drop-then-add makes this safe to re-run — "add constraint" alone is not idempotent.
alter table teams drop constraint if exists fk_team_manager;
alter table teams
  add constraint fk_team_manager
  foreign key (manager_user_id)
  references users(id)
  on delete set null
  not valid; -- not valid = skips retroactive check, fine for seed data

create table if not exists governance_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade unique,
  budget_structure jsonb default '{"orgBudgetOnly": true, "teamBudgets": false, "individualQuotas": false}',
  enforcement text check (enforcement in ('soft', 'hard')) default 'soft',
  chargeback text check (chargeback in ('disabled', 'team', 'individual')) default 'disabled',
  transparency jsonb default '{
    "showIndividualToOrgAdmin": true,
    "showIndividualToTeamAdmin": true,
    "anonymizationForTeamAdmin": false,
    "showIndividualToDeveloper": false,
    "showChargebackToDeveloper": false,
    "showForecast": true
  }',
  updated_at timestamptz default now()
);

-- ---- SEED DATA ---------------------------------------------

-- Organization
-- on conflict = trygt å kjøre scriptet flere ganger; oppdaterer eksisterende rad
-- i stedet for å feile på duplicate key eller kreve manuell truncate først.
insert into organizations (id, name, total_budget_credits, currency, tokens_per_nok)
values ('00000000-0000-0000-0000-000000000001', 'Avinor Digital', 10000000, 'NOK', 10000)
on conflict (id) do update set
  name = excluded.name,
  total_budget_credits = excluded.total_budget_credits,
  currency = excluded.currency,
  tokens_per_nok = excluded.tokens_per_nok;

-- Teams (manager_user_id filled in after users are inserted)
-- anker: 3 900 inkluderte kreditter/bruker/mnd.
insert into teams (id, organization_id, name, allocated_credits)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Platform Team', 22000),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Passenger Experience', 20000),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Ops & Infrastructure', 20000),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Data & Analytics', 12000)
on conflict (id) do update set
  name = excluded.name,
  organization_id = excluded.organization_id,
  allocated_credits = excluded.allocated_credits;

-- Users
insert into users (id, organization_id, team_id, name, role, simulation_profile, quota_credits)
values
  -- Org Admin
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', null, 'Johannes M.', 'org_admin', 'normal_developer', 0),

  -- Platform Team — team admin
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Kari L.', 'team_admin', 'normal_developer', 3000),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Per H.', 'developer', 'power_user', 7000),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Anna S.', 'developer', 'normal_developer', 3000),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ole T.', 'developer', 'experimental_user', 6000),
  ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ida K.', 'developer', 'intern', 1000),

  -- Passenger Experience — team admin
  ('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Mats B.', 'team_admin', 'normal_developer', 2500),
  ('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Sara N.', 'developer', 'power_user', 6500),
  ('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Lars E.', 'developer', 'normal_developer', 2500),
  ('20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Nina R.', 'developer', 'normal_developer', 2500),
  ('20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Erik V.', 'developer', 'intern', 800),

  -- Ops & Infrastructure — team admin
  ('20000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Hanne G.', 'team_admin', 'normal_developer', 2500),
  ('20000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Tor A.', 'developer', 'experimental_user', 6000),
  ('20000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Frida M.', 'developer', 'normal_developer', 2500),
  ('20000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Bjørn C.', 'developer', 'power_user', 6500),

  -- Data & Analytics — team admin
  ('20000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Line D.', 'team_admin', 'normal_developer', 2000),
  ('20000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Stian F.', 'developer', 'power_user', 5500),
  ('20000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Camilla W.', 'developer', 'normal_developer', 2000)
on conflict (id) do update set
  organization_id = excluded.organization_id,
  team_id = excluded.team_id,
  name = excluded.name,
  role = excluded.role,
  simulation_profile = excluded.simulation_profile,
  quota_credits = excluded.quota_credits;

-- Set team managers
update teams set manager_user_id = '20000000-0000-0000-0000-000000000002' where id = '10000000-0000-0000-0000-000000000001';
update teams set manager_user_id = '20000000-0000-0000-0000-000000000007' where id = '10000000-0000-0000-0000-000000000002';
update teams set manager_user_id = '20000000-0000-0000-0000-000000000012' where id = '10000000-0000-0000-0000-000000000003';
update teams set manager_user_id = '20000000-0000-0000-0000-000000000016' where id = '10000000-0000-0000-0000-000000000004';

-- Default governance policy for the organization
insert into governance_policies (organization_id)
values ('00000000-0000-0000-0000-000000000001')
on conflict (organization_id) do nothing;
