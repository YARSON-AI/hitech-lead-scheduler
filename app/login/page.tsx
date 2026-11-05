import { redirect } from "next/navigation";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { currentActor } from "@/lib/auth/actor";
import { homeFor } from "@/lib/auth/types";

export default async function LoginPage() {
  const actor = await currentActor();
  if (actor) redirect(actor.role === "manager" && actor.aal !== "aal2" ? "/login/two-step" : homeFor(actor.role));
  return <LoginScreen />;
}
