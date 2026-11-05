import "server-only";
import type { Actor } from "@/lib/auth/types";
import { buildPool, jerusalemDayInfo, paceRatio } from "@/lib/engine/pool";
import { isFree } from "@/lib/engine/availability";
import { addDays, toWall, todayInJerusalem } from "@/lib/engine/time";
import { ApiError } from "@/lib/http/route";
import { airtable, type RosterAgent } from "@/lib/integrations/airtable";
import { n8n, type BookingPayload, type ValidatedLead } from "@/lib/integrations/n8n";
import { adminClient } from "@/lib/supabase/admin";
import { contextFor, loadAgents, loadSettings, slotsForPool, type SlotQuery } from "./availability";
import type { BookingRow } from "./types";

export const LEAD_ERROR = "מספר/י הליד/ים לא נמצאו, או שיש תקלה זמנית במערכת";
export const SLOT_TAKEN = "המועד נתפס הרגע. בחר/י מועד אחר.";
export const HANDOFF_FAILED = "לא הצלחנו להשלים את הקביעה. הפגישה לא נשמרה. נסה/י שוב.";

export const slotTaken = () => new ApiError(409, "slot_taken", SLOT_TAKEN);
export const handoffFailed = () => new ApiError(502, "handoff_failed", HANDOFF_FAILED);

export type EventActor =
  | { kind: "user"; actor: Actor }
  | { kind: "customer_link"; linkId: string; creatorId: string | null; creatorName: string | null }
  | { kind: "system" };

export async function recordEvent(
  actor: EventActor,
  bookingId: string | null,
  action: string,
  change: { before?: unknown; after?: unknown; linkId?: string } = {},
): Promise<void> {
  const row =
    actor.kind === "user"
      ? { actor_user: actor.actor.id, actor_name: actor.actor.name, actor_role: actor.actor.role }
      : actor.kind === "customer_link"
        ? { actor_user: null, actor_name: null, actor_role: "customer_link", link_id: actor.linkId }
        : { actor_user: null, actor_name: null, actor_role: "system" };
  const { error } = await adminClient()
    .from("booking_events")
    .insert({ booking_id: bookingId, action, before: change.before ?? null, after: change.after ?? null, link_id: change.linkId, ...row });
  if (error) throw error;
}

export function toPayload(row: BookingRow): BookingPayload {
  return {
    bookingId: row.id,
    agentEmail: row.agent_email,
    agentName: row.agent_name,
    start: row.start_at,
    end: row.end_at,
    leadNumber: row.lead_number,
    leadId: row.lead_id ?? undefined,
    customerId: row.customer_id ?? undefined,
    interestName: row.interest_name ?? undefined,
    customerName: row.customer_name,
    customerEmail: row.customer_email ?? undefined,
    customerPhone: row.customer_phone ?? undefined,
    additionalLeadNumber: row.additional_lead_number ?? undefined,
    additionalCustomerName: row.additional_customer_name ?? undefined,
    additionalCustomerEmail: row.additional_customer_email ?? undefined,
    additionalCustomerPhone: row.additional_customer_phone ?? undefined,
    inPersonAddress: row.in_person_address ?? undefined,
    forced: row.forced,
    source: row.source,
    outlookEventId: row.outlook_event_id ?? undefined,
    surenseMeetingId: row.surense_meeting_id ?? undefined,
  };
}

export async function validateLead(number: string): Promise<ValidatedLead> {
  let leads;
  try {
    leads = await n8n().validateLeads([number]);
  } catch {
    throw new ApiError(503, "lead_lookup_failed", LEAD_ERROR);
  }
  const lead = leads.find((row) => row.number === number);
  if (!lead) throw new ApiError(404, "lead_not_found", LEAD_ERROR);
  return lead;
}

export async function raiseAlert(kind: string, details: { agentEmail?: string; agentName?: string; bookingId?: string }): Promise<void> {
  const db = adminClient();
  const { error } = await db.from("alerts").insert({ kind, agent_email: details.agentEmail, agent_name: details.agentName, booking_id: details.bookingId });
  if (error && error.code !== "23505") throw error;
}

export async function agentByEmail(email: string): Promise<RosterAgent | null> {
  const roster = await airtable().listAgents();
  return roster.find((agent) => agent.email === email) ?? null;
}

export async function agentById(id: string): Promise<RosterAgent | null> {
  const roster = await airtable().listAgents();
  return roster.find((agent) => agent.id === id) ?? null;
}

export interface Assignment {
  mode: "auto" | "manual" | "spouse";
  candidates: RosterAgent[];
  query: SlotQuery;
  partner: BookingRow | null;
  spouseLead: ValidatedLead | null;
}

export interface AssignmentInput {
  mode: "auto" | "manual" | "spouse";
  lead: ValidatedLead;
  agentId?: string;
  specialization?: string;
  spouseLeadNumber?: string;
}

