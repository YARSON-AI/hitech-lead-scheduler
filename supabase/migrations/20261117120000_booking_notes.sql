alter table public.bookings add column notes text check (char_length(notes) <= 1000);

create or replace function private.run_retention()
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
        notes = null,
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
