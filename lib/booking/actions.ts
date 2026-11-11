import "server-only";
import type { Actor } from "@/lib/auth/types";
import { addDays, toWall, todayInJerusalem } from "@/lib/engine/time";
import { verdictAt } from "@/lib/engine/availability";
import { ApiError, forbidden, notFound } from "@/lib/http/route";
import { airtable, type RosterAgent } from "@/lib/integrations/airtable";
import { CANCEL_TAGS, n8n, type CancelledBy } from "@/lib/integrations/n8n";
import { adminClient } from "@/lib/supabase/admin";
import { traceIds, traceStep } from "@/lib/trace";
import { agentFreeSlots, contextFor, loadAgents, loadSettings, type SlotQuery } from "./availability";
import { agentByEmail, agentById, handoffFailed, raiseAlert, recordEvent, slotTaken, toPayload } from "./core";
import type { BookingRow } from "./types";

const user = (actor: Actor) => ({ kind: "user" as const, actor });
const stamp = () => new Date().toISOString();

export async function bookingFor(actor: Actor, id: string): Promise<BookingRow> {
  const { data } = await adminClient().from("bookings").select("*").eq("id", id).neq("status", "failed").maybeSingle();
  if (!data) throw notFound();
  if (actor.role === "agent" && data.agent_email !== actor.agentEmail) throw notFound();
  traceIds({ bookingId: data.id });
  return data as BookingRow;
}

async function partnerOf(row: BookingRow): Promise<BookingRow | null> {
  if (!row.spouse_booking_id) return null;
  const { data } = await adminClient().from("bookings").select("*").eq("id", row.spouse_booking_id).eq("status", "confirmed").maybeSingle();
  return (data as BookingRow) ?? null;
}

const blockIds = (row: BookingRow | null) => (row ? [row.id, row.outlook_event_id].filter(Boolean) as string[] : []);

function rescheduleQuery(row: BookingRow, partner: BookingRow | null): SlotQuery {
  return {
    profile: row.profile,
    ignoreQuota: row.profile === "spouse",
    ignoredBlockIds: blockIds(row),
    unpaddedBlockIds: blockIds(partner),
    quotaCreditDate: toWall(new Date(row.start_at)).date,
  };
}

export async function rescheduleSlots(actor: Actor, id: string): Promise<{ slots: Record<string, string[]>; current: { date: string; time: string } }> {
  const row = await bookingFor(actor, id);
  if (row.status !== "confirmed") throw new ApiError(409, "not_active", "הפגישה בוטלה");
  const agent = await agentByEmail(row.agent_email);
  if (!agent) throw new ApiError(409, "agent_gone", "הסוכן/ת אינו/ה ברשימת הסוכנים");
  const slots = await agentFreeSlots(agent, rescheduleQuery(row, await partnerOf(row)));
  const wall = toWall(new Date(row.start_at));
  return { slots, current: { date: wall.date, time: wall.time } };
}

async function assertFree(agent: RosterAgent, start: Date, query: SlotQuery): Promise<void> {
  const settings = await loadSettings(query.profile);
  const from = todayInJerusalem();
  const windowEnd = addDays(from, settings.windowDays);
  const date = toWall(start).date;
  const to = date > windowEnd ? date : windowEnd;
  const [[loaded], context] = await Promise.all([loadAgents([agent], from, to), contextFor(query, from, to)]);
  const reason = verdictAt(loaded, start, context);
  traceStep("slot check", { agent: agent.name, start: start.toISOString(), reason });
  if (reason !== null) throw slotTaken();
}

async function updateRow(id: string, change: Record<string, unknown>): Promise<BookingRow> {
  const { data, error } = await adminClient().from("bookings").update({ ...change, updated_at: stamp() }).eq("id", id).select("*").single();
  if (error) {
    if (error.code === "23505") throw slotTaken();
    throw error;
  }
  return data as BookingRow;
}

