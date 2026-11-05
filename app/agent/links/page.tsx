import { LinksScreen } from "@/components/screens/LinkScreens";
import { requirePage } from "@/lib/auth/actor";
import { AGENT } from "@/lib/auth/types";
import { readLinks } from "@/lib/booking/links-read";

export default async function AgentLinksPage() {
  await requirePage(AGENT);
  return <LinksScreen role="agent" rows={await readLinks()} newHref="/agent/links/new" agentOptions={[]} />;
}
