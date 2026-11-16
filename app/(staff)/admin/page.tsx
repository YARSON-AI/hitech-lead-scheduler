import { Suspense } from "react";
import { BookingsScreen } from "@/components/screens/StaffBookingScreens";
import { requirePage } from "@/lib/auth/actor";
import { STAFF } from "@/lib/auth/types";
import type { BookingRow } from "@/lib/booking/types";
import { addDays } from "@/lib/engine/time";
import { fromWall } from "@/lib/engine/time";
import { agentDirectory } from "@/lib/integrations/airtable";
import { serverClient } from "@/lib/supabase/server";

type Search = { range?: string; q?: string; agent?: string; from?: string; to?: string };

const clean = (value: string) => value.replace(/[,()%*"\\]/g, " ").trim();
const validDate = (value?: string) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null);

export default async function BookingsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requirePage(STAFF);
  const params = await searchParams;
  const range = ["upcoming", "past", "cancelled"].includes(params.range ?? "") ? params.range! : "upcoming";
  const supabase = await serverClient();
  const now = new Date().toISOString();

  let query = supabase.from("bookings").select("*").limit(300);
  if (range === "cancelled") query = query.eq("status", "cancelled");
  else query = query.eq("status", "confirmed");
  if (range === "upcoming") query = query.gte("end_at", now);
  if (range === "past") query = query.lt("end_at", now);
  const q = params.q ? clean(params.q) : "";
  if (q) query = query.or(`customer_name.ilike.%${q}%,lead_number.ilike.%${q}%`);
  if (params.agent) query = query.eq("agent_email", params.agent.toLowerCase());
  const from = validDate(params.from);
  const to = validDate(params.to);
  if (from) query = query.gte("start_at", fromWall(from, "00:00").toISOString());
  if (to) query = query.lt("start_at", fromWall(addDays(to, 1), "00:00").toISOString());

  const count = async (build: (base: ReturnType<typeof baseCount>) => ReturnType<typeof baseCount>) => (await build(baseCount())).count ?? 0;
  const baseCount = () => supabase.from("bookings").select("id", { count: "exact", head: true });
  const [{ data }, upcoming, past, cancelled, roster] = await Promise.all([
    query.order("start_at", { ascending: range === "upcoming" }),
    count((base) => base.eq("status", "confirmed").gte("end_at", now)),
    count((base) => base.eq("status", "confirmed").lt("end_at", now)),
    count((base) => base.eq("status", "cancelled")),
    agentDirectory(),
  ]);

  return (
    <Suspense>
      <BookingsScreen
        rows={(data ?? []) as BookingRow[]}
        counts={{ upcoming, past, cancelled }}
        agentOptions={roster.map((agent) => ({ value: agent.email, label: agent.name })).sort((a, b) => a.label.localeCompare(b.label, "he"))}
        range={range}
      />
    </Suspense>
  );
}
