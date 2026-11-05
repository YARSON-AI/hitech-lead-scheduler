import { connection } from "next/server";
import { LegacyHome } from "@/components/LegacyHome";
import { bookingSystem } from "@/lib/env/mode";

export default async function Home() {
  await connection();
  if (bookingSystem() === "calcom") return <LegacyHome />;
  return null;
}
