import { describe, expect, it } from "vitest";
import { evaluateDay, freeSlots, publicSlots, unionSlots, type AgentAvailability, type EngineContext } from "@/lib/engine/availability";
import { fromWall } from "@/lib/engine/time";

const settings = { durationMin: 30, bufferBeforeMin: 15, bufferAfterMin: 15, noticeMin: 240, windowDays: 21, intervalMin: 30 };
const SUNDAY = "2026-11-08";
const now = fromWall("2026-11-05", "08:00");

const agent = (over: Partial<AgentAvailability> = {}): AgentAvailability => ({
  email: "a@example.test",
  hours: [0, 1, 2, 3, 4].map((weekday) => ({ weekday, enabled: true, startTime: "09:00", endTime: "12:00" })),
  overrides: [],
  busy: [],
  meetingsPerDay: {},
  readable: true,
  ...over,
});

const context = (over: Partial<EngineContext> = {}): EngineContext => ({ settings, holidays: new Map(), now, ...over });
const times = (a: AgentAvailability, c = context(), date = SUNDAY) => freeSlots(a, date, date, c).map((slot) => slot.time);
const reason = (a: AgentAvailability, time: string, c = context(), date = SUNDAY) =>
  evaluateDay(a, date, c).find((verdict) => verdict.time === time)?.reason;

const busy = (from: string, to: string, id?: string) => ({ start: fromWall(SUNDAY, from).getTime(), end: fromWall(SUNDAY, to).getTime(), id });

describe("availability rules", () => {
  it("offers only slots that fit inside weekly hours on the interval", () => {
    expect(times(agent())).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]);
    expect(reason(agent(), "12:00")).toBe("outside_hours");
    expect(times(agent(), context({ settings: { ...settings, durationMin: 60 } }))).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00"]);
    expect(times(agent(), context({ settings: { ...settings, intervalMin: 60 } }))).toEqual(["09:00", "10:00", "11:00"]);
  });

  it("is closed on a day with weekly hours off", () => {
    expect(times(agent(), context(), "2026-11-07")).toEqual([]);
    const off = agent({ hours: [{ weekday: 0, enabled: false, startTime: "09:00", endTime: "12:00" }] });
    expect(times(off)).toEqual([]);
  });

  it("applies block overrides, whole day and part of a day", () => {
    expect(times(agent({ overrides: [{ date: SUNDAY, kind: "block" }] }))).toEqual([]);
    const part = agent({ overrides: [{ date: SUNDAY, kind: "block", startTime: "10:00", endTime: "11:00" }] });
    expect(times(part)).toEqual(["09:00", "09:30", "11:00", "11:30"]);
    expect(reason(part, "10:00")).toBe("override");
  });

  it("lets an open override add hours and win over a block", () => {
    const open = agent({ overrides: [{ date: SUNDAY, kind: "open", startTime: "20:00", endTime: "21:00" }] });
    expect(times(open)).toContain("20:30");
    const both = agent({
      overrides: [
        { date: SUNDAY, kind: "block" },
        { date: SUNDAY, kind: "open", startTime: "09:00", endTime: "10:00" },
      ],
    });
    expect(times(both)).toEqual(["09:00", "09:30"]);
  });

  it("pads busy blocks by the buffers on both sides", () => {
    const a = agent({ busy: [busy("10:00", "10:30")] });
    expect(reason(a, "10:00")).toBe("busy");
    expect(reason(a, "09:30")).toBe("buffer");
    expect(reason(a, "10:30")).toBe("buffer");
    expect(reason(a, "09:00")).toBeNull();
    expect(reason(a, "11:00")).toBeNull();
  });

  it("keeps the before buffer before each event and the after buffer after it", () => {
    const uneven = context({ settings: { ...settings, bufferBeforeMin: 15, bufferAfterMin: 60 } });
    const a = agent({ busy: [busy("10:00", "10:30")] });
    expect(reason(a, "09:00", uneven)).toBeNull();
    expect(reason(a, "09:30", uneven)).toBe("buffer");
    expect(reason(a, "11:00", uneven)).toBe("buffer");
    expect(reason(a, "11:30", uneven)).toBeNull();
  });

  it("respects notice and booking window", () => {
    const soon = context({ now: fromWall(SUNDAY, "06:00") });
    expect(reason(agent(), "09:30", soon)).toBe("notice");
    expect(reason(agent(), "10:00", soon)).toBeNull();
    expect(reason(agent(), "10:00", context(), "2026-11-29")).toBe("window");
    expect(reason(agent(), "10:00", context(), "2026-11-26")).toBeNull();
  });

  it("drops the whole day at the daily quota, unless quotas are ignored", () => {
    const full = agent({ dailyQuota: 2, meetingsPerDay: { [SUNDAY]: 2 } });
    expect(times(full)).toEqual([]);
    expect(reason(full, "10:00")).toBe("quota");
    expect(times(full, context({ ignoreQuota: true }))).toHaveLength(6);
    expect(times(full, context({ quotaCreditDate: SUNDAY }))).toHaveLength(6);
  });

  it("never treats an unreadable calendar as free", () => {
    expect(times(agent({ readable: false }))).toEqual([]);
    expect(reason(agent({ readable: false }), "10:00")).toBe("calendar_unreadable");
  });
});

