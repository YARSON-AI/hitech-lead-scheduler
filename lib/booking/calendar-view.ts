import "server-only";
import { evaluateDay, dayWindows, type Reason } from "@/lib/engine/availability";
import { addDays, fromWall, minutesToTime, toWall, todayInJerusalem, weekdayOf } from "@/lib/engine/time";
import { notFound } from "@/lib/http/route";
import { adminClient } from "@/lib/supabase/admin";
import { contextFor, loadAgents } from "./availability";
import { agentById } from "./core";

export type BlockKind = "off" | "meeting" | "pair" | "busy" | "buffer" | "blocked" | "holiday" | "notice";

export interface CalendarBlock {
  kind: BlockKind;
  start: number;
  end: number;
  label: string;
  time: string;
  title: string;
  parts?: { label: string; time: string }[];
}

export interface CalendarDay {
  date: string;
  weekday: number;
  isToday: boolean;
  allDay: { kind: "blocked" | "holiday" | "quota"; label: string } | null;
  blocks: CalendarBlock[];
}

const REASON_TEXT: Record<Reason, string> = {
  calendar_unreadable: "היומן לא נגיש",
  outside_hours: "מחוץ לשעות הפעילות",
  override: "החרגה",
  holiday: "חג",
  busy: "עסוק ביומן",
  buffer: "מרווח לפני או אחרי פגישה",
  notice: "קצר מההתראה המוקדמת",
  window: "מעבר לחלון התיאום",
  quota: "המכסה היומית מלאה",
};

const KIND_FOR: Partial<Record<Reason, BlockKind>> = {
  calendar_unreadable: "off",
  outside_hours: "off",
  override: "blocked",
  holiday: "holiday",
  notice: "notice",
  window: "notice",
};

const wallMinutes = (instant: number) => toWall(new Date(instant)).minutes;

