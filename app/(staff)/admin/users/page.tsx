import { UsersScreen } from "@/components/screens/UsersScreen";
import { requirePage } from "@/lib/auth/actor";
import { listUsers } from "@/lib/auth/accounts";
import { MANAGER } from "@/lib/auth/types";

export default async function UsersPage() {
  const actor = await requirePage(MANAGER);
  return <UsersScreen rows={await listUsers(actor)} />;
}
