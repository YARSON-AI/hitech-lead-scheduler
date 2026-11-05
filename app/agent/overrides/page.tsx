import { AgentOverridesScreen } from "@/components/screens/AgentScreens";
import { requirePage } from "@/lib/auth/actor";
import { AGENT } from "@/lib/auth/types";
import { readOverrides, upcomingBlockedHolidays } from "@/lib/schedule-read";

export default async function AgentOverridesPage() {
  const actor = await requirePage(AGENT);
  const [overrides, holidays] = await Promise.all([readOverrides(actor.agentEmail!), upcomingBlockedHolidays()]);
  return <AgentOverridesScreen overrides={overrides} holidays={holidays} />;
}
