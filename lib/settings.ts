import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Actor } from "@/lib/auth/types";
import { addDays } from "@/lib/engine/time";
import { ApiError, notFound } from "@/lib/http/route";
import { serverClient } from "@/lib/supabase/server";

const intField = z.number().int().min(0).max(100000);

export const profileSchema = z.strictObject({
  profile: z.enum(["regular", "spouse"]),
  duration_min: intField,
  buffer_before_min: intField,
  buffer_after_min: intField,
  notice_min: intField,
  window_days: intField,
  interval_min: intField,
});

const LABELS: Record<string, string> = {
  duration_min: "משך הפגישה",
  buffer_before_min: "מרווח לפני",
  buffer_after_min: "מרווח אחרי",
  notice_min: "התראה מוקדמת",
  window_days: "חלון תיאום",
  interval_min: "מרווח בין מועדים",
};

async function logChange(actor: Actor, scope: string, field: string, oldValue: unknown, newValue: unknown) {
  const supabase = await serverClient();
  const { error } = await supabase.from("settings_history").insert({
    scope,
    field,
    old_value: oldValue == null ? null : String(oldValue),
    new_value: newValue == null ? null : String(newValue),
    changed_by: actor.id,
    changed_by_name: actor.name,
  });
  if (error) throw error;
}

export async function updateProfile(actor: Actor, input: z.infer<typeof profileSchema>): Promise<void> {
  if (input.duration_min < 1 || input.interval_min < 1 || input.window_days < 1) throw new ApiError(400, "invalid", "משך, מרווח וחלון התיאום חייבים להיות גדולים מאפס");
  if (input.window_days > 42) throw new ApiError(400, "invalid", "חלון התיאום יכול להגיע עד 42 ימים");
  if (input.notice_min > input.window_days * 1440) throw new ApiError(400, "invalid", "ההתראה המוקדמת ארוכה מחלון התיאום");
  const supabase = await serverClient();
  const { data: current, error: readError } = await supabase.from("settings").select("*").eq("profile", input.profile).single();
  if (readError) throw readError;
  const { profile, ...fields } = input;
  const changed = Object.entries(fields).filter(([key, value]) => current[key] !== value);
  if (changed.length === 0) return;
  const { error } = await supabase
    .from("settings")
    .update({ ...fields, updated_at: new Date().toISOString(), updated_by: actor.id })
    .eq("profile", profile);
  if (error) throw error;
  const prefix = profile === "regular" ? "פגישה רגילה" : "פגישה זוגית";
  for (const [key, value] of changed) await logChange(actor, "settings", `${prefix}: ${LABELS[key]}`, current[key], value);
}

export async function updateLinkValidity(actor: Actor, days: number): Promise<void> {
  if (!Number.isInteger(days) || days < 1 || days > 60) throw new ApiError(400, "invalid", "תוקף הקישור צריך להיות בין 1 ל-60 ימים");
  const supabase = await serverClient();
  const { data: current } = await supabase.from("agency_settings").select("booking_link_validity_days").single();
  if (current?.booking_link_validity_days === days) return;
  const { error } = await supabase.from("agency_settings").update({ booking_link_validity_days: days, updated_at: new Date().toISOString(), updated_by: actor.id }).eq("id", true);
  if (error) throw error;
  await logChange(actor, "settings", "תוקף קישור הזמנה", current?.booking_link_validity_days, days);
}

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const holidaySchema = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("edit"), date, blocks: z.boolean(), allDay: z.boolean(), from: time.optional(), to: time.optional() }),
  z.strictObject({ action: z.literal("add"), name: z.string().trim().min(1).max(100), from: date, to: date, allDay: z.boolean(), hourFrom: time.optional(), hourTo: time.optional() }),
  z.strictObject({ action: z.literal("edit_range"), id: z.string().min(1).max(64), name: z.string().trim().min(1).max(100), from: date, to: date, blocks: z.boolean(), allDay: z.boolean(), hourFrom: time.optional(), hourTo: time.optional() }),
  z.strictObject({ action: z.literal("delete"), id: z.string().min(1).max(64) }),
]);

const describe = (row: { blocks: boolean; blocked_from?: string | null; blocked_to?: string | null }) =>
  !row.blocks ? "פתוח" : row.blocked_from ? `חסום ${row.blocked_from.slice(0, 5)}–${(row.blocked_to ?? "23:59").slice(0, 5)}` : "חסום כל היום";

function datesBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let current = from; current <= to; current = addDays(current, 1)) out.push(current);
  return out;
}

function assertRange(from: string, to: string, allDay: boolean, hourFrom?: string, hourTo?: string) {
  if (to < from) throw new ApiError(400, "invalid", "תאריך הסיום צריך להיות באותו יום או אחרי תאריך ההתחלה");
  if (datesBetween(from, to).length > 60) throw new ApiError(400, "invalid", "אפשר להוסיף עד 60 ימים ברצף");
  if (!allDay && !(hourFrom && hourTo && hourTo > hourFrom)) throw new ApiError(400, "invalid", "שעת הסיום צריכה להיות אחרי שעת ההתחלה");
}

export async function changeHolidays(actor: Actor, input: z.infer<typeof holidaySchema>): Promise<void> {
  const supabase = await serverClient();
  const stamp = { updated_at: new Date().toISOString(), updated_by: actor.id };

  if (input.action === "edit") {
    if (input.blocks && !input.allDay && !(input.from && input.to && input.to > input.from)) throw new ApiError(400, "invalid", "שעת הסיום צריכה להיות אחרי שעת ההתחלה");
    const { data: before } = await supabase.from("holidays").select("*").eq("date", input.date).maybeSingle();
    if (!before) throw notFound();
    const change = { blocks: input.blocks, blocked_from: input.blocks && !input.allDay ? input.from : null, blocked_to: input.blocks && !input.allDay ? input.to : null };
    const { error } = await supabase.from("holidays").update({ ...change, manager_edited: true, ...stamp }).eq("date", input.date);
    if (error) throw error;
    await logChange(actor, "holiday", `${before.name} ● ${input.date.split("-").reverse().join(".")}`, describe(before), describe(change));
    return;
  }

  if (input.action === "add") {
    assertRange(input.from, input.to, input.allDay, input.hourFrom, input.hourTo);
    const range = randomUUID();
    const rows = datesBetween(input.from, input.to).map((day) => ({
      date: day,
      name: input.name,
      kind: "other",
      blocks: true,
      blocked_from: input.allDay ? null : input.hourFrom,
      blocked_to: input.allDay ? null : input.hourTo,
      source: "manager",
      manager_edited: true,
      range_id: range,
      ...stamp,
    }));
    const { error } = await supabase.from("holidays").insert(rows);
    if (error) {
      if (error.code === "23505") throw new ApiError(409, "date_taken", "כבר קיים יום חג או חופש באחד התאריכים");
      throw error;
    }
    await logChange(actor, "holiday", `יום חופש נוסף: ${input.name} ● ${input.from}${input.to !== input.from ? `–${input.to}` : ""}`, null, describe(rows[0]));
    return;
  }

  const { data: existing } = await supabase.from("holidays").select("*").eq("source", "manager").eq("range_id", input.id).order("date");
  if (!existing?.length) throw notFound();
  const first = existing[0];
  const label = `${first.name} ● ${first.date}${existing.length > 1 ? `–${existing[existing.length - 1].date}` : ""}`;

  if (input.action === "delete") {
    const { error } = await supabase.from("holidays").delete().eq("source", "manager").eq("range_id", input.id);
    if (error) throw error;
    await logChange(actor, "holiday", `יום חופש נמחק: ${label}`, describe(first), null);
    return;
  }

  assertRange(input.from, input.to, input.allDay || !input.blocks, input.hourFrom, input.hourTo);
  const rows = datesBetween(input.from, input.to).map((day) => ({
    date: day,
    name: input.name,
    kind: "other",
    blocks: input.blocks,
    blocked_from: input.blocks && !input.allDay ? input.hourFrom : null,
    blocked_to: input.blocks && !input.allDay ? input.hourTo : null,
    source: "manager",
    manager_edited: true,
    range_id: input.id,
    ...stamp,
  }));
  const { error: removeError } = await supabase.from("holidays").delete().eq("source", "manager").eq("range_id", input.id);
  if (removeError) throw removeError;
  const { error } = await supabase.from("holidays").insert(rows);
  if (error) {
    await supabase.from("holidays").insert(existing);
    if (error.code === "23505") throw new ApiError(409, "date_taken", "כבר קיים יום חג או חופש באחד התאריכים");
    throw error;
  }
  await logChange(actor, "holiday", label, describe(first), describe(rows[0]));
}
