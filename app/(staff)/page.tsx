import { connection } from "next/server";
import { LegacyHome } from "@/components/LegacyHome";
import { NewBookingScreen } from "@/components/screens/NewBookingScreen";
import { requirePage } from "@/lib/auth/actor";
import { STAFF } from "@/lib/auth/types";
import { bookingSystem } from "@/lib/env/mode";
import { airtable } from "@/lib/integrations/airtable";

export default async function Home() {
  await connection();
  if (bookingSystem() === "calcom") return <LegacyHome />;
  await requirePage(STAFF);
  const specializations = await airtable().listSpecializations();
  return <NewBookingScreen specializations={specializations.map((row) => ({ value: row.name, label: row.name }))} />;
}
