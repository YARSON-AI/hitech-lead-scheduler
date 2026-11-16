import { AlertsScreen } from "@/components/screens/StaffBookingScreens";
import { requirePage } from "@/lib/auth/actor";
import { STAFF } from "@/lib/auth/types";
import { agentDirectory } from "@/lib/integrations/airtable";
import { serverClient } from "@/lib/supabase/server";

export default async function AlertsPage() {
  await requirePage(STAFF);
  const supabase = await serverClient();
  const [{ data }, roster] = await Promise.all([
    supabase.from("alerts").select("id, kind, agent_email, agent_name, booking_id, created_at, bookings(customer_name, start_at)").is("resolved_at", null).order("created_at", { ascending: false }),
    agentDirectory(),
  ]);
  const ids = new Map(roster.map((agent) => [agent.email, agent.id]));
  return (
    <AlertsScreen
      alerts={(data ?? []).map((row) => {
        const booking = row.bookings as unknown as { customer_name: string; start_at: string } | null;
        return {
          id: row.id,
          kind: row.kind,
          agentName: row.agent_name,
          agentId: row.agent_email ? (ids.get(row.agent_email) ?? null) : null,
          bookingId: row.booking_id,
          customer: booking?.customer_name ?? null,
          start: booking?.start_at ?? null,
          createdAt: row.created_at,
        };
      })}
    />
  );
}
