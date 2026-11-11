create table if not exists public.booking_traces (
  id bigint generated always as identity primary key,
  action text not null,
  actor_role text,
  booking_id uuid,
  link_id uuid,
  ok boolean not null,
  status int,
  duration_ms int not null,
  steps jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists booking_traces_booking_idx on public.booking_traces (booking_id, created_at);
create index if not exists booking_traces_created_idx on public.booking_traces (created_at);

alter table public.booking_traces enable row level security;
revoke all on public.booking_traces from anon, authenticated;
grant select, insert, delete on public.booking_traces to service_role;
