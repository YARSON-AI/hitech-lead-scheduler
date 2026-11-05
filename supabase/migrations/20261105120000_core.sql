create schema if not exists private;
grant usage on schema private to authenticated, service_role;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique check (email = lower(email)),
  role text not null check (role in ('agent', 'coordinator', 'manager')),
  full_name text not null,
  agent_email text unique check (agent_email = lower(agent_email)),
  status text not null default 'invited' check (status in ('invited', 'active', 'deactivated')),
  invited_at timestamptz,
  invited_by uuid,
  activated_at timestamptz,
  deactivated_at timestamptz,
  created_at timestamptz not null default now(),
  check ((role = 'agent') = (agent_email is not null))
);

create table public.settings (
  profile text primary key check (profile in ('regular', 'spouse')),
  duration_min int not null check (duration_min > 0),
  buffer_before_min int not null check (buffer_before_min >= 0),
  buffer_after_min int not null check (buffer_after_min >= 0),
  notice_min int not null check (notice_min >= 0),
  window_days int not null check (window_days > 0 and window_days <= 42),
  interval_min int not null check (interval_min > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  check (notice_min <= window_days * 1440)
);

insert into public.settings (profile, duration_min, buffer_before_min, buffer_after_min, notice_min, window_days, interval_min)
values ('regular', 30, 15, 15, 240, 21, 30), ('spouse', 30, 15, 15, 240, 21, 30);

create table public.agency_settings (
  id boolean primary key default true check (id),
  booking_link_validity_days int not null default 7 check (booking_link_validity_days between 1 and 60),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

insert into public.agency_settings (id) values (true);

create table public.settings_history (
  id bigint generated always as identity primary key,
  scope text not null,
  field text not null,
  old_value text,
  new_value text,
  changed_by uuid not null,
  changed_by_name text not null,
  changed_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  agent_email text not null check (agent_email = lower(agent_email)),
  agent_name text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'failed')),
  profile text not null default 'regular' check (profile in ('regular', 'spouse')),
  lead_number text not null,
  lead_id text,
  customer_id text,
  interest_name text,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  additional_lead_number text,
  additional_customer_name text,
  additional_customer_email text,
  additional_customer_phone text,
  in_person_address text,
  spouse_booking_id uuid references public.bookings (id),
  forced boolean not null default false,
  source text not null default 'staff' check (source in ('staff', 'link')),
  link_id uuid,
  assignment_mode text not null check (assignment_mode in ('auto', 'manual', 'spouse')),
  assignment_reason jsonb,
  booked_by uuid,
  booked_by_name text,
  outlook_event_id text,
  surense_meeting_id text,
  teams_join_url text,
  cancelled_by text check (cancelled_by in ('customer', 'agent', 'coordinator')),
  cancelled_by_user uuid,
  cancelled_by_name text,
  cancel_reason text,
  cancelled_at timestamptz,
  anonymised_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);

create unique index bookings_agent_start_confirmed on public.bookings (agent_email, start_at) where status = 'confirmed';
create index bookings_start_idx on public.bookings (start_at);
create index bookings_agent_idx on public.bookings (agent_email, start_at);
create index bookings_lead_idx on public.bookings (lead_number);

