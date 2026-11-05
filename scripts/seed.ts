import { createClient } from "@supabase/supabase-js";
import "./lib";
import { FIXTURE_DOMAIN, FIXTURE_LEADS, ROSTER } from "../lib/integrations/fixtures";
import { addDays, fromWall, todayInJerusalem, weekdayOf } from "../lib/engine/time";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const secret = process.env.SUPABASE_SECRET_KEY!;
const password = process.env.SEED_PASSWORD;
if (!password) throw new Error("SEED_PASSWORD is not set in .env.local");

const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

type Status = "active" | "invited" | "deactivated";
interface Account {
  email: string;
  role: "manager" | "coordinator" | "agent";
  name: string;
  status: Status;
}

const agentAccount = (index: number, status: Status): Account => ({
  email: ROSTER[index].email,
  role: "agent",
  name: ROSTER[index].name,
  status,
});

const accounts: Account[] = [
  { email: `manager@${FIXTURE_DOMAIN}`, role: "manager", name: "קארין מנהלת", status: "active" },
  { email: `coordinator@${FIXTURE_DOMAIN}`, role: "coordinator", name: "נועה מתאמת", status: "active" },
  { email: `coordinator2@${FIXTURE_DOMAIN}`, role: "coordinator", name: "הילה מתאמת", status: "invited" },
  { email: `coordinator3@${FIXTURE_DOMAIN}`, role: "coordinator", name: "רות לשעבר", status: "deactivated" },
  agentAccount(0, "active"),
  agentAccount(1, "active"),
  agentAccount(2, "active"),
  agentAccount(3, "active"),
  agentAccount(4, "invited"),
  agentAccount(5, "deactivated"),
];

async function ensureUser(account: Account): Promise<string> {
  const { data: page, error: listError } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  const existing = page.users.find((user) => user.email === account.email);
  const attrs = {
    app_metadata: { role: account.role },
    ban_duration: account.status === "deactivated" ? "87600h" : "none",
  };
  if (existing) {
    const { error } = await db.auth.admin.updateUserById(existing.id, { ...attrs, password });
    if (error) throw error;
    return existing.id;
  }
  const { data, error } = await db.auth.admin.createUser({
    email: account.email,
    password,
    email_confirm: true,
    ...attrs,
  });
  if (error) throw error;
  return data.user.id;
}

function nextWorkdays(count: number): string[] {
  const days: string[] = [];
  let date = todayInJerusalem();
  while (days.length < count) {
    date = addDays(date, 1);
    const weekday = weekdayOf(date);
    if (weekday >= 0 && weekday <= 4) days.push(date);
  }
  return days;
}

function previousWorkdays(count: number): string[] {
  const days: string[] = [];
  let date = todayInJerusalem();
  while (days.length < count) {
    date = addDays(date, -1);
    const weekday = weekdayOf(date);
    if (weekday >= 0 && weekday <= 4) days.push(date);
  }
  return days;
}

