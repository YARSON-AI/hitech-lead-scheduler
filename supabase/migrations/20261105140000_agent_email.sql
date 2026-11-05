create function public.change_agent_email(p_old text, p_new text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set agent_email = p_new, email = p_new where agent_email = p_old;
  update public.working_hours set agent_email = p_new where agent_email = p_old;
  update public.date_overrides set agent_email = p_new where agent_email = p_old;
  update public.bookings set agent_email = p_new, updated_at = now() where agent_email = p_old;
  update public.booking_links set agent_email = p_new where agent_email = p_old;
  update public.alerts set agent_email = p_new where agent_email = p_old;
  delete from public.calendar_connections where agent_email = p_old;
  insert into public.calendar_connections (agent_email, connected, disconnected_at)
  values (p_new, false, now())
  on conflict (agent_email) do update set connected = false, disconnected_at = now();
end;
$$;

revoke all on function public.change_agent_email(text, text) from public, anon, authenticated;
grant execute on function public.change_agent_email(text, text) to service_role;
