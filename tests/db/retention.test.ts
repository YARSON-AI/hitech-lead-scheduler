import { afterAll, describe, expect, it } from "vitest";
import { admin, pgClient } from "./helpers";

const agent = "retention@example.test";
const booking = (daysAgo: number, name: string) => {
  const start = new Date(Date.now() - daysAgo * 86400000);
  return {
    agent_email: agent,
    agent_name: "synthetic",
    start_at: start.toISOString(),
    end_at: new Date(start.getTime() + 1800000).toISOString(),
    lead_number: "retention",
    customer_name: name,
    customer_email: "customer@example.test",
    customer_phone: "0500000000",
    assignment_mode: "auto",
  };
};

describe("retention job", () => {
  afterAll(async () => {
    await admin().from("bookings").delete().eq("agent_email", agent);
    await admin().from("booking_links").delete().eq("lead_number", "retention");
  });

  it("anonymises a 12-month-old booking and leaves newer ones", async () => {
    const db = admin();
    const { data } = await db.from("bookings").insert([booking(400, "old"), booking(300, "newer")]).select("id, customer_name");
    const old = data!.find((row) => row.customer_name === "old")!;
    const newer = data!.find((row) => row.customer_name === "newer")!;
    await db.from("booking_events").insert({ booking_id: old.id, action: "created", actor_role: "system", after: { email: "customer@example.test" } });
    const { error } = await db.rpc("run_retention");
    expect(error).toBeNull();
    const { data: rows } = await db.from("bookings").select("id, customer_name, customer_email, anonymised_at, lead_number").in("id", [old.id, newer.id]);
    const after = rows!.find((row) => row.id === old.id)!;
    expect(after.customer_email).toBeNull();
    expect(after.customer_name).not.toBe("old");
    expect(after.anonymised_at).not.toBeNull();
    expect(after.lead_number).toBe("retention");
    expect(rows!.find((row) => row.id === newer.id)!.customer_email).toBe("customer@example.test");
    const { data: events } = await db.from("booking_events").select("after").eq("booking_id", old.id);
    expect(events![0].after).toBeNull();
  });

  it("purges lead data from old links only", async () => {
    const db = admin();
    const make = (days: number, status: string) => ({
      token_hash: `retention-${days}-${Math.random()}`,
      lead_number: "retention",
      lead_data: { fullName: "x" },
      mode: "auto",
      created_by: "00000000-0000-0000-0000-000000000000",
      created_by_name: "x",
      expires_at: new Date(Date.now() - days * 86400000).toISOString(),
      status,
    });
    await db.from("booking_links").delete().eq("lead_number", "retention");
    const { data: created } = await db.from("booking_links").insert([make(40, "revoked"), make(5, "revoked")]).select("id, expires_at");
    await db.rpc("run_retention");
    const { data: rows } = await db.from("booking_links").select("expires_at, lead_data").in("id", created!.map((row) => row.id)).order("expires_at");
    expect(rows![0].lead_data).toBeNull();
    expect(rows![1].lead_data).not.toBeNull();
  });

  it("is not callable by signed-in roles, and audit tables still refuse changes", async () => {
    const db = await pgClient();
    await db.query("begin");
    await db.query("set local role authenticated");
    await expect(db.query("select public.run_retention()")).rejects.toThrow();
    await db.query("rollback");
    await db.query("begin");
    await db.query("set local role service_role");
    await expect(db.query("update public.booking_events set action = 'x'")).rejects.toThrow();
    await db.query("rollback");
    await db.end();
  });
});
