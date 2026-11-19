import { AgentMeetingsScreen } from "@/components/screens/AgentScreens";
import { requirePage } from "@/lib/auth/actor";
import { AGENT } from "@/lib/auth/types";
import type { BookingRow } from "@/lib/booking/types";
import { serverClient } from "@/lib/supabase/server";

export default async function AgentMeetingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requirePage(AGENT);
  const { tab } = await searchParams;
  const supabase = await serverClient();
  const now = new Date().toISOString();
  const [{ data }, { data: past }, { data: cancelled }] = await Promise.all([
    supabase.from("bookings").select("*").eq("status", "confirmed").gte("end_at", now).order("start_at"),
    supabase.from("bookings").select("*").eq("status", "confirmed").lt("end_at", now).order("start_at", { ascending: false }).limit(100),
    supabase.from("bookings").select("*").eq("status", "cancelled").order("cancelled_at", { ascending: false, nullsFirst: false }),
  ]);
  return (
    <AgentMeetingsScreen
      meetings={(data ?? []) as BookingRow[]}
      past={(past ?? []) as BookingRow[]}
      cancelled={(cancelled ?? []) as BookingRow[]}
      initialTab={tab === "cancelled" || tab === "past" ? tab : "upcoming"}
    />
  );
}
