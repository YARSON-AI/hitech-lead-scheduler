import { LinkNewScreen } from "@/components/screens/LinkScreens";
import { requirePage } from "@/lib/auth/actor";
import { STAFF } from "@/lib/auth/types";
import { specializationList } from "@/lib/integrations/airtable";

export default async function NewLinkPage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  await requirePage(STAFF);
  const { lead } = await searchParams;
  const specializations = await specializationList();
  return (
    <LinkNewScreen
      role="staff"
      initialLead={lead && /^\d{1,20}$/.test(lead) ? lead : undefined}
      listHref="/admin/links"
      specializations={specializations.map((row) => ({ value: row.name, label: row.name }))}
    />
  );
}
