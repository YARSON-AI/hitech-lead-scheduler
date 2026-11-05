import { notFound } from "next/navigation";
import { StaffPickerScreen } from "@/components/screens/StaffBookingScreens";
import { requirePage } from "@/lib/auth/actor";
import { STAFF } from "@/lib/auth/types";
import { transferOptions } from "@/lib/booking/actions";
import { loadSettings } from "@/lib/booking/availability";
import type { BookingRow } from "@/lib/booking/types";
import { serverClient } from "@/lib/supabase/server";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePage(STAFF);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await serverClient();
  const { data } = await supabase.from("bookings").select("*").eq("id", id).eq("status", "confirmed").maybeSingle();
  if (!data) notFound();
  const row = data as BookingRow;
  const [settings, agentOptions] = await Promise.all([loadSettings(row.profile), transferOptions(row)]);
  return <StaffPickerScreen mode="transfer" booking={row} agentOptions={agentOptions} durationMin={settings.durationMin} windowDays={settings.windowDays} />;
}
