import { addDays, fromWall, minutesToTime, timeToMinutes, toWall, todayInJerusalem, weekdayOf } from "./time";

export interface MeetingSettings {
  durationMin: number;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  noticeMin: number;
  windowDays: number;
  intervalMin: number;
}

export interface WeeklyHours {
  weekday: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export interface DateOverride {
  date: string;
  kind: "block" | "open";
  startTime?: string | null;
  endTime?: string | null;
}

export interface Holiday {
  date: string;
  blocks: boolean;
  blockedFrom?: string | null;
  blockedTo?: string | null;
}

export interface BusyBlock {
  start: number;
  end: number;
  id?: string;
}

export interface AgentAvailability {
  email: string;
  hours: WeeklyHours[];
  overrides: DateOverride[];
  busy: BusyBlock[];
  dailyQuota?: number | null;
  meetingsPerDay: Record<string, number>;
  readable: boolean;
}

export interface EngineContext {
  settings: MeetingSettings;
  holidays: Map<string, Holiday>;
  now: Date;
  ignoreQuota?: boolean;
  ignoredBlockIds?: ReadonlySet<string>;
  unpaddedBlockIds?: ReadonlySet<string>;
  quotaCreditDate?: string;
}

export type Reason =
  | "calendar_unreadable"
  | "outside_hours"
  | "override"
  | "holiday"
  | "busy"
  | "buffer"
  | "notice"
  | "window"
  | "quota";

export interface SlotVerdict {
  time: string;
  start: number;
  reason: Reason | null;
}

type Span = [number, number];

const MINUTE = 60000;

function subtract(spans: Span[], cut: Span): Span[] {
  const out: Span[] = [];
  for (const [start, end] of spans) {
    if (cut[1] <= start || cut[0] >= end) {
      out.push([start, end]);
      continue;
    }
    if (cut[0] > start) out.push([start, cut[0]]);
    if (cut[1] < end) out.push([cut[1], end]);
  }
  return out;
}

function merge(spans: Span[]): Span[] {
  const sorted = [...spans].sort((a, b) => a[0] - b[0]);
  const out: Span[] = [];
  for (const span of sorted) {
    const last = out[out.length - 1];
    if (last && span[0] <= last[1]) last[1] = Math.max(last[1], span[1]);
    else out.push([span[0], span[1]]);
  }
  return out;
}

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

const asMinutes = (time: string | null | undefined, fallback: number) => (time ? timeToMinutes(time) : fallback);

export function dayWindows(agent: AgentAvailability, date: string): { windows: Span[]; blocks: Span[] } {
  const weekday = weekdayOf(date);
  const weekly = agent.hours.find((row) => row.weekday === weekday && row.enabled);
  let windows: Span[] = weekly ? [[timeToMinutes(weekly.startTime), timeToMinutes(weekly.endTime)]] : [];
  const blocks: Span[] = [];
  const dayOverrides = agent.overrides.filter((override) => override.date === date);
  for (const override of dayOverrides) {
    if (override.kind !== "block") continue;
    const span: Span = [asMinutes(override.startTime, 0), asMinutes(override.endTime, 1440)];
    blocks.push(span);
    windows = subtract(windows, span);
  }
  for (const override of dayOverrides) {
    if (override.kind === "open") windows.push([asMinutes(override.startTime, 0), asMinutes(override.endTime, 1440)]);
  }
  return { windows: merge(windows), blocks };
}

export function evaluateDay(agent: AgentAvailability, date: string, context: EngineContext): SlotVerdict[] {
  const { settings, now } = context;
  const { windows, blocks } = dayWindows(agent, date);
  const holiday = context.holidays.get(date);
  const today = todayInJerusalem(now);
  const lastDate = addDays(today, settings.windowDays);
  const earliest = now.getTime() + settings.noticeMin * MINUTE;
  const count = (agent.meetingsPerDay[date] ?? 0) - (context.quotaCreditDate === date ? 1 : 0);
  const quotaFull = !context.ignoreQuota && agent.dailyQuota != null && count >= agent.dailyQuota;
  const busy = agent.busy.filter((block) => !block.id || !context.ignoredBlockIds?.has(block.id));
  const verdicts: SlotVerdict[] = [];

  for (let minutes = 0; minutes + settings.durationMin <= 1440; minutes += settings.intervalMin) {
    const time = minutesToTime(minutes);
    const startDate = fromWall(date, time);
    if (toWall(startDate).time !== time) continue;
    const start = startDate.getTime();
    const end = start + settings.durationMin * MINUTE;
    const endMinutes = minutes + settings.durationMin;

    const verdict = (): Reason | null => {
      if (!agent.readable) return "calendar_unreadable";
      if (!windows.some(([from, to]) => minutes >= from && endMinutes <= to)) {
        return blocks.some(([from, to]) => overlaps(minutes, endMinutes, from, to)) ? "override" : "outside_hours";
      }
      if (holiday?.blocks && overlaps(minutes, endMinutes, asMinutes(holiday.blockedFrom, 0), asMinutes(holiday.blockedTo, 1440))) {
        return "holiday";
      }
      if (busy.some((block) => overlaps(start, end, block.start, block.end))) return "busy";
      const padded = busy.some((block) => {
        if (block.id && context.unpaddedBlockIds?.has(block.id)) return false;
        return overlaps(start, end, block.start - settings.bufferAfterMin * MINUTE, block.end + settings.bufferBeforeMin * MINUTE);
      });
      if (padded) return "buffer";
      if (start < earliest) return "notice";
      if (date > lastDate) return "window";
      if (quotaFull) return "quota";
      return null;
    };
    verdicts.push({ time, start, reason: verdict() });
  }
  return verdicts;
}

export interface FreeSlot {
  date: string;
  time: string;
  start: number;
}

export function freeSlots(agent: AgentAvailability, from: string, to: string, context: EngineContext): FreeSlot[] {
  const slots: FreeSlot[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    for (const verdict of evaluateDay(agent, date, context)) {
      if (verdict.reason === null) slots.push({ date, time: verdict.time, start: verdict.start });
    }
  }
  return slots;
}

export type SlotUnion = Map<string, Map<string, string[]>>;

export function unionSlots(agents: AgentAvailability[], from: string, to: string, context: EngineContext): SlotUnion {
  const union: SlotUnion = new Map();
  for (const agent of agents) {
    for (const slot of freeSlots(agent, from, to, context)) {
      if (!union.has(slot.date)) union.set(slot.date, new Map());
      const day = union.get(slot.date)!;
      day.set(slot.time, [...(day.get(slot.time) ?? []), agent.email]);
    }
  }
  return union;
}

export function publicSlots(union: SlotUnion): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const date of [...union.keys()].sort()) {
    out[date] = [...union.get(date)!.keys()].sort();
  }
  return out;
}

export function verdictAt(agent: AgentAvailability, start: Date, context: EngineContext, anyMinute = false): Reason | "not_a_slot" | null {
  const day = anyMinute ? { ...context, settings: { ...context.settings, intervalMin: 1 } } : context;
  const verdict = evaluateDay(agent, toWall(start).date, day).find((row) => row.start === start.getTime());
  return verdict ? verdict.reason : "not_a_slot";
}

export function isFree(agent: AgentAvailability, start: Date, context: EngineContext): boolean {
  return verdictAt(agent, start, context) === null;
}
