create table public.account_invites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index account_invites_user_idx on public.account_invites (user_id);

alter table public.account_invites enable row level security;
grant all on public.account_invites to service_role;

create function public.clear_rate_limit(p_key text)
returns void
language sql
security definer
set search_path = ''
as $$ delete from private.rate_limits where key = p_key; $$;

revoke all on function public.clear_rate_limit(text) from public, anon, authenticated;
grant execute on function public.clear_rate_limit(text) to service_role;

create function public.end_user_sessions(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$ delete from auth.sessions where user_id = p_user; $$;

revoke all on function public.end_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.end_user_sessions(uuid) to service_role;
