import "server-only";
import { addDays, todayInJerusalem } from "@/lib/engine/time";
import { adminClient } from "@/lib/supabase/admin";
import { hebcalQuery, hebcalSchema, holidayRows } from "./hebcal";

export async function syncHolidays(): Promise<{ ok: boolean; inserted: number; total: number }> {
  const start = todayInJerusalem();
  const end = addDays(start, 365 * 5);
  let rows;
  try {
    const response = await fetch(hebcalQuery(start, end), { cache: "no-store" });
    if (!response.ok) throw new Error(`status ${response.status}`);
    rows = holidayRows(hebcalSchema.parse(await response.json()).items);
  } catch (error) {
    console.error(JSON.stringify({ level: "error", at: "holiday-sync", message: (error as Error).message }));
    return { ok: false, inserted: 0, total: 0 };
  }
  const db = adminClient();
  const { data, error } = await db.from("holidays").upsert(rows, { onConflict: "date", ignoreDuplicates: true }).select("date");
  if (error) throw error;
  return { ok: true, inserted: data?.length ?? 0, total: rows.length };
}
