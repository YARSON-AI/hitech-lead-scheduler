import { notFound } from "next/navigation";
import { AgentRescheduleScreen } from "@/components/screens/AgentScreens";
import { requirePage } from "@/lib/auth/actor";
import { AGENT } from "@/lib/auth/types";
import { loadSettings } from "@/lib/booking/availability";
import type { BookingRow } from "@/lib/booking/types";
import { serverClient } from "@/lib/supabase/server";

export default async function AgentReschedulePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage(AGENT);
  const { id } = await params;
  const supabase = await serverClient();
  const { data } = await supabase.from("bookings").select("*").eq("id", id).eq("status", "confirmed").maybeSingle();
  if (!data) notFound();
  const settings = await loadSettings(data.profile);
  return <AgentRescheduleScreen booking={data as BookingRow} durationMin={settings.durationMin} windowDays={settings.windowDays} />;
}
