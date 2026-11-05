import { z } from "zod";
import { addDays } from "@/lib/engine/time";

export const HEBCAL_URL = "https://www.hebcal.com/hebcal";

export const hebcalSchema = z.object({
  items: z.array(
    z.object({
      date: z.string(),
      title: z.string(),
      hebrew: z.string().optional(),
      category: z.string(),
      subcat: z.string().optional(),
      yomtov: z.boolean().optional(),
    }),
  ),
});

export type HebcalItem = z.infer<typeof hebcalSchema>["items"][number];

export type HolidayKind = "yomtov" | "erev" | "chol_hamoed" | "modern" | "other";

export interface HolidayRow {
  date: string;
  name: string;
  kind: HolidayKind;
  blocks: boolean;
  blocked_from: string | null;
  blocked_to: string | null;
  source: "hebcal";
}

const RANK: Record<HolidayKind, number> = { yomtov: 5, erev: 4, chol_hamoed: 3, modern: 2, other: 1 };

function kindOf(item: HebcalItem): HolidayKind {
  if (item.yomtov) return "yomtov";
  if (/^Erev /.test(item.title)) return "erev";
  if (/CH''M|Chol ha-?Moed/i.test(item.title)) return "chol_hamoed";
  if (item.subcat === "modern") return "modern";
  return "other";
}

const isIndependenceDay = (item: HebcalItem) => /Yom HaAtzma/i.test(item.title);

export function holidayRows(items: HebcalItem[]): HolidayRow[] {
  const candles = new Map<string, string>();
  const rows = new Map<string, HolidayRow>();

  for (const item of items) {
    if (item.category === "candles") {
      const match = item.date.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
      if (match) candles.set(match[1], match[2]);
    }
  }

  for (const item of items) {
    if (item.category !== "holiday") continue;
    const date = item.date.slice(0, 10);
    const kind = kindOf(item);
    const current = rows.get(date);
    if (current && RANK[current.kind] >= RANK[kind]) continue;
    rows.set(date, {
      date,
      name: item.hebrew ?? item.title,
      kind,
      blocks: kind === "yomtov" || isIndependenceDay(item),
      blocked_from: null,
      blocked_to: null,
      source: "hebcal",
    });
  }

  for (const row of rows.values()) {
    if (row.kind !== "yomtov") continue;
    const before = addDays(row.date, -1);
    const previous = rows.get(before);
    if (previous?.kind === "yomtov") continue;
    const entry = candles.get(before);
    if (previous) {
      previous.kind = "erev";
      previous.blocks = !!entry;
      previous.blocked_from = entry ?? null;
    } else {
      rows.set(before, { date: before, name: `ערב ${row.name}`, kind: "erev", blocks: !!entry, blocked_from: entry ?? null, blocked_to: null, source: "hebcal" });
    }
  }

  for (const row of rows.values()) {
    if (row.kind === "erev" && !row.blocked_from) {
      const entry = candles.get(row.date);
      row.blocked_from = entry ?? null;
      row.blocks = !!entry;
    }
  }

  return [...rows.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function hebcalQuery(start: string, end: string): string {
  const query = new URLSearchParams({
    v: "1",
    cfg: "json",
    maj: "on",
    min: "on",
    mod: "on",
    nx: "off",
    mf: "off",
    ss: "off",
    s: "off",
    c: "on",
    geonameid: "293397",
    i: "on",
    start,
    end,
  });
  return `${HEBCAL_URL}?${query}`;
}
