import { LinkNewScreen } from "@/components/screens/LinkScreens";
import { requirePage } from "@/lib/auth/actor";
import { AGENT } from "@/lib/auth/types";

export default async function AgentNewLinkPage() {
  const actor = await requirePage(AGENT);
  return <LinkNewScreen role="agent" ownName={actor.name} listHref="/agent/links" specializations={[]} />;
}
