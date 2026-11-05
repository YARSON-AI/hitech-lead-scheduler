import { notFound } from "next/navigation";
import { AgentMeetingDetailScreen } from "@/components/screens/AgentScreens";
import { requirePage } from "@/lib/auth/actor";
import { AGENT } from "@/lib/auth/types";
import type { BookingRow } from "@/lib/booking/types";
import { serverClient } from "@/lib/supabase/server";

export default async function AgentMeetingPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage(AGENT);
  const { id } = await params;
  const supabase = await serverClient();
  const { data } = await supabase.from("bookings").select("*").eq("id", id).neq("status", "failed").maybeSingle();
  if (!data) notFound();
  return <AgentMeetingDetailScreen booking={data as BookingRow} />;
}
