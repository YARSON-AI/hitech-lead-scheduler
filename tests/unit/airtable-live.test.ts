import { describe, expect, it } from "vitest";
import { toRosterAgent } from "@/lib/integrations/airtable/live";

describe("Airtable agent record", () => {
  it("maps quotas, exclusions and the block fields", () => {
    const agent = toRosterAgent("rec1", {
      "שם פרטי": "דנה",
      "שם משפחה": "בדיקה",
      "מייל": " Dana@Example.test ",
      "רמזור": "🔴",
      "מכסה חודשית": 40,
      "היה שינוי במשקל הסוכן": true,
      "פיילוט": true,
      "פנסיה": true,
      "תאריך חסימה": "2026-11-01",
      "סיבת החסימה": ["ריג'קטים", "החלטת מטה"],
    });
    expect(agent).toMatchObject({ id: "rec1", email: "dana@example.test", trafficLight: "🔴", monthlyQuota: 40, monthlyCount: 0, weightLowered: true, blockedSince: "2026-11-01" });
    expect(agent?.exclusions).toEqual({ "פנסיה": true });
    expect(agent?.blockReason).toContain("ריג'קטים");
    expect(agent?.blockReason).toContain("החלטת מטה");
  });

  it("skips a record without an email", () => {
    expect(toRosterAgent("rec2", { "שם פרטי": "ללא" })).toBeNull();
  });
});
