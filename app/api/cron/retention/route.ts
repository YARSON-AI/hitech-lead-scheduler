import { cronRoute } from "@/lib/http/cron";
import { adminClient } from "@/lib/supabase/admin";

const monthsAgo = (months: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString();
};

export const GET = cronRoute(async () => {
  const db = adminClient();
  const { data, error } = await db.rpc("run_retention");
  if (error) throw error;
  const traces = await db.from("booking_traces").delete({ count: "exact" }).lt("created_at", monthsAgo(12));
  if (traces.error) throw traces.error;
  const lookups = await db.from("booking_traces").delete({ count: "exact" }).is("booking_id", null).lt("created_at", monthsAgo(1));
  if (lookups.error) throw lookups.error;
  return { ...data, traces: (traces.count ?? 0) + (lookups.count ?? 0) };
});
