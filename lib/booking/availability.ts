import "server-only";
import { traceStep } from "@/lib/trace";
import { freeSlots, publicSlots, unionSlots, type AgentAvailability, type BusyBlock, type EngineContext, type Holiday, type MeetingSettings, type WeeklyHours, type DateOverride } from "@/lib/engine/availability";
import { addDays, fromWall, todayInJerusalem } from "@/lib/engine/time";
import type { RosterAgent } from "@/lib/integrations/airtable/types";
import { n8n, type AgentCalendar, type CalendarEvent } from "@/lib/integrations/n8n";
import { ApiError } from "@/lib/http/route";
import { adminClient } from "@/lib/supabase/admin";

export type Profile = "regular" | "spouse";

const BUSY_STATES = new Set(["busy", "tentative", "oof"]);

export function busyFromCalendar(events: CalendarEvent[]): BusyBlock[] {
  return events
    .filter((event) => BUSY_STATES.has(event.showAs))
    .map((event) => ({ start: new Date(event.start).getTime(), end: new Date(event.end).getTime(), id: event.eventId }));
}

export async function loadSettings(profile: Profile): Promise<MeetingSettings> {
  const { data, error } = await adminClient().from("settings").select("*").eq("profile", profile).single();
  if (error) throw error;
  return {
    durationMin: data.duration_min,
    bufferBeforeMin: data.buffer_before_min,
    bufferAfterMin: data.buffer_after_min,
    noticeMin: data.notice_min,
    windowDays: data.window_days,
    intervalMin: data.interval_min,
  };
}

export async function loadHolidays(from: string, to: string): Promise<Map<string, Holiday>> {
  const { data, error } = await adminClient().from("holidays").select("date, blocks, blocked_from, blocked_to").gte("date", from).lte("date", to);
  if (error) throw error;
  return new Map(
    (data ?? []).map((row) => [row.date, { date: row.date, blocks: row.blocks, blockedFrom: row.blocked_from?.slice(0, 5), blockedTo: row.blocked_to?.slice(0, 5) }]),
  );
}

export async function readConfirmed(
  read: (emails: string[]) => Promise<AgentCalendar[]>,
  emails: string[],
  wasConnected: Map<string, boolean>,
): Promise<AgentCalendar[]> {
  const first = await read(emails);
  const doubtful = first.filter((calendar) => !calendar.readable && (wasConnected.get(calendar.agentEmail) ?? true)).map((calendar) => calendar.agentEmail);
  if (doubtful.length === 0) return first;
  const second = new Map((await read(doubtful)).map((calendar) => [calendar.agentEmail, calendar]));
  return first.map((calendar) => second.get(calendar.agentEmail) ?? calendar);
}

