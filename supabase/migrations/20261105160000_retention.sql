do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'audit_retention') then
    create role audit_retention nologin;
  end if;
end;
$$;

grant audit_retention to postgres;
grant usage on schema public, private to audit_retention;
grant create on schema private to audit_retention;
grant select, update on public.bookings, public.booking_links to audit_retention;
grant select, update (before, after) on public.booking_events to audit_retention;

drop policy if exists bookings_retention on public.bookings;
drop policy if exists booking_links_retention on public.booking_links;
drop policy if exists booking_events_retention on public.booking_events;
create policy bookings_retention on public.bookings for all to audit_retention using (true) with check (true);
create policy booking_links_retention on public.booking_links for all to audit_retention using (true) with check (true);
create policy booking_events_retention on public.booking_events for all to audit_retention using (true) with check (true);

drop function if exists private.run_retention();
drop function if exists public.run_retention();

create function private.run_retention()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  anonymised int;
  purged int;
begin
  with due as (
    update public.bookings
    set customer_name = '—',
        customer_email = null,
        customer_phone = null,
        additional_customer_name = null,
        additional_customer_email = null,
        additional_customer_phone = null,
        in_person_address = null,
        teams_join_url = null,
        anonymised_at = now()
    where anonymised_at is null
      and end_at < now() - interval '12 months'
    returning id
  ), events as (
    update public.booking_events
    set before = null, after = null
    where booking_id in (select id from due)
  )
  select count(*) into anonymised from due;

  with done as (
    update public.booking_links
    set lead_data = null,
        token_sealed = null,
        in_person_address = null,
        lead_data_purged_at = now()
    where lead_data_purged_at is null
      and (status <> 'open' or expires_at < now())
      and coalesce(revoked_at, expires_at) < now() - interval '30 days'
    returning id
  )
  select count(*) into purged from done;

  return jsonb_build_object('anonymised', anonymised, 'links', purged);
end;
$$;

alter function private.run_retention() owner to audit_retention;
revoke create on schema private from audit_retention;
revoke all on function private.run_retention() from public, anon, authenticated;

create function public.run_retention()
returns jsonb
language sql
security definer
set search_path = ''
as $$ select private.run_retention(); $$;

revoke all on function public.run_retention() from public, anon, authenticated;
grant execute on function public.run_retention() to service_role;