describe("holidays", () => {
  const holidays = (row: object) => new Map([[SUNDAY, { date: SUNDAY, blocks: true, ...row }]]);

  it("removes a whole-day holiday", () => {
    expect(times(agent(), context({ holidays: holidays({}) }))).toEqual([]);
    expect(reason(agent(), "10:00", context({ holidays: holidays({}) }))).toBe("holiday");
  });

  it("keeps a day whose row does not block", () => {
    expect(times(agent(), context({ holidays: holidays({ blocks: false }) }))).toHaveLength(6);
  });

  it("drops only slots running past the entry time on the day before", () => {
    const c = context({ holidays: holidays({ blockedFrom: "10:45" }) });
    expect(times(agent(), c)).toEqual(["09:00", "09:30", "10:00"]);
  });

  it("drops only slots inside a partial range", () => {
    const c = context({ holidays: holidays({ blockedFrom: "10:00", blockedTo: "11:00" }) });
    expect(times(agent(), c)).toEqual(["09:00", "09:30", "11:00", "11:30"]);
  });

  it("is not reopened by an agent's open override", () => {
    const a = agent({ overrides: [{ date: SUNDAY, kind: "open", startTime: "09:00", endTime: "12:00" }] });
    expect(times(a, context({ holidays: holidays({}) }))).toEqual([]);
  });
});

describe("spouse and reschedule exemptions", () => {
  const partner = busy("10:00", "10:30", "partner");
  const other = busy("11:30", "12:00", "other");

  it("drops the buffer only against the partner meeting", () => {
    const a = agent({ busy: [partner, other] });
    const c = context({ unpaddedBlockIds: new Set(["partner"]) });
    expect(reason(a, "10:30", c)).toBeNull();
    expect(reason(a, "09:30", c)).toBeNull();
    expect(reason(a, "10:00", c)).toBe("busy");
    expect(reason(a, "11:00", c)).toBe("buffer");
    expect(reason(a, "10:30", context())).toBe("buffer");
  });

  it("frees a booking's own block when rescheduling", () => {
    const a = agent({ busy: [partner] });
    const c = context({ ignoredBlockIds: new Set(["partner"]) });
    expect(reason(a, "10:00", c)).toBeNull();
  });
});

describe("daylight saving time", () => {
  it("skips the missing hour in March and keeps wall times", () => {
    const date = "2027-03-26";
    const a = agent({ hours: [{ weekday: 5, enabled: true, startTime: "00:00", endTime: "06:00" }] });
    const slots = freeSlots(a, date, date, context({ now: fromWall("2027-03-20", "08:00") }));
    expect(slots.map((slot) => slot.time)).not.toContain("02:00");
    expect(slots.map((slot) => slot.time)).toContain("03:00");
    expect(new Date(slots.find((slot) => slot.time === "03:00")!.start).toISOString()).toBe("2027-03-26T00:00:00.000Z");
  });

  it("keeps summer and winter slots on the same wall clock", () => {
    const a = agent();
    const before = freeSlots(a, "2026-10-22", "2026-10-22", context({ now: fromWall("2026-10-15", "08:00") }));
    const after = freeSlots(a, "2026-10-26", "2026-10-26", context({ now: fromWall("2026-10-15", "08:00") }));
    expect(before.map((slot) => slot.time)).toEqual(after.map((slot) => slot.time));
    expect(new Date(before[0].start).toISOString()).toBe("2026-10-22T06:00:00.000Z");
    expect(new Date(after[0].start).toISOString()).toBe("2026-10-26T07:00:00.000Z");
  });
});

describe("pool union", () => {
  it("offers a slot when at least one agent can take it, and hides identities in the public form", () => {
    const first = agent({ email: "first@example.test", busy: [busy("09:00", "12:00")] });
    const second = agent({ email: "second@example.test", hours: [{ weekday: 0, enabled: true, startTime: "09:00", endTime: "10:00" }] });
    const union = unionSlots([first, second], SUNDAY, SUNDAY, context());
    expect(union.get(SUNDAY)?.get("09:00")).toEqual(["second@example.test"]);
    const shown = publicSlots(union);
    expect(shown[SUNDAY]).toEqual(["09:00", "09:30"]);
    expect(JSON.stringify(shown)).not.toContain("example.test");
  });

  it("gives identical slots for identical input", () => {
    const a = agent({ busy: [busy("10:00", "10:30")] });
    expect(freeSlots(a, SUNDAY, SUNDAY, context())).toEqual(freeSlots(structuredClone(a), SUNDAY, SUNDAY, context()));
  });
});
