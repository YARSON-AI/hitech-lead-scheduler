import { AgentMeetingsScreen } from "@/components/screens/AgentScreens";
import { requirePage } from "@/lib/auth/actor";
import { AGENT } from "@/lib/auth/types";
import type { BookingRow } from "@/lib/booking/types";
import { serverClient } from "@/lib/supabase/server";

export default async function AgentMeetingsPage() {
  await requirePage(AGENT);
  const supabase = await serverClient();
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("status", "confirmed")
    .gte("end_at", new Date().toISOString())
    .order("start_at");
  return <AgentMeetingsScreen meetings={(data ?? []) as BookingRow[]} />;
}
