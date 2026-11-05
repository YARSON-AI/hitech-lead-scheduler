import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { addDays, todayInJerusalem } from "@/lib/engine/time";
import { syncHolidays } from "@/lib/holidays/sync";
import { admin } from "./helpers";

const FAR = "2031-02-03";
const OFF = "2031-02-04";

describe("holiday sync", () => {
  afterAll(async () => {
    await admin().from("holidays").delete().in("date", [FAR, OFF]);
  });

  it("fills four years ahead and never overwrites a manager's rows", async () => {
    const db = admin();
    const first = await syncHolidays();
    expect(first.ok).toBe(true);
    const { data: last } = await db.from("holidays").select("date").order("date", { ascending: false }).limit(1).single();
    expect(last!.date >= addDays(todayInJerusalem(), 365 * 4)).toBe(true);

    const { data: yomtov } = await db.from("holidays").select("date, blocks").eq("kind", "yomtov").eq("manager_edited", false).limit(1).single();
    await db.from("holidays").update({ blocks: false, manager_edited: true }).eq("date", yomtov!.date);
    await db.from("holidays").upsert({ date: OFF, name: "day off", kind: "other", blocks: true, source: "manager" });

    await syncHolidays();

    const edited = await db.from("holidays").select("blocks").eq("date", yomtov!.date).single();
    const added = await db.from("holidays").select("blocks, source").eq("date", OFF).single();
    expect(edited.data!.blocks).toBe(false);
    expect(added.data).toEqual({ blocks: true, source: "manager" });

    await db.from("holidays").update({ blocks: true, manager_edited: false }).eq("date", yomtov!.date);
  });

  it("is not reachable from the booking path", () => {
    const files = fs.readdirSync("lib/booking", { recursive: true }).map(String);
    for (const file of files) {
      const source = fs.readFileSync(path.join("lib/booking", file), "utf8");
      expect(source).not.toMatch(/hebcal/i);
    }
  });
});
