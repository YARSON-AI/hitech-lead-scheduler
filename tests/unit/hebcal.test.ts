import { describe, expect, it } from "vitest";
import { holidayRows, type HebcalItem } from "@/lib/holidays/hebcal";

const holiday = (date: string, title: string, extra: Partial<HebcalItem> = {}): HebcalItem => ({ date, title, hebrew: title, category: "holiday", ...extra });
const candles = (date: string, time: string): HebcalItem => ({ date: `${date}T${time}:00+03:00`, title: "Candle lighting", category: "candles" });
const row = (rows: ReturnType<typeof holidayRows>, date: string) => rows.find((item) => item.date === date);

describe("Hebcal defaults", () => {
  it("blocks a yom tov whole day, and the day before from the entry time", () => {
    const rows = holidayRows([
      holiday("2027-10-01", "Erev Rosh Hashana", { subcat: "major" }),
      candles("2027-10-01", "18:06"),
      holiday("2027-10-02", "Rosh Hashana 5788", { yomtov: true, subcat: "major" }),
      candles("2027-10-02", "19:01"),
      holiday("2027-10-03", "Rosh Hashana II", { yomtov: true, subcat: "major" }),
    ]);
    expect(row(rows, "2027-10-01")).toMatchObject({ kind: "erev", blocks: true, blocked_from: "18:06" });
    expect(row(rows, "2027-10-02")).toMatchObject({ kind: "yomtov", blocks: true, blocked_from: null });
    expect(row(rows, "2027-10-03")).toMatchObject({ kind: "yomtov", blocks: true });
  });

  it("treats Chol HaMoed before a yom tov as the day before", () => {
    const rows = holidayRows([
      holiday("2027-04-26", "Pesach VI (CH''M)", { subcat: "major" }),
      candles("2027-04-26", "18:50"),
      holiday("2027-04-27", "Pesach VII", { yomtov: true, subcat: "major" }),
      holiday("2027-04-25", "Pesach V (CH''M)", { subcat: "major" }),
    ]);
    expect(row(rows, "2027-04-26")).toMatchObject({ kind: "erev", blocks: true, blocked_from: "18:50" });
    expect(row(rows, "2027-04-25")).toMatchObject({ kind: "chol_hamoed", blocks: false });
  });

  it("blocks Independence Day and leaves other days open", () => {
    const rows = holidayRows([
      holiday("2027-05-12", "Yom HaAtzma'ut", { subcat: "modern" }),
      holiday("2027-05-11", "Yom HaZikaron", { subcat: "modern" }),
      holiday("2027-03-23", "Purim", { subcat: "minor" }),
      candles("2027-03-19", "17:40"),
    ]);
    expect(row(rows, "2027-05-12")).toMatchObject({ kind: "modern", blocks: true });
    expect(row(rows, "2027-05-11")?.blocks).toBe(false);
    expect(row(rows, "2027-03-23")?.blocks).toBe(false);
    expect(rows.map((item) => item.date)).not.toContain("2027-03-19");
  });
});
