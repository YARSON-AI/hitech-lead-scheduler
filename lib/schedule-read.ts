import "server-only";
import { addDays, todayInJerusalem } from "@/lib/engine/time";
import { adminClient } from "@/lib/supabase/admin";
import { serverClient } from "@/lib/supabase/server";

export async function readHours(agentEmail: string) {
  const supabase = await serverClient();
  const { data } = await supabase.from("working_hours").select("weekday, enabled, start_time, end_time").eq("agent_email", agentEmail);
  return (data ?? []).map((row) => ({ weekday: row.weekday, enabled: row.enabled, start: row.start_time.slice(0, 5), end: row.end_time.slice(0, 5) }));
}

export async function readOverrides(agentEmail: string) {
  const supabase = await serverClient();
  const { data } = await supabase
    .from("date_overrides")
    .select("id, date, kind, start_time, end_time, note")
    .eq("agent_email", agentEmail)
    .gte("date", todayInJerusalem())
    .order("date");
  return (data ?? []).map((row) => ({
    id: row.id,
    date: row.date,
    kind: row.kind as "block" | "open",
    start: row.start_time?.slice(0, 5) ?? null,
    end: row.end_time?.slice(0, 5) ?? null,
    note: row.note,
  }));
}

export async function upcomingBlockedHolidays(days = 60) {
  const today = todayInJerusalem();
  const { data } = await adminClient()
    .from("holidays")
    .select("date, name, blocks, blocked_from, blocked_to")
    .eq("blocks", true)
    .gte("date", today)
    .lte("date", addDays(today, days))
    .order("date");
  return (data ?? []).map((row) => ({ date: row.date, name: row.name, from: row.blocked_from?.slice(0, 5) ?? null, to: row.blocked_to?.slice(0, 5) ?? null }));
}
