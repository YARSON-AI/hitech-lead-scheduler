import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { admin, anon, makeUser, pgClient, removeUsersLike, signIn, upgradeToAal2 } from "./helpers";

const P = "rls-";
const D = "example.test";
const agentA = `${P}agent-a@${D}`;
const agentB = `${P}agent-b@${D}`;
const coordinator = `${P}coord@${D}`;
const manager = `${P}manager@${D}`;
const gone = `${P}gone@${D}`;

let a: SupabaseClient;
let c: SupabaseClient;
let m: SupabaseClient;
let bookingA = "";
let bookingB = "";

const booking = (agent: string, hour: number) => ({
  agent_email: agent,
  agent_name: agent,
  start_at: new Date(Date.UTC(2031, 0, 5, hour)).toISOString(),
  end_at: new Date(Date.UTC(2031, 0, 5, hour, 30)).toISOString(),
  lead_number: "rls",
  customer_name: "synthetic",
  assignment_mode: "auto",
});

beforeAll(async () => {
  await removeUsersLike(P);
  await admin().from("bookings").delete().like("agent_email", `${P}%`);
  await makeUser(agentA, "agent", agentA);
  await makeUser(agentB, "agent", agentB);
  await makeUser(coordinator, "coordinator", null);
  await makeUser(manager, "manager", null);
  await makeUser(gone, "agent", gone, "deactivated");
  const { data, error } = await admin()
    .from("bookings")
    .insert([booking(agentA, 8), booking(agentB, 9)])
    .select("id, agent_email");
  if (error) throw error;
  bookingA = data.find((row) => row.agent_email === agentA)!.id;
  bookingB = data.find((row) => row.agent_email === agentB)!.id;
  await admin().from("working_hours").upsert([
    { agent_email: agentA, weekday: 0, start_time: "09:00", end_time: "17:00" },
    { agent_email: agentB, weekday: 0, start_time: "09:00", end_time: "17:00" },
  ]);
  a = await signIn(agentA);
  c = await signIn(coordinator);
  m = await signIn(manager);
});

afterAll(async () => {
  const db = admin();
  await db.from("working_hours").delete().like("agent_email", `${P}%`);
  await db.from("date_overrides").delete().like("agent_email", `${P}%`);
  await db.from("bookings").delete().like("agent_email", `${P}%`);
  await removeUsersLike(P);
});

describe("row level security", () => {
  it("is on for every public table, and no ID-number column exists", async () => {
    const db = await pgClient();
    const tables = await db.query(
      `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
    );
    expect(tables.rows).toEqual([]);
    const columns = await db.query(
      `select column_name from information_schema.columns
       where table_schema = 'public' and (column_name ilike '%id_number%' or column_name ilike '%national%')`,
    );
    expect(columns.rows).toEqual([]);
    await db.end();
  });

  it("gives an anonymous caller nothing", async () => {
    const { data } = await anon().from("bookings").select("id");
    expect(data ?? []).toEqual([]);
  });

  it("limits an agent to their own rows", async () => {
    const { data } = await a.from("bookings").select("id").in("id", [bookingA, bookingB]);
    expect(data?.map((row) => row.id)).toEqual([bookingA]);
    const hours = await a.from("working_hours").select("agent_email").like("agent_email", `${P}%`);
    expect(hours.data?.map((row) => row.agent_email)).toEqual([agentA]);
  });

  it("lets an agent write only their own hours and overrides", async () => {
    const own = await a.from("date_overrides").insert({ agent_email: agentA, date: "2031-01-06", kind: "block" });
    expect(own.error).toBeNull();
    const other = await a.from("date_overrides").insert({ agent_email: agentB, date: "2031-01-06", kind: "block" });
    expect(other.error).not.toBeNull();
    await a.from("working_hours").update({ end_time: "12:00" }).eq("agent_email", agentB);
    const { data } = await admin().from("working_hours").select("end_time").eq("agent_email", agentB).single();
    expect(data?.end_time).toBe("17:00:00");
  });

  it("gives nobody direct writes to bookings", async () => {
    const before = await admin().from("bookings").select("customer_name").eq("id", bookingA).single();
    await a.from("bookings").update({ customer_name: "changed" }).eq("id", bookingA);
    await c.from("bookings").update({ customer_name: "changed" }).eq("id", bookingA);
    const after = await admin().from("bookings").select("customer_name").eq("id", bookingA).single();
    expect(after.data).toEqual(before.data);
    const inserted = await c.from("bookings").insert(booking(agentA, 10));
    expect(inserted.error).not.toBeNull();
  });

  it("lets a coordinator read all bookings but no manager data", async () => {
    const { data } = await c.from("bookings").select("id").in("id", [bookingA, bookingB]);
    expect(data).toHaveLength(2);
    expect((await c.from("settings").select("profile")).data ?? []).toEqual([]);
    expect((await c.from("working_hours").select("agent_email").like("agent_email", `${P}%`)).data ?? []).toEqual([]);
    expect((await c.from("holidays").select("date").limit(1)).data ?? []).toEqual([]);
  });

  it("hides the link token hash from every signed-in role", async () => {
    const { error } = await c.from("booking_links").select("token_hash");
    expect(error).not.toBeNull();
  });

  it("requires the second step before manager data opens", async () => {
    expect((await m.from("settings").select("profile")).data ?? []).toEqual([]);
    await upgradeToAal2(m);
    const { data } = await m.from("settings").select("profile");
    expect(data?.map((row) => row.profile).sort()).toEqual(["regular", "spouse"]);
  });

  it("blocks a deactivated user even with a valid session", async () => {
    await admin().from("bookings").insert(booking(gone, 11));
    const client = await signIn(gone);
    expect((await client.from("bookings").select("id")).data ?? []).toEqual([]);
  });
});

describe("audit tables", () => {
  const tables = ["booking_events", "settings_history", "account_events"];
  const seed: Record<string, string> = {
    booking_events: `insert into public.booking_events (action, actor_role) values ('test', 'system')`,
    settings_history: `insert into public.settings_history (scope, field, changed_by, changed_by_name) values ('test', 'test', gen_random_uuid(), 'test')`,
    account_events: `insert into public.account_events (target_email, action) values ('t@example.test', 'test')`,
  };

  it.each(tables)("%s refuses UPDATE and DELETE for every role", async (table) => {
    const db = await pgClient();
    await db.query("begin");
    await db.query(seed[table]);
    const column = table === "settings_history" ? "field" : "action";
    for (const role of ["authenticated", "anon", "service_role", "postgres"]) {
      for (const statement of [`update public.${table} set ${column} = 'changed'`, `delete from public.${table}`]) {
        await db.query("savepoint s");
        await db.query(`set local role ${role}`);
        await expect(db.query(statement)).rejects.toThrow();
        await db.query("rollback to savepoint s");
      }
    }
    await db.query("rollback");
    await db.end();
  });

  it("refuses TRUNCATE", async () => {
    const db = await pgClient();
    await db.query("begin");
    await expect(db.query("truncate public.booking_events")).rejects.toThrow();
    await db.query("rollback");
    await db.end();
  });
});
