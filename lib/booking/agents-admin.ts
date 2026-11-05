import "server-only";
import type { Actor } from "@/lib/auth/types";
import { ApiError, hitRateLimit, notFound } from "@/lib/http/route";
import { airtable } from "@/lib/integrations/airtable";
import { n8n } from "@/lib/integrations/n8n";
import { adminClient } from "@/lib/supabase/admin";
import { agentById, raiseAlert, recordEvent, toPayload } from "./core";
import type { BookingRow } from "./types";

export async function sendCalendarLink(actor: Actor, agentId: string): Promise<void> {
  const agent = await agentById(agentId);
  if (!agent) throw notFound();
  if (!(await hitRateLimit(`calendar-link:${agent.email}`, 3, 3600))) {
    throw new ApiError(429, "rate_limited", "הקישור נשלח לאחרונה. אפשר לנסות שוב מאוחר יותר.");
  }
  await n8n().sendCalendarLink({ agentEmail: agent.email, agentName: agent.name });
  await adminClient()
    .from("calendar_connections")
    .upsert({ agent_email: agent.email, connected: false, link_sent_at: new Date().toISOString(), link_sent_by: actor.id, updated_at: new Date().toISOString() });
  await recordEvent({ kind: "user", actor }, null, "calendar_link_sent", { after: { agent: agent.name } });
}

export async function changeAgentEmail(actor: Actor, agentId: string, newEmail: string): Promise<void> {
  const agent = await agentById(agentId);
  if (!agent) throw notFound();
  if (newEmail === agent.email) throw new ApiError(400, "same_email", "זה המייל הנוכחי");
  const db = adminClient();
  const roster = await airtable().listAgents();
  const { data: taken } = await db.from("profiles").select("id").eq("email", newEmail).maybeSingle();
  if (taken || roster.some((row) => row.email === newEmail)) throw new ApiError(409, "email_taken", "כתובת המייל כבר משויכת למשתמש אחר");

  const { data: future } = await db
    .from("bookings")
    .select("*")
    .eq("agent_email", agent.email)
    .eq("status", "confirmed")
    .gte("start_at", new Date().toISOString())
    .order("start_at");
  const bookings = (future ?? []) as BookingRow[];

  const { data: profile } = await db.from("profiles").select("id").eq("agent_email", agent.email).maybeSingle();
  if (profile) {
    const { error } = await db.auth.admin.updateUserById(profile.id, { email: newEmail, email_confirm: true });
    if (error) throw error;
  }

  const { error } = await db.rpc("change_agent_email", { p_old: agent.email, p_new: newEmail });
  if (error) throw error;
  if (profile) await db.rpc("end_user_sessions", { p_user: profile.id });

  const created = await n8n().agentEmailChanged({
    previousEmail: agent.email,
    newEmail,
    agentName: agent.name,
    futureBookings: bookings.map((row) => ({ ...toPayload(row), agentEmail: newEmail })),
  });
  for (const [index, row] of bookings.entries()) {
    const event = created[index];
    await db
      .from("bookings")
      .update({ outlook_event_id: event?.outlookEventId, surense_meeting_id: event?.surenseMeetingId, teams_join_url: event?.teamsJoinUrl ?? null, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    await recordEvent({ kind: "user", actor }, row.id, "agent_email_changed", { before: { email: agent.email }, after: { email: newEmail } });
    if (!row.in_person_address && !event?.teamsJoinUrl) await raiseAlert("no_teams_link", { agentEmail: newEmail, agentName: agent.name, bookingId: row.id });
  }

  await db.from("alerts").insert({ kind: "calendar_unreadable", agent_email: newEmail, agent_name: agent.name });
  await n8n().sendAlertEmail({ kind: "calendar_unreadable", agentName: agent.name });
  await db.from("account_events").insert({ target_email: newEmail, action: "agent_email_changed", actor_user: actor.id, actor_name: actor.name, details: { from: agent.email } });
}