async function trackConnections(calendars: { agentEmail: string; readable: boolean }[], wasConnected: Map<string, boolean>, names: Map<string, string>) {
  const db = adminClient();
  for (const { agentEmail, readable } of calendars) {
    const before = wasConnected.get(agentEmail) ?? true;
    if (!readable && before) {
      await db.from("calendar_connections").upsert({ agent_email: agentEmail, connected: false, disconnected_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      const agentName = names.get(agentEmail);
      const { error } = await db.from("alerts").insert({ kind: "calendar_unreadable", agent_email: agentEmail, agent_name: agentName });
      if (!error) await n8n().sendAlertEmail({ kind: "calendar_unreadable", agentName }).catch(() => traceStep("alert_email_failed", { kind: "calendar_unreadable" }));
    } else if (readable && !before) {
      await db.from("calendar_connections").update({ connected: true, disconnected_at: null, updated_at: new Date().toISOString() }).eq("agent_email", agentEmail);
      await db.from("alerts").update({ resolved_at: new Date().toISOString() }).eq("kind", "calendar_unreadable").eq("agent_email", agentEmail).is("resolved_at", null);
    }
  }
}

export async function loadAgents(roster: RosterAgent[], from: string, to: string): Promise<AgentAvailability[]> {
  if (roster.length === 0) return [];
  const db = adminClient();
  const emails = roster.map((agent) => agent.email);
  const { data: known } = await db.from("calendar_connections").select("agent_email, connected").in("agent_email", emails);
  const wasConnected = new Map<string, boolean>((known ?? []).map((row) => [row.agent_email, row.connected]));
  let calendars;
  try {
    calendars = await readConfirmed((list) => n8n().readCalendars(list, from, to), emails, wasConnected);
  } catch {
    throw new ApiError(503, "calendar_read_failed", "לא הצלחנו לטעון את המועדים. נסה/י שוב.");
  }
  await trackConnections(calendars, wasConnected, new Map(roster.map((agent) => [agent.email, agent.name])));
  const [{ data: hours }, { data: overrides }, { data: bookings }] = await Promise.all([
    db.from("working_hours").select("agent_email, weekday, enabled, start_time, end_time").in("agent_email", emails),
    db.from("date_overrides").select("agent_email, date, kind, start_time, end_time").in("agent_email", emails).gte("date", from).lte("date", to),
    db
      .from("bookings")
      .select("id, agent_email, start_at, end_at, outlook_event_id")
      .eq("status", "confirmed")
      .in("agent_email", emails)
      .lt("start_at", fromWall(addDays(to, 2), "00:00").toISOString())
      .gt("end_at", fromWall(addDays(from, -1), "00:00").toISOString()),
  ]);
  const byEmail = new Map(calendars.map((calendar) => [calendar.agentEmail, calendar]));
  return roster.map((agent): AgentAvailability => {
    const calendar = byEmail.get(agent.email);
    const own = (bookings ?? []).filter((row) => row.agent_email === agent.email);
    const known = new Set(own.map((row) => row.outlook_event_id));
    return {
      email: agent.email,
      hours: (hours ?? [])
        .filter((row) => row.agent_email === agent.email)
        .map((row): WeeklyHours => ({ weekday: row.weekday, enabled: row.enabled, startTime: row.start_time.slice(0, 5), endTime: row.end_time.slice(0, 5) })),
      overrides: (overrides ?? [])
        .filter((row) => row.agent_email === agent.email)
        .map((row): DateOverride => ({ date: row.date, kind: row.kind, startTime: row.start_time?.slice(0, 5), endTime: row.end_time?.slice(0, 5) })),
      busy: [
        ...busyFromCalendar((calendar?.events ?? []).filter((event) => !known.has(event.eventId))),
        ...own.map((row): BusyBlock => ({ start: new Date(row.start_at).getTime(), end: new Date(row.end_at).getTime(), id: row.id })),
      ],
      dailyQuota: agent.dailyQuota,
      meetingsPerDay: calendar?.meetingsPerDay ?? {},
      readable: calendar?.readable ?? false,
    };
  });
}

export interface SlotQuery {
  profile: Profile;
  ignoreQuota?: boolean;
  ignoredBlockIds?: string[];
  unpaddedBlockIds?: string[];
  quotaCreditDate?: string;
}

export async function contextFor(query: SlotQuery, from: string, to: string): Promise<EngineContext> {
  const [settings, holidays] = await Promise.all([loadSettings(query.profile), loadHolidays(from, to)]);
  return {
    settings,
    holidays,
    now: new Date(),
    ignoreQuota: query.ignoreQuota,
    ignoredBlockIds: new Set(query.ignoredBlockIds ?? []),
    unpaddedBlockIds: new Set(query.unpaddedBlockIds ?? []),
    quotaCreditDate: query.quotaCreditDate,
  };
}

export async function slotsForPool(roster: RosterAgent[], query: SlotQuery): Promise<Record<string, string[]>> {
  const settings = await loadSettings(query.profile);
  const from = todayInJerusalem();
  const to = addDays(from, settings.windowDays);
  const [agents, context] = await Promise.all([loadAgents(roster, from, to), contextFor(query, from, to)]);
  const slots = publicSlots(unionSlots(agents, from, to, context));
  traceStep("slots", { from, to, agents: agents.length, unreadable: agents.filter((agent) => !agent.readable).map((agent) => agent.email), days: Object.keys(slots).length, times: Object.values(slots).flat().length });
  return slots;
}

export async function agentFreeSlots(agent: RosterAgent, query: SlotQuery): Promise<Record<string, string[]>> {
  const settings = await loadSettings(query.profile);
  const from = todayInJerusalem();
  const to = addDays(from, settings.windowDays);
  const [[loaded], context] = await Promise.all([loadAgents([agent], from, to), contextFor(query, from, to)]);
  const out: Record<string, string[]> = {};
  for (const slot of freeSlots(loaded, from, to, context)) (out[slot.date] ??= []).push(slot.time);
  traceStep("slots", { from, to, agent: agent.name, readable: loaded.readable, days: Object.keys(out).length, times: Object.values(out).flat().length });
  return out;
}
