import { SetPasswordScreen } from "@/components/screens/SetPasswordScreen";
import { inviteIsOpen } from "@/lib/auth/accounts";

export const metadata = { referrer: "no-referrer" as const };

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const invite = t ? await inviteIsOpen(t) : null;
  return <SetPasswordScreen token={invite ? t! : null} email={invite?.email ?? null} />;
}
