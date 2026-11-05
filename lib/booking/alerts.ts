import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { raiseAlert } from "./core";

export async function runBookingChecks(): Promise<{ missingEvent: number; missingTeams: number }> {
  const db = adminClient();
  const cutoff = new Date(Date.now() - 5 * 60000).toISOString();
  const { data } = await db
    .from("bookings")
    .select("id, agent_email, agent_name, outlook_event_id, teams_join_url, in_person_address")
    .eq("status", "confirmed")
    .lt("created_at", cutoff)
    .gte("end_at", new Date().toISOString());
  let missingEvent = 0;
  let missingTeams = 0;
  for (const row of data ?? []) {
    const details = { agentEmail: row.agent_email, agentName: row.agent_name, bookingId: row.id };
    if (!row.outlook_event_id) {
      missingEvent++;
      await raiseAlert("no_outlook_event", details);
    } else if (!row.in_person_address && !row.teams_join_url) {
      missingTeams++;
      await raiseAlert("no_teams_link", details);
    }
  }
  return { missingEvent, missingTeams };
}
