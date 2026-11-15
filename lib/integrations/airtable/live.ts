import "server-only";
import { z } from "zod";
import { serverEnv } from "@/lib/env/server";
import type { Airtable, RosterAgent } from "./types";

const TIMEOUT_MS = 15000;
const WEIGHT_LOWERED = "היה שינוי במשקל הסוכן";
const PILOT = "פיילוט";

const agentFields = z.looseObject({
  "שם פרטי": z.string().optional(),
  "שם משפחה": z.string().optional(),
  "מייל": z.string().optional(),
  "סלולרי": z.string().optional(),
  "רמזור": z.enum(["🟢", "🟠", "🔴"]).optional().catch(undefined),
  "מכסה יומית": z.number().optional(),
  "מכסה חודשית": z.number().optional(),
  "משקל": z.number().optional(),
  "כמות פגישות שנקבעו החודש": z.number().optional(),
  "תאריך חסימה": z.string().optional(),
  "סיבת החסימה": z.array(z.string()).optional(),
});

const specializationFields = z.object({ "סוגי הלידים": z.string().optional() });

export function toRosterAgent(id: string, fields: z.infer<typeof agentFields>): RosterAgent | null {
  const email = fields["מייל"]?.trim().toLowerCase();
  if (!email) return null;
  const firstName = fields["שם פרטי"] ?? "";
  const lastName = fields["שם משפחה"] ?? "";
  return {
    id,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    email,
    phone: fields["סלולרי"],
    trafficLight: fields["רמזור"],
    dailyQuota: fields["מכסה יומית"],
    monthlyQuota: fields["מכסה חודשית"],
    weight: fields["משקל"],
    weightLowered: fields[WEIGHT_LOWERED] === true,
    monthlyCount: fields["כמות פגישות שנקבעו החודש"] ?? 0,
    exclusions: Object.fromEntries(
      Object.entries(fields)
        .filter(([name, value]) => value === true && name !== WEIGHT_LOWERED && name !== PILOT)
        .map(([name]) => [name, true]),
    ),
    blockedSince: fields["תאריך חסימה"],
    blockReason: fields["סיבת החסימה"]?.join(", "),
  };
}

function table(tableId: string | undefined): { url: string; headers: Record<string, string> } {
  const { AIRTABLE_API_TOKEN: token, AIRTABLE_BASE_ID: baseId } = serverEnv();
  if (!token || !baseId || !tableId) throw new Error("Airtable is not configured");
  return {
    url: `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableId)}`,
    headers: { Authorization: `Bearer ${token}` },
  };
}

const page = z.object({ records: z.array(z.object({ id: z.string(), fields: z.unknown() })), offset: z.string().optional() });

async function records<T>(tableId: string | undefined, fields: z.ZodType<T>): Promise<{ id: string; fields: T }[]> {
  const { url, headers } = table(tableId);
  const all: { id: string; fields: T }[] = [];
  let offset: string | undefined;
  do {
    const response = await fetch(offset ? `${url}?offset=${encodeURIComponent(offset)}` : url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Airtable request failed: ${response.status}`);
    const parsed = page.safeParse(await response.json());
    if (!parsed.success) throw new Error("Airtable response is malformed");
    for (const record of parsed.data.records) {
      const row = fields.safeParse(record.fields);
      if (!row.success) throw new Error("Airtable response is malformed");
      all.push({ id: record.id, fields: row.data });
    }
    offset = parsed.data.offset;
  } while (offset);
  return all;
}

export const liveAirtable: Airtable = {
  async listAgents() {
    const env = serverEnv();
    const rows = await records(env.AIRTABLE_AGENTS_TABLE_ID, agentFields);
    return rows
      .filter((row) => env.PILOT_ONLY !== "true" || row.fields[PILOT] === true)
      .map((row) => toRosterAgent(row.id, row.fields))
      .filter((agent) => agent !== null);
  },

  async listSpecializations() {
    const rows = await records(serverEnv().AIRTABLE_SPECIALIZATIONS_TABLE_ID, specializationFields);
    return rows
      .flatMap((row) => (row.fields["סוגי הלידים"] ? [{ id: row.id, name: row.fields["סוגי הלידים"] }] : []))
      .sort((a, b) => a.name.localeCompare(b.name, "he"));
  },

  async logManualAssignment(entry) {
    const { url, headers } = table(serverEnv().AIRTABLE_MANUAL_ASSIGNMENT_DOCUMENTATION_TABLE_ID);
    const response = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ records: [{ fields: { "שם משתמש המתאם": entry.bookedBy, "הסוכן ששויך": entry.agentName } }] }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Airtable request failed: ${response.status}`);
  },
};