export async function agentCalendar(agentId: string, from: string, days: number): Promise<CalendarDay[]> {
  const agent = await agentById(agentId);
  if (!agent) throw notFound();
  const to = addDays(from, days - 1);
  const [[loaded], context, holidayRows, bookingRows] = await Promise.all([
    loadAgents([agent], from, to),
    contextFor({ profile: "regular" }, from, to),
    adminClient().from("holidays").select("date, name, blocks, blocked_from").gte("date", from).lte("date", to),
    adminClient()
      .from("bookings")
      .select("id, start_at, end_at, spouse_booking_id, customer_name")
      .eq("agent_email", agent.email)
      .eq("status", "confirmed")
      .gte("start_at", fromWall(from, "00:00").toISOString())
      .lt("start_at", fromWall(addDays(to, 1), "00:00").toISOString()),
  ]);
  const today = todayInJerusalem();
  const bookings = bookingRows.data ?? [];
  const bookingIds = new Set(bookings.map((row) => row.id));
  const out: CalendarDay[] = [];

  for (let date = from; date <= to; date = addDays(date, 1)) {
    const verdicts = evaluateDay({ ...loaded, busy: [] }, date, context);
    const holiday = holidayRows.data?.find((row) => row.date === date && row.blocks);
    const { blocks: overrideBlocks } = dayWindows(loaded, date);
    const wholeBlock = overrideBlocks.some(([start, end]) => start === 0 && end === 1440);
    const note = loaded.overrides.find((row) => row.date === date && row.kind === "block" && !row.startTime);
    const quotaFull = verdicts.some((verdict) => verdict.reason === "quota");
    const allDay: CalendarDay["allDay"] = holiday && !holiday.blocked_from
      ? { kind: "holiday", label: holiday.name }
      : wholeBlock
        ? { kind: "blocked", label: "חסום" + (note ? "" : "") }
        : quotaFull
          ? { kind: "quota", label: "מכסה יומית מלאה" }
          : null;

    const blocks: CalendarBlock[] = [];
    const step = context.settings.intervalMin;
    let run = null as { reason: Reason; start: number; end: number } | null;
    const flush = () => {
      const current = run;
      run = null;
      if (!current) return;
      const kind = KIND_FOR[current.reason];
      if (kind && !(allDay && (kind === "blocked" || kind === "holiday"))) {
        blocks.push({
          kind,
          start: current.start,
          end: current.end,
          label: kind === "blocked" ? "חסום" : kind === "holiday" ? "חג" : "",
          time: kind === "blocked" || kind === "holiday" ? minutesToTime(current.start) : "",
          title: REASON_TEXT[current.reason],
        });
      }
    };
    verdicts.forEach((verdict) => {
      const minutes = wallMinutes(verdict.start);
      const reason: Reason | null = verdict.reason === "quota" ? null : verdict.reason;
      const active = run as { reason: Reason; start: number; end: number } | null;
      if (reason && active?.reason === reason && active.end === minutes) {
        active.end = minutes + step;
      } else {
        flush();
        if (reason) run = { reason, start: minutes, end: minutes + step };
      }
    });
    flush();
    const last = verdicts[verdicts.length - 1];
    if (last && wallMinutes(last.start) + step < 1440 && blocks.length && blocks[blocks.length - 1].kind === "off") blocks[blocks.length - 1].end = 1440;

    const { bufferBeforeMin, bufferAfterMin } = context.settings;
    const zones = loaded.busy
      .filter((busy) => toWall(new Date(busy.start)).date === date)
      .map((busy) => [Math.max(0, wallMinutes(busy.start) - bufferBeforeMin), Math.min(1440, Math.max(wallMinutes(busy.start) + 15, wallMinutes(busy.end)) + bufferAfterMin)])
      .sort((a, b) => a[0] - b[0]);
    const merged: number[][] = [];
    for (const zone of zones) {
      const previous = merged[merged.length - 1];
      if (previous && zone[0] <= previous[1]) previous[1] = Math.max(previous[1], zone[1]);
      else merged.push([...zone]);
    }
    for (const [start, end] of merged) blocks.push({ kind: "buffer", start, end, label: "", time: "", title: REASON_TEXT.buffer });

    for (const busy of loaded.busy) {
      if (toWall(new Date(busy.start)).date !== date) continue;
      if (busy.id && bookingIds.has(busy.id)) continue;
      const start = wallMinutes(busy.start);
      const end = Math.max(start + 15, wallMinutes(busy.end));
      blocks.push({ kind: "busy", start, end, label: "עסוק", time: minutesToTime(start), title: REASON_TEXT.busy });
    }

    const dayBookings = bookings.filter((row) => toWall(new Date(row.start_at)).date === date);
    const used = new Set<string>();
    for (const row of dayBookings) {
      if (used.has(row.id)) continue;
      const start = wallMinutes(new Date(row.start_at).getTime());
      const end = Math.max(start + 15, wallMinutes(new Date(row.end_at).getTime()));
      const partner = row.spouse_booking_id ? dayBookings.find((other) => other.id === row.spouse_booking_id) : null;
      if (partner) {
        used.add(partner.id);
        const partnerStart = wallMinutes(new Date(partner.start_at).getTime());
        const partnerEnd = wallMinutes(new Date(partner.end_at).getTime());
        const [first, second] = start <= partnerStart ? [row, partner] : [partner, row];
        blocks.push({
          kind: "pair",
          start: Math.min(start, partnerStart),
          end: Math.max(end, partnerEnd),
          label: "פגישה זוגית",
          time: minutesToTime(Math.min(start, partnerStart)),
          title: "פגישה זוגית",
          parts: [first, second].map((item) => ({ label: item.customer_name, time: toWall(new Date(item.start_at)).time })),
        });
      } else {
        blocks.push({ kind: "meeting", start, end, label: row.customer_name, time: minutesToTime(start), title: "פגישה במערכת" });
      }
    }

    out.push({ date, weekday: weekdayOf(date), isToday: date === today, allDay, blocks });
  }
  return out;
}
