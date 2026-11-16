import "server-only";
import { traceIds } from "@/lib/trace";
import type { Actor } from "@/lib/auth/types";
import { buildPool, jerusalemDayInfo } from "@/lib/engine/pool";
import { fromWall, toWall } from "@/lib/engine/time";
import { serverEnv } from "@/lib/env/server";
import { ApiError, forbidden, notFound } from "@/lib/http/route";
import { airtable } from "@/lib/integrations/airtable";
import type { ValidatedLead } from "@/lib/integrations/n8n";
import { adminClient } from "@/lib/supabase/admin";
import { agentFreeSlots, loadSettings, slotsForPool } from "./availability";
import { createBooking, recordEvent, resolveAssignment, validateLead, type Assignment } from "./core";
import { bookedProof, hashLinkToken, newToken, openToken, sealToken } from "./link-token";
import type { BookingRow } from "./types";

export interface LinkRecord {
  id: string;
  token_hash: string;
  token_sealed: string | null;
  lead_number: string;
  lead_data: ValidatedLead | null;
  mode: "manual" | "auto";
  agent_email: string | null;
  agent_name: string | null;
  in_person_address: string | null;
  created_by: string;
  created_by_name: string;
  created_at: string;
  expires_at: string;
  status: "open" | "used" | "revoked";
  booking_id: string | null;
}

const user = (actor: Actor) => ({ kind: "user" as const, actor });

export function linkUrl(origin: string, token: string): string {
  return `${origin}/b/${token}`;
}

export interface CreateLinkInput {
  leadNumber: string;
  address?: string;
  mode: "manual" | "auto";
  agentId?: string;
  specialization?: string;
}

export async function createLink(actor: Actor, input: CreateLinkInput, origin: string) {
  const db = adminClient();
  const [lead, roster] = await Promise.all([validateLead(input.leadNumber), airtable().listAgents()]);

  let agent = null;
  if (actor.role === "agent") {
    agent = roster.find((row) => row.email === actor.agentEmail) ?? null;
    if (!agent || input.mode !== "manual") throw forbidden();
  } else if (input.mode === "manual") {
    const { agents } = buildPool(roster, { mode: "manual", specialization: input.specialization, today: jerusalemDayInfo() });
    agent = agents.find((row) => row.id === input.agentId) ?? null;
    if (!agent) throw new ApiError(400, "agent_not_available", "הסוכן/ת שנבחר/ה אינו/ה זמין/ה");
  }

  const { data: agency, error: agencyError } = await db.from("agency_settings").select("booking_link_validity_days").single();
  if (agencyError) throw agencyError;
  const expires = new Date(Date.now() + agency.booking_link_validity_days * 86400000);

  const { data: previous } = await db
    .from("booking_links")
    .update({ status: "revoked", revoked_by: actor.id, revoked_at: new Date().toISOString() })
    .eq("lead_number", lead.number)
    .eq("status", "open")
    .select("id");
  for (const row of previous ?? []) await recordEvent(user(actor), null, "link_revoked", { linkId: row.id, after: { reason: "replaced" } });

  const token = newToken();
  const { data: link, error } = await db
    .from("booking_links")
    .insert({
      token_hash: hashLinkToken(token),
      token_sealed: sealToken(token, serverEnv().LINK_TOKEN_KEY),
      lead_number: lead.number,
      lead_data: lead,
      mode: agent ? "manual" : "auto",
      agent_email: agent?.email ?? null,
      agent_name: agent?.name ?? null,
      in_person_address: input.address || null,
      created_by: actor.id,
      created_by_name: actor.name,
      expires_at: expires.toISOString(),
    })
    .select("id")
    .single();
  if (error) throw error;
  await recordEvent(user(actor), null, "link_created", { linkId: link.id, after: { lead: lead.number, agent: agent?.name ?? "auto" } });
  return { id: link.id, url: linkUrl(origin, token), expiresAt: expires.toISOString(), customer: lead.fullName, leadNumber: lead.number, agentName: agent?.name ?? null };
}

async function linkFor(actor: Actor, id: string): Promise<LinkRecord> {
  const { data } = await adminClient().from("booking_links").select("*").eq("id", id).maybeSingle();
  if (!data) throw notFound();
  if (actor.role === "agent" && data.agent_email !== actor.agentEmail && data.created_by !== actor.id) throw notFound();
  return data as LinkRecord;
}

export async function revokeLink(actor: Actor, id: string): Promise<void> {
  const link = await linkFor(actor, id);
  if (link.status !== "open") throw new ApiError(409, "not_open", "הקישור כבר אינו פתוח");
  const { error } = await adminClient().from("booking_links").update({ status: "revoked", revoked_by: actor.id, revoked_at: new Date().toISOString() }).eq("id", id).eq("status", "open");
  if (error) throw error;
  await recordEvent(user(actor), null, "link_revoked", { linkId: id });
}

