import "server-only";
import { z } from "zod";
import type { Actor } from "@/lib/auth/types";
import { ApiError, forbidden } from "@/lib/http/route";
import { serverClient } from "@/lib/supabase/server";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const hoursSchema = z.strictObject({
  agentEmail: z.string().email().optional(),
  days: z
    .array(z.strictObject({ weekday: z.number().int().min(0).max(6), enabled: z.boolean(), start: time, end: time }))
    .length(7),
});

export const overrideSchema = z.strictObject({
  agentEmail: z.string().email().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kind: z.enum(["block", "open"]),
  start: time.optional(),
  end: time.optional(),
  note: z.string().trim().max(200).optional(),
});

export function targetAgent(actor: Actor, requested?: string): string {
  if (actor.role === "agent") {
    if (requested && requested !== actor.agentEmail) throw forbidden();
    return actor.agentEmail!;
  }
  if (actor.role !== "manager" || !requested) throw forbidden();
  return requested.toLowerCase();
}

export async function saveHours(actor: Actor, input: z.infer<typeof hoursSchema>): Promise<void> {
  const agentEmail = targetAgent(actor, input.agentEmail);
  for (const day of input.days) {
    if (day.end <= day.start) throw new ApiError(400, "bad_hours", "שעת הסיום חייבת להיות אחרי שעת ההתחלה");
  }
  const supabase = await serverClient();
  const { error } = await supabase.from("working_hours").upsert(
    input.days.map((day) => ({
      agent_email: agentEmail,
      weekday: day.weekday,
      enabled: day.enabled,
      start_time: day.start,
      end_time: day.end,
      updated_at: new Date().toISOString(),
    })),
  );
  if (error) throw error;
}

export async function addOverride(actor: Actor, input: z.infer<typeof overrideSchema>): Promise<void> {
  const agentEmail = targetAgent(actor, input.agentEmail);
  if (input.kind === "open" && !(input.start && input.end)) throw new ApiError(400, "needs_hours", "פתיחת מועדים דורשת שעות");
  if ((input.start && !input.end) || (input.end && !input.start)) throw new ApiError(400, "needs_hours", "יש לבחור שעת התחלה וסיום");
  if (input.start && input.end && input.end <= input.start) throw new ApiError(400, "bad_hours", "שעת הסיום חייבת להיות אחרי שעת ההתחלה");
  const supabase = await serverClient();
  const { error } = await supabase.from("date_overrides").insert({
    agent_email: agentEmail,
    date: input.date,
    kind: input.kind,
    start_time: input.start ?? null,
    end_time: input.end ?? null,
    note: input.note || null,
    created_by: actor.id,
  });
  if (error) throw error;
}

export async function removeOverride(id: string): Promise<void> {
  const supabase = await serverClient();
  const { data, error } = await supabase.from("date_overrides").delete().eq("id", id).select("id");
  if (error) throw error;
  if (!data?.length) throw new ApiError(404, "not_found", "לא נמצא");
}