create table public.booking_events (
  id bigint generated always as identity primary key,
  booking_id uuid,
  link_id uuid,
  action text not null,
  actor_user uuid,
  actor_name text,
  actor_role text not null check (actor_role in ('agent', 'coordinator', 'manager', 'customer_link', 'system')),
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index booking_events_booking_idx on public.booking_events (booking_id, created_at);
create index booking_events_link_idx on public.booking_events (link_id, created_at);

create table public.account_events (
  id bigint generated always as identity primary key,
  target_email text not null,
  action text not null,
  actor_user uuid,
  actor_name text,
  details jsonb,
  created_at timestamptz not null default now()
);

create table public.working_hours (
  agent_email text not null check (agent_email = lower(agent_email)),
  weekday int not null check (weekday between 0 and 6),
  enabled boolean not null default true,
  start_time time not null,
  end_time time not null,
  updated_at timestamptz not null default now(),
  primary key (agent_email, weekday),
  check (end_time > start_time)
);

create table public.date_overrides (
  id uuid primary key default gen_random_uuid(),
  agent_email text not null check (agent_email = lower(agent_email)),
  date date not null,
  kind text not null check (kind in ('block', 'open')),
  start_time time,
  end_time time,
  note text,
  created_by uuid,
  created_at timestamptz not null default now(),
  check ((start_time is null) = (end_time is null)),
  check (start_time is null or end_time > start_time),
  check (kind = 'block' or start_time is not null)
);

create index date_overrides_agent_idx on public.date_overrides (agent_email, date);

create table public.booking_links (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  lead_number text not null,
  lead_data jsonb,
  mode text not null check (mode in ('manual', 'auto')),
  agent_email text check (agent_email = lower(agent_email)),
  agent_name text,
  in_person_address text,
  created_by uuid not null,
  created_by_name text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'open' check (status in ('open', 'used', 'revoked')),
  revoked_by uuid,
  revoked_at timestamptz,
  booking_id uuid references public.bookings (id),
  lead_data_purged_at timestamptz,
  check ((mode = 'manual') = (agent_email is not null) or status = 'used')
);

create unique index booking_links_one_open_per_lead on public.booking_links (lead_number) where status = 'open';
create index booking_links_agent_idx on public.booking_links (agent_email, status);

create table public.holidays (
  date date primary key,
  name text not null,
  kind text not null check (kind in ('yomtov', 'erev', 'chol_hamoed', 'modern', 'other')),
  blocks boolean not null default false,
  blocked_from time,
  blocked_to time,
  source text not null default 'hebcal' check (source in ('hebcal', 'manager')),
  manager_edited boolean not null default false,
  range_id uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('calendar_unreadable', 'no_outlook_event', 'no_teams_link', 'handoff_failed')),
  agent_email text,
  agent_name text,
  booking_id uuid references public.bookings (id),
  created_at timestamptz not null default now(),
  emailed_at timestamptz,
  resolved_at timestamptz,
  resolved_by uuid
);

create unique index alerts_one_open on public.alerts (kind, coalesce(agent_email, ''), coalesce(booking_id::text, '')) where resolved_at is null;

create table public.calendar_connections (
  agent_email text primary key check (agent_email = lower(agent_email)),
  connected boolean not null default true,
  disconnected_at timestamptz,
  link_sent_at timestamptz,
  link_sent_by uuid,
  updated_at timestamptz not null default now()
);

create table private.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count int not null
);

create function public.hit_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count int;
begin
  insert into private.rate_limits as r (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set count = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.count + 1 end,
        window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning count into current_count;
  return current_count <= p_limit;
end;
$$;

revoke all on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;

create function private.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = ''
as $$
  select p.* from public.profiles p
  where p.id = auth.uid()
    and p.status = 'active'
    and p.role = (auth.jwt() -> 'app_metadata' ->> 'role');
$$;

create function private.is_agent()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce((private.current_profile()).role = 'agent', false); $$;

create function private.is_manager()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce((private.current_profile()).role = 'manager', false) and coalesce(auth.jwt() ->> 'aal' = 'aal2', false); $$;

create function private.is_staff()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce((private.current_profile()).role = 'coordinator', false) or private.is_manager(); $$;

create function private.agent_email()
returns text language sql stable security definer set search_path = ''
as $$ select (private.current_profile()).agent_email; $$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;

create function private.forbid_audit_change()
returns trigger
language plpgsql
as $$
begin
  if current_user = 'audit_retention' and tg_op = 'UPDATE' then
    return new;
  end if;
  raise exception 'audit tables are append-only' using errcode = '42501';
end;
$$;

create trigger settings_history_append_only before update or delete on public.settings_history
  for each row execute function private.forbid_audit_change();
create trigger settings_history_no_truncate before truncate on public.settings_history
  for each statement execute function private.forbid_audit_change();
create trigger booking_events_append_only before update or delete on public.booking_events
  for each row execute function private.forbid_audit_change();
create trigger booking_events_no_truncate before truncate on public.booking_events
  for each statement execute function private.forbid_audit_change();
create trigger account_events_append_only before update or delete on public.account_events
  for each row execute function private.forbid_audit_change();
create trigger account_events_no_truncate before truncate on public.account_events
  for each statement execute function private.forbid_audit_change();

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.agency_settings enable row level security;
alter table public.settings_history enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_events enable row level security;
alter table public.account_events enable row level security;
alter table public.working_hours enable row level security;
alter table public.date_overrides enable row level security;
alter table public.booking_links enable row level security;
alter table public.holidays enable row level security;
alter table public.alerts enable row level security;
alter table public.calendar_connections enable row level security;

create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or private.is_manager());