export async function copyLink(actor: Actor, id: string, origin: string): Promise<string> {
  const link = await linkFor(actor, id);
  if (link.status !== "open" || new Date(link.expires_at) < new Date() || !link.token_sealed) throw new ApiError(409, "not_open", "הקישור כבר אינו פתוח");
  return linkUrl(origin, openToken(link.token_sealed, serverEnv().LINK_TOKEN_KEY));
}

async function liveLink(token: string): Promise<LinkRecord | null> {
  const { data } = await adminClient().from("booking_links").select("*").eq("token_hash", hashLinkToken(token)).maybeSingle();
  const link = data as LinkRecord | null;
  if (!link || link.status !== "open" || new Date(link.expires_at) < new Date() || !link.lead_data) return null;
  if (link.agent_email) {
    const roster = await airtable().listAgents();
    if (!roster.some((agent) => agent.email === link.agent_email)) return null;
    const { data: profile } = await adminClient().from("profiles").select("status").eq("agent_email", link.agent_email).maybeSingle();
    if (profile?.status === "deactivated") return null;
  }
  return link;
}

export type PublicView =
  | { state: "dead" }
  | { state: "booked"; agentName: string; start: string; end: string }
  | { state: "open"; online: boolean; agentName: string | null; durationMin: number };

export async function viewLink(token: string, proof?: string): Promise<PublicView> {
  const link = await liveLink(token);
  if (!link) {
    if (proof) {
      const { data } = await adminClient().from("booking_links").select("booking_id").eq("token_hash", hashLinkToken(token)).eq("status", "used").maybeSingle();
      if (data?.booking_id && bookedProof(token, data.booking_id, serverEnv().LINK_TOKEN_KEY) === proof) {
        const { data: booking } = await adminClient().from("bookings").select("agent_name, start_at, end_at").eq("id", data.booking_id).single();
        if (booking) return { state: "booked", agentName: booking.agent_name, start: booking.start_at, end: booking.end_at };
      }
    }
    return { state: "dead" };
  }
  const settings = await loadSettings("regular");
  return { state: "open", online: !link.in_person_address, agentName: link.agent_name, durationMin: settings.durationMin };
}

async function assignmentFor(link: LinkRecord): Promise<Assignment> {
  const lead = link.lead_data!;
  if (link.mode === "manual") {
    const roster = await airtable().listAgents();
    const agent = roster.find((row) => row.email === link.agent_email);
    if (!agent) throw new ApiError(410, "dead_link", "dead");
    return { mode: "manual", candidates: [agent], query: { profile: "regular" }, partner: null, spouseLead: null };
  }
  return resolveAssignment({ mode: "auto", lead });
}

export async function linkSlots(token: string): Promise<Record<string, string[]>> {
  const link = await liveLink(token);
  if (!link) throw new ApiError(410, "dead_link", "dead");
  traceIds({ linkId: link.id });
  const assignment = await assignmentFor(link);
  if (assignment.mode === "manual") return agentFreeSlots(assignment.candidates[0], assignment.query);
  return slotsForPool(assignment.candidates, assignment.query);
}

export async function bookThroughLink(token: string, date: string, time: string): Promise<{ row: BookingRow; proof: string }> {
  const link = await liveLink(token);
  if (!link) throw new ApiError(410, "dead_link", "dead");
  traceIds({ linkId: link.id });
  const db = adminClient();
  const { data: claimed } = await db.from("booking_links").update({ status: "used" }).eq("id", link.id).eq("status", "open").select("id");
  if (!claimed?.length) throw new ApiError(410, "dead_link", "dead");
  try {
    const assignment = await assignmentFor(link);
    const row = await createBooking({
      assignment,
      lead: link.lead_data!,
      start: fromWall(date, time),
      forced: false,
      address: link.in_person_address ?? undefined,
      source: "link",
      linkId: link.id,
      actor: { kind: "customer_link", linkId: link.id, creatorId: link.created_by, creatorName: link.created_by_name },
      bookedBy: link.created_by,
      bookedByName: link.created_by_name,
    });
    await db.from("booking_links").update({ booking_id: row.id, agent_email: row.agent_email, agent_name: row.agent_name }).eq("id", link.id);
    return { row, proof: bookedProof(token, row.id, serverEnv().LINK_TOKEN_KEY) };
  } catch (error) {
    await db.from("booking_links").update({ status: "open" }).eq("id", link.id);
    throw error;
  }
}

export const wallOf = (iso: string) => toWall(new Date(iso));
