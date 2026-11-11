import type { RosterAgent } from "@/lib/integrations/airtable/types";

export const MIN_AVAILABLE_HOSTS = 10;
const PACE_RATIO_EPSILON = 0.01;
const FORBIDDEN_TRAFFIC_LIGHT = "🔴";

export interface PoolOptions {
  mode: "auto" | "manual";
  specialization?: string | null;
  interest?: string | null;
  today: { daysElapsed: number; daysInMonth: number };
  random?: () => number;
}

export interface PoolResult {
  agents: RosterAgent[];
  excluded: { trafficLight: number; specialization: number; monthlyQuota: number; pacing: number };
  dropped: { name: string; reason: "trafficLight" | "specialization" | "monthlyQuota" | "pacing" }[];
}

export function jerusalemDayInfo(now: Date = new Date()): { daysElapsed: number; daysInMonth: number } {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number);
  return { daysElapsed: day, daysInMonth: new Date(year, month, 0).getDate() };
}

export function expectedCount(agent: RosterAgent, today: PoolOptions["today"]): number | undefined {
  if (agent.monthlyQuota == null) return undefined;
  return agent.monthlyQuota * (today.daysElapsed / today.daysInMonth) * ((agent.weight ?? 100) / 100);
}

export function paceRatio(agent: RosterAgent, today: PoolOptions["today"]): number {
  return agent.monthlyCount / Math.max(expectedCount(agent, today) ?? PACE_RATIO_EPSILON, PACE_RATIO_EPSILON);
}

const atMonthlyLimit = (agent: RosterAgent) => agent.monthlyQuota != null && agent.monthlyCount >= agent.monthlyQuota;

export function buildPool(roster: RosterAgent[], options: PoolOptions): PoolResult {
  const random = options.random ?? Math.random;
  const excluded = { trafficLight: 0, specialization: 0, monthlyQuota: 0, pacing: 0 };
  const isExcludedFor = (agent: RosterAgent, type?: string | null) => !!type && agent.exclusions[type] === true;
  const dropped: PoolResult["dropped"] = [];
  const drop = (list: RosterAgent[], reason: PoolResult["dropped"][number]["reason"]) => list.forEach((agent) => dropped.push({ name: agent.name, reason }));

  if (options.mode === "manual") {
    const agents = roster
      .filter((agent) => !isExcludedFor(agent, options.specialization))
      .sort((a, b) => a.name.localeCompare(b.name, "he"));
    excluded.specialization = roster.length - agents.length;
    drop(roster.filter((agent) => !agents.includes(agent)), "specialization");
    return { agents, excluded, dropped };
  }

  const matched = roster.filter((agent) => {
    if (agent.trafficLight === FORBIDDEN_TRAFFIC_LIGHT) {
      excluded.trafficLight++;
      drop([agent], "trafficLight");
      return false;
    }
    if (isExcludedFor(agent, options.specialization) || isExcludedFor(agent, options.interest)) {
      excluded.specialization++;
      drop([agent], "specialization");
      return false;
    }
    return true;
  });

  const primary = matched.filter((agent) => !atMonthlyLimit(agent));
  const selected = primary.length > 0 ? primary : matched;
  excluded.monthlyQuota = matched.length - selected.length;
  drop(matched.filter((agent) => !selected.includes(agent)), "monthlyQuota");

  const ratioSort = (list: RosterAgent[]) =>
    [...list].sort((a, b) => {
      const diff = paceRatio(a, options.today) - paceRatio(b, options.today);
      return diff !== 0 ? diff : random() - 0.5;
    });

  if (selected.length <= 1) return { agents: selected, excluded, dropped };

  const kept: RosterAgent[] = [];
  const paced: RosterAgent[] = [];
  for (const agent of selected) {
    const expected = expectedCount(agent, options.today);
    if (expected == null || agent.weightLowered || agent.monthlyCount < expected) kept.push(agent);
    else paced.push(agent);
  }

  let final = kept;
  if (final.length < MIN_AVAILABLE_HOSTS && paced.length > 0) {
    final = [...final, ...ratioSort(paced).slice(0, MIN_AVAILABLE_HOSTS - final.length)];
  }
  excluded.pacing = selected.length - final.length;
  drop(selected.filter((agent) => !final.includes(agent)), "pacing");

  return { agents: ratioSort(final), excluded, dropped };
}
