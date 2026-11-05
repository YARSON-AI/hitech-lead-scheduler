import type { Metadata } from "next";
import { CustomerScreen } from "@/components/screens/CustomerScreen";

export const metadata: Metadata = { robots: "noindex, nofollow", referrer: "no-referrer" };

export default async function CustomerBookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <CustomerScreen token={token} />;
}
