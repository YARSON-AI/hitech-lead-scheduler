import "server-only";
import { addDays, fromWall, toWall } from "@/lib/engine/time";
import { adminClient } from "@/lib/supabase/admin";
import { FIXTURE_LEADS, ROSTER } from "../fixtures";
import { readStubState, updateStubState, writeOutbox } from "../stub-store";
import { IntegrationError, type AgentCalendar, type BookingPayload, type CalendarEvent, type CreatedEvent, type N8n, type ShowAs } from "./types";

function shouldFail(event: string): boolean {
  const state = readStubState();
  if (!state.failNext.includes(event)) return false;
  updateStubState((next) => {
    next.failNext = next.failNext.filter((name) => name !== event);
  });
  return true;
}

function send(event: string, payload: unknown): void {
  if (shouldFail(event)) throw new IntegrationError(event);
  writeOutbox("n8n", event, payload);
}

function hash(text: string): number {
  let value = 2166136261;
  for (const char of text) {
    value ^= char.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

const SHOW_AS: ShowAs[] = ["busy", "busy", "tentative", "oof", "free", "workingElsewhere"];

export function fixtureEvents(agentEmail: string, from: string, to: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    const seed = hash(`${agentEmail}|${date}`);
    const count = seed % 3;
    for (let index = 0; index < count; index++) {
      const start = 9 * 60 + (hash(`${seed}|${index}`) % 18) * 30;
      const length = 30 + (hash(`${seed}|len|${index}`) % 3) * 30;
      const at = (minutes: number) =>
        fromWall(date, `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`).toISOString();
      events.push({
        eventId: `stub-busy-${agentEmail}-${date}-${index}`,
        start: at(start),
        end: at(start + length),
        showAs: SHOW_AS[hash(`${seed}|show|${index}`) % SHOW_AS.length],
      });
    }
  }
  return events;
}

function teamsLink(payload: BookingPayload): string | undefined {
  if (payload.inPersonAddress || readStubState().noTeamsLink) return undefined;
  return `https://teams.example.test/l/meetup-join/${crypto.randomUUID()}`;
}

function created(payload: BookingPayload): CreatedEvent {
  return {
    outlookEventId: `stub-event-${crypto.randomUUID()}`,
    surenseMeetingId: `stub-surense-${crypto.randomUUID()}`,
    teamsJoinUrl: teamsLink(payload),
  };
}

function bumpMonthlyCount(agentEmail: string, delta: number): void {
  updateStubState((state) => {
    const original = Object.entries(state.emailChanges).find(([, current]) => current === agentEmail)?.[0] ?? agentEmail;
    const agent = ROSTER.find((row) => row.email === original);
    if (agent) state.monthlyCounts[agent.id] = (state.monthlyCounts[agent.id] ?? 0) + delta;
  });
}

export const stubN8n: N8n = {
  async validateLeads(numbers) {
    if (shouldFail("validateLeads")) throw new IntegrationError("validateLeads");
    return FIXTURE_LEADS.filter((lead) => numbers.includes(lead.number)).map((lead) => ({
      number: lead.number,
      id: lead.id,
      customerId: lead.customerId,
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      interestName: lead.interestName,
    }));
  },

  async spouseAgent(leadId) {
    const { data } = await adminClient()
      .from("bookings")
      .select("agent_email")
      .eq("lead_id", leadId)
      .eq("status", "confirmed")
      .order("start_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ? { agentEmail: data.agent_email } : null;
  },

  async readCalendars(agentEmails, from, to) {
    if (shouldFail("readCalendars")) throw new IntegrationError("readCalendars");
    const disconnected = new Set(readStubState().disconnected);
    const { data } = await adminClient()
      .from("bookings")
      .select("agent_email, start_at")
      .eq("status", "confirmed")
      .in("agent_email", agentEmails)
      .gte("start_at", fromWall(from, "00:00").toISOString())
      .lte("start_at", fromWall(addDays(to, 1), "00:00").toISOString());
    return agentEmails.map((agentEmail): AgentCalendar => {
      if (disconnected.has(agentEmail)) return { agentEmail, readable: false, events: [], meetingsPerDay: {} };
      const meetingsPerDay: Record<string, number> = {};
      for (const row of data ?? []) {
        if (row.agent_email !== agentEmail) continue;
        const date = toWall(new Date(row.start_at)).date;
        meetingsPerDay[date] = (meetingsPerDay[date] ?? 0) + 1;
      }
      return { agentEmail, readable: true, events: fixtureEvents(agentEmail, from, to), meetingsPerDay };
    });
  },

  async bookingCreated(payload) {
    send("booking.created", payload);
    bumpMonthlyCount(payload.agentEmail, 1);
    return created(payload);
  },

  async bookingRescheduled(payload) {
    send("booking.rescheduled", payload);
  },

  async bookingCancelled(payload) {
    send("booking.cancelled", payload);
    bumpMonthlyCount(payload.agentEmail, -1);
  },

  async bookingTransferred(payload) {
    send("booking.transferred", payload);
    bumpMonthlyCount(payload.previousAgentEmail, -1);
    bumpMonthlyCount(payload.agentEmail, 1);
    return created(payload);
  },

  async customerEmailChanged(payload) {
    send("booking.email_changed", payload);
  },

  async agentEmailChanged(payload) {
    send("agent.email_changed", payload);
    updateStubState((state) => {
      const original = Object.entries(state.emailChanges).find(([, current]) => current === payload.previousEmail)?.[0] ?? payload.previousEmail;
      state.emailChanges[original] = payload.newEmail;
      if (!state.disconnected.includes(payload.newEmail)) state.disconnected.push(payload.newEmail);
    });
    return payload.futureBookings.map(created);
  },

  async sendCalendarLink(payload) {
    send("agent.calendar_link", payload);
  },

  async sendAccountLink(payload) {
    if (shouldFail("account.link")) throw new IntegrationError("account.link");
    writeOutbox("email", `account.${payload.kind}`, payload);
  },

  async sendAlertEmail(payload) {
    writeOutbox("email", "alert", payload);
  },
};
