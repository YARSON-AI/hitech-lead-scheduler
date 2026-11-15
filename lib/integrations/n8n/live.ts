import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { serverEnv } from "@/lib/env/server";
import { IntegrationError, type N8n } from "./types";

const REPLAY_WINDOW_SECONDS = 300;
const READ_TIMEOUT_MS = 20000;
const WRITE_TIMEOUT_MS = 90000;

const optionalText = z
  .string()
  .nullish()
  .transform((value) => value ?? undefined);

const lead = z.object({
  number: z.string(),
  id: z.string(),
  customerId: z.string(),
  fullName: z.string(),
  email: optionalText,
  phone: optionalText,
  interestName: optionalText,
});

const calendar = z.object({
  agentEmail: z.string(),
  readable: z.boolean(),
  events: z.array(
    z.object({
      eventId: z.string(),
      start: z.string(),
      end: z.string(),
      showAs: z.enum(["free", "workingElsewhere", "tentative", "busy", "oof", "unknown"]),
    }),
  ),
  meetingsPerDay: z.record(z.string(), z.number()),
});

const nothing = z.object({});

const RESULTS = {
  validateLeads: z.object({ leads: z.array(lead) }),
  spouseAgent: z.object({ agentEmail: z.string().nullable() }),
  readCalendars: z.object({ calendars: z.array(calendar) }),
  bookingCreated: z.object({ outlookEventId: z.string(), surenseMeetingId: z.string(), teamsJoinUrl: optionalText }),
  bookingRescheduled: nothing,
  bookingCancelled: nothing,
  customerEmailChanged: nothing,
  sendAccountLink: nothing,
  sendAlertEmail: nothing,
};

type GatewayEvent = keyof typeof RESULTS;
type Result<E extends GatewayEvent> = z.infer<(typeof RESULTS)[E]>;

const READS = new Set<GatewayEvent>(["validateLeads", "spouseAgent", "readCalendars"]);

const envelope = z.object({ ok: z.literal(true), result: z.unknown() });

export function sign(secret: string, timestamp: string, body: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export function verifySignature(secret: string, timestamp: string | null, signature: string | null, body: string, nowSeconds: number): boolean {
  if (!timestamp || !signature || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(nowSeconds - Number(timestamp)) > REPLAY_WINDOW_SECONDS) return false;
  const expected = Buffer.from(sign(secret, timestamp, body));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function parseResult<E extends GatewayEvent>(event: E, text: string): Result<E> {
  const { result } = envelope.parse(JSON.parse(text));
  return RESULTS[event].parse(result) as Result<E>;
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

async function call<E extends GatewayEvent>(event: E, payload: unknown): Promise<Result<E>> {
  const { N8N_GATEWAY_URL: url, N8N_GATEWAY_SECRET: secret } = serverEnv();
  try {
    if (!url || !secret) throw new Error("not configured");
    const body = JSON.stringify({ event, payload });
    const timestamp = String(nowSeconds());
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-booking-timestamp": timestamp, "x-booking-signature": sign(secret, timestamp, body) },
      body,
      redirect: "error",
      signal: AbortSignal.timeout(READS.has(event) ? READ_TIMEOUT_MS : WRITE_TIMEOUT_MS),
    });
    const text = await response.text();
    if (response.status !== 200) throw new Error("bad status");
    if (!verifySignature(secret, response.headers.get("x-booking-timestamp"), response.headers.get("x-booking-signature"), text, nowSeconds())) {
      throw new Error("bad signature");
    }
    return parseResult(event, text);
  } catch {
    throw new IntegrationError(event);
  }
}

export const liveN8n: N8n = {
  async validateLeads(numbers) {
    return (await call("validateLeads", { numbers })).leads;
  },

  async spouseAgent(leadId) {
    const { agentEmail } = await call("spouseAgent", { leadId });
    return agentEmail === null ? null : { agentEmail };
  },

  async readCalendars(agentEmails, from, to) {
    return (await call("readCalendars", { agentEmails, from, to })).calendars;
  },

  async bookingCreated(payload) {
    return call("bookingCreated", payload);
  },

  async bookingRescheduled(payload) {
    await call("bookingRescheduled", payload);
  },

  async bookingCancelled(payload) {
    await call("bookingCancelled", payload);
  },

  async bookingTransferred() {
    throw new IntegrationError("bookingTransferred");
  },

  async customerEmailChanged(payload) {
    await call("customerEmailChanged", payload);
  },

  async agentEmailChanged() {
    throw new IntegrationError("agentEmailChanged");
  },

  async sendCalendarLink() {
    throw new IntegrationError("sendCalendarLink");
  },

  async sendAccountLink(payload) {
    await call("sendAccountLink", payload);
  },

  async sendAlertEmail(payload) {
    await call("sendAlertEmail", { ...payload, to: serverEnv().ALERT_EMAIL });
  },
};