export async function resolveAssignment(input: AssignmentInput): Promise<Assignment> {
  const roster = await airtable().listAgents();

  if (input.mode === "spouse") {
    const spouseLead = await validateLead(input.spouseLeadNumber ?? "");
    const found = await n8n().spouseAgent(spouseLead.id);
    const agent = found && roster.find((row) => row.email === found.agentEmail);
    if (!agent) throw new ApiError(404, "spouse_agent_not_found", "לא נמצא סוכן משויך לליד של בן/בת הזוג");
    const { data: partner } = await adminClient()
      .from("bookings")
      .select("*")
      .eq("lead_id", spouseLead.id)
      .eq("status", "confirmed")
      .order("start_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const ids = partner ? [partner.id, partner.outlook_event_id].filter(Boolean) : [];
    return { mode: "spouse", candidates: [agent], query: { profile: "spouse", ignoreQuota: true, unpaddedBlockIds: ids }, partner, spouseLead };
  }

  if (input.mode === "manual") {
    const { agents } = buildPool(roster, { mode: "manual", specialization: input.specialization, today: jerusalemDayInfo() });
    const agent = agents.find((row) => row.id === input.agentId);
    if (!agent) throw new ApiError(400, "agent_not_available", "הסוכן/ת שנבחר/ה אינו/ה זמין/ה");
    return { mode: "manual", candidates: [agent], query: { profile: "regular" }, partner: null, spouseLead: null };
  }

  const { agents, excluded } = buildPool(roster, {
    mode: "auto",
    specialization: input.specialization,
    interest: input.lead.interestName,
    today: jerusalemDayInfo(),
  });
  console.log(JSON.stringify({ level: "info", at: "pool", size: agents.length, excluded }));
  return { mode: "auto", candidates: agents, query: { profile: "regular" }, partner: null, spouseLead: null };
}

export async function slotsForAssignment(assignment: Assignment): Promise<Record<string, string[]>> {
  return slotsForPool(assignment.candidates, assignment.query);
}

export interface CreateInput {
  assignment: Assignment;
  lead: ValidatedLead;
  start: Date;
  forced: boolean;
  address?: string;
  source: "staff" | "link";
  linkId?: string;
  actor: EventActor;
  bookedBy: string | null;
  bookedByName: string | null;
}

async function insertBooking(row: Record<string, unknown>): Promise<BookingRow | null> {
  const { data, error } = await adminClient().from("bookings").insert(row).select("*").single();
  if (error) {
    if (error.code === "23505") return null;
    throw error;
  }
  return data;
}

export async function createBooking(input: CreateInput): Promise<BookingRow> {
  const { assignment, lead, start, forced } = input;
  const db = adminClient();
  const settings = await loadSettings(assignment.query.profile);
  const end = new Date(start.getTime() + settings.durationMin * 60000);

  if (start.getTime() <= Date.now()) throw new ApiError(400, "past_time", "יש לבחור מועד עתידי");

  const date = toWall(start).date;
  const today = jerusalemDayInfo();
  let candidates = assignment.candidates;

  if (!forced) {
    const from = todayInJerusalem();
    const to = addDays(from, settings.windowDays);
    const [agents, context] = await Promise.all([loadAgents(candidates, from, to > date ? to : date), contextFor(assignment.query, from, to > date ? to : date)]);
    const free = new Set(agents.filter((agent) => isFree(agent, start, context)).map((agent) => agent.email));
    candidates = candidates.filter((agent) => free.has(agent.email));
    if (candidates.length === 0) throw slotTaken();
  }

  const spouse = assignment.spouseLead;
  const base = {
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    status: "confirmed",
    profile: assignment.query.profile,
    lead_number: lead.number,
    lead_id: lead.id,
    customer_id: lead.customerId,
    interest_name: lead.interestName,
    customer_name: lead.fullName,
    customer_email: lead.email,
    customer_phone: lead.phone,
    additional_lead_number: spouse?.number,
    additional_customer_name: spouse?.fullName,
    additional_customer_email: spouse?.email,
    additional_customer_phone: spouse?.phone,
    in_person_address: input.address || null,
    spouse_booking_id: assignment.partner?.id,
    forced,
    source: input.source,
    link_id: input.linkId,
    assignment_mode: assignment.mode,
    booked_by: input.bookedBy,
    booked_by_name: input.bookedByName,
  };

  let row: BookingRow | null = null;
  let chosen: RosterAgent | null = null;
  for (const [index, agent] of candidates.entries()) {
    row = await insertBooking({
      ...base,
      agent_email: agent.email,
      agent_name: agent.name,
      assignment_reason: {
        mode: assignment.mode,
        position: index + 1,
        poolSize: candidates.length,
        paceRatio: Math.round(paceRatio(agent, today) * 100) / 100,
      },
    });
    if (row) {
      chosen = agent;
      break;
    }
  }
  if (!row || !chosen) throw slotTaken();

  await recordEvent(input.actor, row.id, "created", {
    after: { agent: row.agent_name, start: row.start_at, mode: assignment.mode, source: input.source },
    linkId: input.linkId,
  });
  if (forced) await recordEvent(input.actor, row.id, "forced", { after: { start: row.start_at } });

  try {
    const created = await n8n().bookingCreated({ ...toPayload(row), agentPhone: chosen.phone });
    const { data: updated, error } = await db
      .from("bookings")
      .update({
        outlook_event_id: created.outlookEventId,
        surense_meeting_id: created.surenseMeetingId,
        teams_join_url: created.teamsJoinUrl ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .select("*")
      .single();
    if (error) throw error;
    row = updated as BookingRow;
  } catch {
    await db.from("bookings").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", row.id);
    await recordEvent({ kind: "system" }, row.id, "handoff_failed");
    throw handoffFailed();
  }

  if (!row.in_person_address && !row.teams_join_url) {
    await raiseAlert("no_teams_link", { agentEmail: row.agent_email, agentName: row.agent_name, bookingId: row.id });
  }

  if (assignment.partner) {
    await db
      .from("bookings")
      .update({
        spouse_booking_id: row.id,
        additional_lead_number: lead.number,
        additional_customer_name: lead.fullName,
        additional_customer_email: lead.email,
        additional_customer_phone: lead.phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignment.partner.id);
  }

  if (assignment.mode === "manual") {
    await airtable().logManualAssignment({ bookedBy: input.bookedByName ?? "customer", agentName: row.agent_name });
  }

  return row;
}
