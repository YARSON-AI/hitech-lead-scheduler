import { STAFF } from "@/lib/auth/types";
import { buildPool, jerusalemDayInfo } from "@/lib/engine/pool";
import { route } from "@/lib/http/route";
import { airtable } from "@/lib/integrations/airtable";

export const GET = route({ roles: STAFF }, async ({ query }) => {
  const roster = await airtable().listAgents();
  const { agents } = buildPool(roster, { mode: "manual", specialization: query.get("specialization"), today: jerusalemDayInfo() });
  return { agents: agents.map((agent) => ({ value: agent.id, label: agent.name })) };
});
