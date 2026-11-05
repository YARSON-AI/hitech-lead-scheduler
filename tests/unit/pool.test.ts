import { describe, expect, it } from "vitest";
import { buildPool, expectedCount, paceRatio } from "@/lib/engine/pool";
import type { RosterAgent } from "@/lib/integrations/airtable/types";

const today = { daysElapsed: 15, daysInMonth: 30 };
let id = 0;
const make = (over: Partial<RosterAgent> = {}): RosterAgent => {
  id += 1;
  return {
    id: `r${id}`,
    firstName: `a${id}`,
    lastName: "x",
    name: `a${id} x`,
    email: `a${id}@example.test`,
    trafficLight: "🟢",
    monthlyQuota: 40,
    weight: 100,
    weightLowered: false,
    monthlyCount: 0,
    exclusions: {},
    ...over,
  };
};

const auto = (roster: RosterAgent[], extra = {}) => buildPool(roster, { mode: "auto", today, random: () => 0.5, ...extra }).agents;

describe("automatic pool", () => {
  it("computes expected pace from quota, days and weight", () => {
    expect(expectedCount(make({ monthlyQuota: 40, weight: 50 }), today)).toBe(10);
    expect(expectedCount(make({ monthlyQuota: undefined }), today)).toBeUndefined();
  });

  it("removes red traffic lights and excluded types", () => {
    const red = make({ trafficLight: "🔴" });
    const noPension = make({ exclusions: { pension: true } });
    const noHealth = make({ exclusions: { health: true } });
    const open = make();
    const result = auto([red, noPension, noHealth, open], { specialization: "pension", interest: "health" });
    expect(result.map((agent) => agent.id)).toEqual([open.id]);
  });

  it("uses agents over quota only when nobody is under it", () => {
    const over = make({ monthlyQuota: 5, monthlyCount: 5 });
    const under = make();
    expect(auto([over, under]).map((agent) => agent.id)).not.toContain(over.id);
    expect(auto([over]).map((agent) => agent.id)).toEqual([over.id]);
  });

  it("excludes agents ahead of pace, but tops up to ten by pace ratio", () => {
    const ahead = Array.from({ length: 12 }, (_, index) => make({ monthlyQuota: 40, monthlyCount: 25 + index }));
    const behind = make({ monthlyCount: 0 });
    const pool = auto([...ahead, behind]);
    expect(pool).toHaveLength(10);
    expect(pool[0].id).toBe(behind.id);
    expect(pool.map((agent) => agent.id)).toContain(ahead[0].id);
    expect(pool.map((agent) => agent.id)).not.toContain(ahead[11].id);
  });

  it("drops ahead-of-pace agents when ten remain", () => {
    const fine = Array.from({ length: 10 }, () => make());
    const ahead = make({ monthlyQuota: 40, monthlyCount: 30 });
    expect(auto([...fine, ahead]).map((agent) => agent.id)).not.toContain(ahead.id);
  });

  it("never paces out an unlimited agent or one whose weight was lowered", () => {
    const fine = Array.from({ length: 10 }, () => make());
    const unlimited = make({ monthlyQuota: undefined, monthlyCount: 99 });
    const lowered = make({ monthlyCount: 25, weightLowered: true });
    const ids = auto([...fine, unlimited, lowered]).map((agent) => agent.id);
    expect(ids).toContain(unlimited.id);
    expect(ids).toContain(lowered.id);
  });

  it("orders hosts furthest behind their own target first", () => {
    const a = make({ monthlyCount: 10 });
    const b = make({ monthlyCount: 1 });
    const c = make({ monthlyCount: 5 });
    expect(auto([a, b, c]).map((agent) => agent.id)).toEqual([b.id, c.id, a.id]);
    expect(paceRatio(b, today)).toBeLessThan(paceRatio(c, today));
  });
});

describe("manual pool", () => {
  it("applies only the specialization filter", () => {
    const red = make({ trafficLight: "🔴", monthlyQuota: 1, monthlyCount: 9 });
    const excluded = make({ exclusions: { pension: true } });
    const ids = buildPool([red, excluded], { mode: "manual", specialization: "pension", today }).agents.map((agent) => agent.id);
    expect(ids).toEqual([red.id]);
  });
});