export async function reschedule(actor: Actor, id: string, startIso: string, forced: boolean): Promise<BookingRow> {
  if (forced && actor.role === "agent") throw forbidden();
  const row = await bookingFor(actor, id);
  if (row.status !== "confirmed") throw new ApiError(409, "not_active", "הפגישה בוטלה");
  const start = new Date(startIso);
  if (start.getTime() <= Date.now()) throw new ApiError(400, "past_time", "יש לבחור מועד עתידי");
  const partner = await partnerOf(row);

  if (!forced) {
    const agent = await agentByEmail(row.agent_email);
    if (!agent) throw new ApiError(409, "agent_gone", "הסוכן/ת אינו/ה ברשימת הסוכנים");
    await assertFree(agent, start, rescheduleQuery(row, partner));
  }

  const settings = await loadSettings(row.profile);
  const end = new Date(start.getTime() + settings.durationMin * 60000);
  const before = { start: row.start_at, end: row.end_at, forced: row.forced };
  const updated = await updateRow(id, { start_at: start.toISOString(), end_at: end.toISOString(), forced: forced || row.forced });
  try {
    await n8n().bookingRescheduled({ ...toPayload(updated), previousStart: row.start_at });
  } catch {
    await updateRow(id, { start_at: before.start, end_at: before.end, forced: before.forced });
    throw handoffFailed();
  }
  await recordEvent(user(actor), id, "rescheduled", { before, after: { start: updated.start_at, end: updated.end_at } });
  if (forced) await recordEvent(user(actor), id, "forced", { after: { start: updated.start_at } });
  return updated;
}

export async function cancel(actor: Actor, id: string, cancelledBy: CancelledBy, reason?: string): Promise<BookingRow> {
  const row = await bookingFor(actor, id);
  if (row.status !== "confirmed") throw new ApiError(409, "not_active", "הפגישה כבר בוטלה");
  const updated = await updateRow(id, {
    status: "cancelled",
    cancelled_by: cancelledBy,
    cancelled_by_user: actor.id,
    cancelled_by_name: actor.name,
    cancel_reason: reason || null,
    cancelled_at: stamp(),
  });
  try {
    await n8n().bookingCancelled({ ...toPayload(updated), cancelledBy, tag: CANCEL_TAGS[cancelledBy], reason });
  } catch {
    await updateRow(id, { status: "confirmed", cancelled_by: null, cancelled_by_user: null, cancelled_by_name: null, cancel_reason: null, cancelled_at: null });
    throw handoffFailed();
  }
  await recordEvent(user(actor), id, "cancelled", { before: { status: "confirmed" }, after: { cancelled_by: cancelledBy, reason: reason || null } });
  return updated;
}

export async function changeCustomerEmail(actor: Actor, id: string, which: "primary" | "additional", email: string): Promise<BookingRow> {
  const row = await bookingFor(actor, id);
  if (row.status !== "confirmed" || new Date(row.end_at).getTime() < Date.now()) {
    throw new ApiError(409, "not_upcoming", "אפשר לשנות מייל רק בפגישה עתידית");
  }
  if (which === "additional" && !row.additional_lead_number) throw new ApiError(400, "no_second_customer", "אין לקוח/ה נוסף/ת בפגישה");
  const column = which === "primary" ? "customer_email" : "additional_customer_email";
  const previous = which === "primary" ? row.customer_email : row.additional_customer_email;
  const updated = await updateRow(id, { [column]: email });
  try {
    await n8n().customerEmailChanged({ ...toPayload(updated), which, previousEmail: previous ?? undefined });
  } catch {
    await updateRow(id, { [column]: previous });
    throw handoffFailed();
  }
  await recordEvent(user(actor), id, "email_changed", { before: { which, email: previous }, after: { which, email } });
  return updated;
}

