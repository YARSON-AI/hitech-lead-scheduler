import "server-only";
import { serverEnv } from "@/lib/env/server";
import { traced } from "@/lib/trace";
import { stubN8n } from "./stub";
import type { AgentCalendar, CreatedEvent, N8n } from "./types";

const summary = (method: string, result: unknown): Record<string, unknown> => {
  if (method === "validateLeads") return { found: (result as unknown[]).length };
  if (method === "spouseAgent") return { found: !!result };
  if (method === "readCalendars") {
    return { calendars: (result as AgentCalendar[]).map((row) => ({ agent: row.agentEmail, readable: row.readable, events: row.events.length })) };
  }
  if (method === "bookingCreated" || method === "bookingTransferred") {
    const created = result as CreatedEvent;
    return { outlookEvent: !!created.outlookEventId, surenseMeeting: !!created.surenseMeetingId, teamsLink: !!created.teamsJoinUrl };
  }
  return {};
};

const stub = traced("n8n", stubN8n, summary);

export function n8n(): N8n {
  if (serverEnv().N8N_MODE === "live") {
    throw new Error("The live n8n integration arrives with HITECH-31");
  }
  return stub;
}

export * from "./types";
