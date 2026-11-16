import { notFound } from "next/navigation";
import { BookingDetailScreen } from "@/components/screens/StaffBookingScreens";
import { requirePage } from "@/lib/auth/actor";
import { STAFF } from "@/lib/auth/types";
import type { BookingEvent, BookingRow } from "@/lib/booking/types";
import { serverClient } from "@/lib/supabase/server";

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage(STAFF);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await serverClient();
  const [{ data }, { data: events }] = await Promise.all([
    supabase.from("bookings").select("*").eq("id", id).neq("status", "failed").maybeSingle(),
    supabase.from("booking_events").select("*").eq("booking_id", id).order("created_at"),
  ]);
  if (!data) notFound();
  return <BookingDetailScreen booking={data as BookingRow} events={(events ?? []) as BookingEvent[]} />;
}
