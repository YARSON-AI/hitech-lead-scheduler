import { notFound } from "next/navigation";
import { OutboxScreen } from "@/components/screens/OutboxScreen";
import { isProductionDeployment } from "@/lib/env/guard";
import { serverEnv } from "@/lib/env/server";
import { readOutbox, readStubState } from "@/lib/integrations/stub-store";

export default async function OutboxPage() {
  if (isProductionDeployment(process.env) || serverEnv().N8N_MODE !== "stub") notFound();
  return <OutboxScreen entries={readOutbox()} state={readStubState()} />;
}
