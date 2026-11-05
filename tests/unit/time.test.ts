import { describe, expect, it } from "vitest";
import { addDays, fromWall, offsetMinutes, toWall, weekdayOf } from "@/lib/engine/time";

describe("Jerusalem time", () => {
  it("uses winter and summer offsets", () => {
    expect(offsetMinutes(new Date("2026-01-15T10:00:00Z"))).toBe(120);
    expect(offsetMinutes(new Date("2026-07-15T10:00:00Z"))).toBe(180);
  });

  it("round-trips wall time around both DST changes", () => {
    for (const [date, time] of [
      ["2026-03-26", "23:30"],
      ["2026-03-27", "01:30"],
      ["2026-03-27", "03:30"],
      ["2026-10-24", "23:30"],
      ["2026-10-25", "03:30"],
    ]) {
      const wall = toWall(fromWall(date, time));
      expect([wall.date, wall.time]).toEqual([date, time]);
    }
  });

  it("gives days on the change date their real length", () => {
    const hours = (date: string) =>
      (fromWall(addDays(date, 1), "00:00").getTime() - fromWall(date, "00:00").getTime()) / 3600000;
    expect(hours("2026-03-27")).toBe(23);
    expect(hours("2026-10-25")).toBe(25);
    expect(hours("2026-06-10")).toBe(24);
  });

  it("knows weekdays", () => {
    expect(weekdayOf("2026-11-08")).toBe(0);
  });
});