async function main() {
  const ids: Record<string, string> = {};
  for (const account of accounts) {
    const id = await ensureUser(account);
    ids[account.email] = id;
    const { error } = await db.from("profiles").upsert({
      id,
      email: account.email,
      role: account.role,
      full_name: account.name,
      agent_email: account.role === "agent" ? account.email : null,
      status: account.status,
      invited_at: new Date().toISOString(),
      activated_at: account.status === "active" ? new Date().toISOString() : null,
      deactivated_at: account.status === "deactivated" ? new Date().toISOString() : null,
    });
    if (error) throw error;
  }

  const hours = ROSTER.flatMap((agent, index) =>
    [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      agent_email: agent.email,
      weekday,
      enabled: weekday <= 4 || (weekday === 5 && index % 4 === 0),
      start_time: weekday === 5 ? "09:00" : index % 3 === 0 ? "09:00" : "10:00",
      end_time: weekday === 5 ? "13:00" : index % 3 === 1 ? "20:00" : "18:00",
    })),
  );
  const { error: hoursError } = await db.from("working_hours").upsert(hours);
  if (hoursError) throw hoursError;

  const { count } = await db.from("bookings").select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) {
    console.log("Seed: accounts and hours refreshed; bookings already exist, left as they are.");
    return;
  }

  const [d1, d2, d3, d4, d5] = nextWorkdays(5);
  await db.from("date_overrides").insert([
    { agent_email: ROSTER[0].email, date: d3, kind: "block", note: "חופשה" },
    { agent_email: ROSTER[0].email, date: d5, kind: "block", start_time: "12:00", end_time: "15:00", note: "תור לרופא" },
    { agent_email: ROSTER[1].email, date: d2, kind: "open", start_time: "20:00", end_time: "22:00" },
  ]);

  const [p1, p2, p3] = previousWorkdays(3);
  const coordinator = ids[`coordinator@${FIXTURE_DOMAIN}`];
  const lead = (index: number) => FIXTURE_LEADS[index];

  const row = (index: number, agentIndex: number, date: string, time: string, extra: Record<string, unknown> = {}) => {
    const start = fromWall(date, time);
    const leadRow = lead(index);
    const online = !extra.in_person_address;
    return {
      agent_email: ROSTER[agentIndex].email,
      agent_name: ROSTER[agentIndex].name,
      start_at: start.toISOString(),
      end_at: new Date(start.getTime() + 30 * 60000).toISOString(),
      status: "confirmed",
      profile: "regular",
      source: "staff",
      forced: false,
      in_person_address: null,
      cancelled_by: null,
      cancelled_by_user: null,
      cancelled_by_name: null,
      cancel_reason: null,
      cancelled_at: null,
      lead_number: leadRow.number,
      lead_id: leadRow.id,
      customer_id: leadRow.customerId,
      interest_name: leadRow.interestName,
      customer_name: leadRow.fullName,
      customer_email: leadRow.email,
      customer_phone: leadRow.phone,
      assignment_mode: "auto",
      assignment_reason: { position: 1, poolSize: ROSTER.length },
      booked_by: coordinator,
      booked_by_name: "נועה מתאמת",
      outlook_event_id: `stub-event-seed-${index}`,
      surense_meeting_id: `stub-surense-seed-${index}`,
      teams_join_url: online ? `https://teams.example.test/l/meetup-join/seed-${index}` : null,
      ...extra,
    };
  };

  const rows = [
    row(0, 0, d1, "10:00"),
    row(1, 0, d2, "12:00", { in_person_address: "רחוב הדוגמה 12, תל אביב", assignment_mode: "manual" }),
    row(2, 1, d1, "11:00"),
    row(3, 1, d2, "14:00", { forced: true, assignment_mode: "manual" }),
    row(4, 2, d1, "13:00", { teams_join_url: null }),
    row(5, 3, d4, "15:00"),
    row(6, 2, d3, "10:30", { source: "link" }),
    row(7, 0, p1, "10:00"),
    row(8, 1, p2, "12:00"),
    row(9, 2, p3, "15:00", {
      status: "cancelled",
      cancelled_by: "customer",
      cancelled_by_user: coordinator,
      cancelled_by_name: "נועה מתאמת",
      cancel_reason: "הלקוח ביקש לדחות",
      cancelled_at: new Date().toISOString(),
    }),
  ];
  const { data: inserted, error: bookingError } = await db.from("bookings").insert(rows).select("id, lead_number");
  if (bookingError) throw bookingError;

  const spouseFirst = row(10, 3, d2, "10:00", { profile: "regular" });
  const { data: first, error: firstError } = await db.from("bookings").insert(spouseFirst).select("id").single();
  if (firstError) throw firstError;
  const spouseLead = lead(10);
  const spouseSecond = row(11, 3, d2, "10:30", {
    profile: "spouse",
    assignment_mode: "spouse",
    spouse_booking_id: first.id,
    additional_lead_number: spouseLead.number,
    additional_customer_name: spouseLead.fullName,
    additional_customer_email: spouseLead.email,
    additional_customer_phone: spouseLead.phone,
  });
  const { data: second, error: secondError } = await db.from("bookings").insert(spouseSecond).select("id").single();
  if (secondError) throw secondError;
  const second_lead = lead(11);
  await db
    .from("bookings")
    .update({
      spouse_booking_id: second.id,
      additional_lead_number: second_lead.number,
      additional_customer_name: second_lead.fullName,
      additional_customer_email: second_lead.email,
      additional_customer_phone: second_lead.phone,
    })
    .eq("id", first.id);

  const events = [...(inserted ?? []), first, second].map((booking) => ({
    booking_id: booking.id,
    action: "created",
    actor_user: coordinator,
    actor_name: "נועה מתאמת",
    actor_role: "coordinator",
    after: { seeded: true },
  }));
  const { error: eventError } = await db.from("booking_events").insert(events);
  if (eventError) throw eventError;

  await db.from("alerts").insert({
    kind: "no_teams_link",
    agent_email: ROSTER[2].email,
    agent_name: ROSTER[2].name,
    booking_id: (inserted ?? [])[4]?.id,
  });

  console.log(`Seed: ${accounts.length} accounts, ${ROSTER.length} roster agents' hours, ${events.length} bookings.`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
