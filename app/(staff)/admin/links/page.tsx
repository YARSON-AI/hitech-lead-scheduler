import { LinksScreen } from "@/components/screens/LinkScreens";
import { requirePage } from "@/lib/auth/actor";
import { STAFF } from "@/lib/auth/types";
import { readLinks } from "@/lib/booking/links-read";
import { agentDirectory } from "@/lib/integrations/airtable";

export default async function LinksPage() {
  await requirePage(STAFF);
  const [rows, roster] = await Promise.all([readLinks(), agentDirectory()]);
  return (
    <LinksScreen
      role="staff"
      rows={rows}
      newHref="/admin/links/new"
      agentOptions={roster.map((agent) => ({ value: agent.email, label: agent.name })).sort((a, b) => a.label.localeCompare(b.label, "he"))}
    />
  );
}
