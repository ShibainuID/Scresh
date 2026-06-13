create extension if not exists pgcrypto;

do $$ begin
  create type app_role as enum ('staff', 'credit', 'manager', 'supervisor', 'partner', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter type app_role add value if not exists 'credit';
exception
  when duplicate_object then null;
end $$;

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  legal_name text,
  registration_number text,
  address text,
  city text,
  province text,
  contact_phone text,
  commodity_focus text,
  verification_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tenants add column if not exists legal_name text;
alter table tenants add column if not exists registration_number text;
alter table tenants add column if not exists address text;
alter table tenants add column if not exists city text;
alter table tenants add column if not exists province text;
alter table tenants add column if not exists contact_phone text;
alter table tenants add column if not exists commodity_focus text;
alter table tenants add column if not exists verification_status text not null default 'pending';

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete set null,
  name text not null,
  email text not null unique,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_roles (
  user_id uuid not null references users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists tenant_modules (
  tenant_id uuid not null references tenants(id) on delete cascade,
  module_id uuid not null references modules(id) on delete cascade,
  status text not null default 'active',
  activated_at timestamptz not null default now(),
  primary key (tenant_id, module_id)
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  full_name text not null,
  national_id text,
  phone text,
  commodity_focus text,
  membership_status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  requested_by_user_id uuid references users(id) on delete set null,
  approved_by_user_id uuid references users(id) on delete set null,
  loan_number text not null unique,
  principal_amount numeric(14, 2) not null,
  purpose text not null,
  risk_tier text not null,
  status text not null default 'draft',
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists loan_versions (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  version_number integer not null,
  principal_amount numeric(14, 2) not null,
  change_reason text not null,
  changed_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (loan_id, version_number)
);

create table if not exists loan_change_requests (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  requested_by_user_id uuid references users(id) on delete set null,
  reviewed_by_user_id uuid references users(id) on delete set null,
  field_name text not null,
  old_value text not null,
  new_value text not null,
  reason text not null,
  status text not null default 'pending',
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists scresh_batches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  registered_by_user_id uuid references users(id) on delete set null,
  batch_code text not null unique,
  commodity text not null,
  supplier_name text not null,
  claimed_weight_kg numeric(12, 2) not null,
  actual_weight_kg numeric(12, 2) not null,
  remaining_weight_kg numeric(12, 2) not null,
  buy_price_per_kg numeric(12, 2) not null default 0,
  sample_photo_url text,
  freshness_grade text not null default 'pending',
  confidence_score numeric(5, 2) not null default 0,
  shelf_life_hours integer not null default 0,
  storage_location text,
  distribution_priority integer not null default 99,
  status text not null default 'in_storage',
  created_at timestamptz not null default now()
);

alter table scresh_batches add column if not exists remaining_weight_kg numeric(12, 2);
alter table scresh_batches add column if not exists buy_price_per_kg numeric(12, 2) not null default 0;
alter table scresh_batches add column if not exists sample_photo_url text;

-- Backfill remaining_weight_kg from actual_weight_kg where previously null.
update scresh_batches set remaining_weight_kg = actual_weight_kg where remaining_weight_kg is null;

-- Ensure remaining_weight_kg is non-null going forward.
alter table scresh_batches alter column remaining_weight_kg set not null;

create table if not exists scresh_movements (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references scresh_batches(id) on delete cascade,
  moved_by_user_id uuid references users(id) on delete set null,
  movement_type text not null,
  quantity_kg numeric(12, 2) not null,
  destination text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists partner_portfolio_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  partner_user_id uuid references users(id) on delete set null,
  report_month date not null,
  active_stock_value numeric(14, 2) not null,
  monthly_transaction_volume numeric(14, 2) not null,
  waste_rate_percent numeric(5, 2) not null,
  supplier_stability_score integer not null,
  risk_tier text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, partner_user_id, report_month)
);

create table if not exists audit_anomalies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  loan_id uuid references loans(id) on delete cascade,
  risk_score integer not null,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id bigserial primary key,
  actor_user_id uuid references users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists users_tenant_id_idx on users(tenant_id);
create index if not exists tenants_name_idx on tenants using gin (to_tsvector('simple', name));
create index if not exists members_tenant_id_idx on members(tenant_id);
create index if not exists loans_tenant_id_idx on loans(tenant_id);
create index if not exists loan_change_requests_loan_id_idx on loan_change_requests(loan_id);
create index if not exists scresh_batches_tenant_id_idx on scresh_batches(tenant_id);
create index if not exists scresh_movements_batch_id_idx on scresh_movements(batch_id);
create index if not exists partner_portfolio_reports_tenant_id_idx on partner_portfolio_reports(tenant_id);
create index if not exists audit_anomalies_tenant_id_idx on audit_anomalies(tenant_id);
create index if not exists sessions_user_id_idx on sessions(user_id);
create index if not exists sessions_active_idx on sessions(id, expires_at) where revoked_at is null;
create index if not exists audit_logs_actor_created_idx on audit_logs(actor_user_id, created_at desc);