create policy settings_read on public.settings for select to authenticated using (private.is_manager());
create policy settings_write on public.settings for update to authenticated
  using (private.is_manager()) with check (private.is_manager());

create policy agency_settings_read on public.agency_settings for select to authenticated using (private.is_manager());
create policy agency_settings_write on public.agency_settings for update to authenticated
  using (private.is_manager()) with check (private.is_manager());

create policy settings_history_read on public.settings_history for select to authenticated using (private.is_manager());
create policy settings_history_add on public.settings_history for insert to authenticated
  with check (private.is_manager() and changed_by = auth.uid());

create policy bookings_read on public.bookings for select to authenticated
  using (private.is_staff() or (private.is_agent() and agent_email = private.agent_email()));

create policy booking_events_read on public.booking_events for select to authenticated
  using (
    private.is_staff()
    or (private.is_agent() and booking_id in (select b.id from public.bookings b where b.agent_email = private.agent_email()))
  );

create policy account_events_read on public.account_events for select to authenticated using (private.is_manager());

create policy working_hours_read on public.working_hours for select to authenticated
  using (private.is_manager() or (private.is_agent() and agent_email = private.agent_email()));
create policy working_hours_add on public.working_hours for insert to authenticated
  with check (private.is_manager() or (private.is_agent() and agent_email = private.agent_email()));
create policy working_hours_change on public.working_hours for update to authenticated
  using (private.is_manager() or (private.is_agent() and agent_email = private.agent_email()))
  with check (private.is_manager() or (private.is_agent() and agent_email = private.agent_email()));
create policy working_hours_remove on public.working_hours for delete to authenticated
  using (private.is_manager() or (private.is_agent() and agent_email = private.agent_email()));

create policy date_overrides_read on public.date_overrides for select to authenticated
  using (private.is_manager() or (private.is_agent() and agent_email = private.agent_email()));
create policy date_overrides_add on public.date_overrides for insert to authenticated
  with check (private.is_manager() or (private.is_agent() and agent_email = private.agent_email()));
create policy date_overrides_change on public.date_overrides for update to authenticated
  using (private.is_manager() or (private.is_agent() and agent_email = private.agent_email()))
  with check (private.is_manager() or (private.is_agent() and agent_email = private.agent_email()));
create policy date_overrides_remove on public.date_overrides for delete to authenticated
  using (private.is_manager() or (private.is_agent() and agent_email = private.agent_email()));

create policy booking_links_read on public.booking_links for select to authenticated
  using (private.is_staff() or (private.is_agent() and agent_email = private.agent_email()));

create policy holidays_read on public.holidays for select to authenticated using (private.is_manager());
create policy holidays_add on public.holidays for insert to authenticated with check (private.is_manager());
create policy holidays_change on public.holidays for update to authenticated
  using (private.is_manager()) with check (private.is_manager());
create policy holidays_remove on public.holidays for delete to authenticated using (private.is_manager() and source = 'manager');

create policy alerts_read on public.alerts for select to authenticated using (private.is_staff());
create policy calendar_connections_read on public.calendar_connections for select to authenticated using (private.is_staff());

grant select on public.profiles, public.bookings, public.booking_events, public.account_events,
  public.alerts, public.calendar_connections to authenticated;
grant select (id, lead_number, mode, agent_email, agent_name, in_person_address, created_by, created_by_name,
  created_at, expires_at, status, revoked_by, revoked_at, booking_id) on public.booking_links to authenticated;
grant select, update on public.settings, public.agency_settings to authenticated;
grant select, insert on public.settings_history to authenticated;
grant select, insert, update, delete on public.working_hours, public.date_overrides, public.holidays to authenticated;

grant all on public.profiles, public.settings, public.agency_settings, public.bookings, public.working_hours,
  public.date_overrides, public.booking_links, public.holidays, public.alerts, public.calendar_connections to service_role;
grant select, insert on public.settings_history, public.booking_events, public.account_events to service_role;
grant usage, select on all sequences in schema public to service_role, authenticated;