export async function transferSlots(actor: Actor, id: string, agentId: string): Promise<{ slots: Record<string, string[]>; current: { date: string; time: string }; currentFree: boolean }> {
  const row = await bookingFor(actor, id);
  if (row.status !== "confirmed") throw new ApiError(409, "not_active", "הפגישה בוטלה");
  const agent = await agentById(agentId);
  if (!agent) throw notFound();
  if (agent.email === row.agent_email) throw new ApiError(400, "same_agent", "זה הסוכן/ת הנוכחי/ת");
  const slots = await agentFreeSlots(agent, { profile: row.profile, ignoreQuota: row.profile === "spouse" });
  const wall = toWall(new Date(row.start_at));
  return { slots, current: { date: wall.date, time: wall.time }, currentFree: (slots[wall.date] ?? []).includes(wall.time) };
}

async function moveOne(actor: Actor, row: BookingRow, agent: RosterAgent, start: Date, forced: boolean): Promise<BookingRow> {
  const duration = new Date(row.end_at).getTime() - new Date(row.start_at).getTime();
  const before = {
    agent_email: row.agent_email,
    agent_name: row.agent_name,
    start_at: row.start_at,
    end_at: row.end_at,
    outlook_event_id: row.outlook_event_id,
    surense_meeting_id: row.surense_meeting_id,
    teams_join_url: row.teams_join_url,
    forced: row.forced,
  };
  const updated = await updateRow(row.id, {
    agent_email: agent.email,
    agent_name: agent.name,
    start_at: start.toISOString(),
    end_at: new Date(start.getTime() + duration).toISOString(),
    forced: forced || row.forced,
  });
  try {
    const created = await n8n().bookingTransferred({
      ...toPayload(updated),
      agentPhone: agent.phone,
      previousAgentEmail: row.agent_email,
      previousOutlookEventId: row.outlook_event_id ?? undefined,
    });
    const moved = await updateRow(row.id, {
      outlook_event_id: created.outlookEventId,
      surense_meeting_id: created.surenseMeetingId,
      teams_join_url: created.teamsJoinUrl ?? null,
    });
    await recordEvent(user(actor), row.id, "transferred", {
      before: { agent: before.agent_name, start: before.start_at },
      after: { agent: agent.name, start: moved.start_at },
    });
    if (forced) await recordEvent(user(actor), row.id, "forced", { after: { start: moved.start_at } });
    if (!moved.in_person_address && !moved.teams_join_url) {
      await raiseAlert("no_teams_link", { agentEmail: agent.email, agentName: agent.name, bookingId: moved.id });
    }
    return moved;
  } catch {
    await updateRow(row.id, before);
    throw handoffFailed();
  }
}

export async function transfer(actor: Actor, id: string, agentId: string, startIso: string, forced: boolean): Promise<BookingRow> {
  const row = await bookingFor(actor, id);
  if (row.status !== "confirmed") throw new ApiError(409, "not_active", "הפגישה בוטלה");
  const agent = await agentById(agentId);
  if (!agent) throw notFound();
  if (agent.email === row.agent_email) throw new ApiError(400, "same_agent", "זה הסוכן/ת הנוכחי/ת");
  const start = new Date(startIso);
  if (start.getTime() <= Date.now()) throw new ApiError(400, "past_time", "יש לבחור מועד עתידי");

  const partner = await partnerOf(row);
  const offset = start.getTime() - new Date(row.start_at).getTime();
  const partnerMoves = partner && new Date(partner.start_at).getTime() > Date.now() ? partner : null;
  const partnerStart = partnerMoves ? new Date(new Date(partnerMoves.start_at).getTime() + offset) : null;

  if (!forced) {
    await assertFree(agent, start, { profile: row.profile, ignoreQuota: row.profile === "spouse" });
    if (partnerMoves && partnerStart) await assertFree(agent, partnerStart, { profile: partnerMoves.profile, ignoreQuota: true });
  }

  const moved = await moveOne(actor, row, agent, start, forced);
  if (partnerMoves && partnerStart) await moveOne(actor, partnerMoves, agent, partnerStart, forced);
  return moved;
}

export async function transferOptions(row: BookingRow): Promise<{ value: string; label: string }[]> {
  const roster = await airtable().listAgents();
  return roster.filter((agent) => agent.email !== row.agent_email).map((agent) => ({ value: agent.id, label: agent.name })).sort((a, b) => a.label.localeCompare(b.label, "he"));
}
