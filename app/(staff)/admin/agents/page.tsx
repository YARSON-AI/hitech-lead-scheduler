import { AgentsScreen } from "@/components/screens/StaffAgentScreens";
import { requirePage } from "@/lib/auth/actor";
import { MANAGER } from "@/lib/auth/types";
import { agentRows } from "@/lib/booking/agent-rows";
import { specializationList } from "@/lib/integrations/airtable";

export default async function AgentsPage() {
  await requirePage(MANAGER);
  const [rows, specializations] = await Promise.all([agentRows(), specializationList()]);
  return <AgentsScreen rows={rows} specializations={specializations.map((row) => ({ value: row.name, label: row.name }))} />;
}
