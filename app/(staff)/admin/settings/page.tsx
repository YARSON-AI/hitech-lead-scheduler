import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { requirePage } from "@/lib/auth/actor";
import { MANAGER } from "@/lib/auth/types";
import { serverClient } from "@/lib/supabase/server";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  await requirePage(MANAGER);
  const { year: yearParam } = await searchParams;
  const supabase = await serverClient();
  const thisYear = new Date().getFullYear();
  const year = /^\d{4}$/.test(yearParam ?? "") ? Number(yearParam) : thisYear;
  const [{ data: profiles }, { data: agency }, { data: holidays }, { data: history }, { data: last }] = await Promise.all([
    supabase.from("settings").select("*"),
    supabase.from("agency_settings").select("booking_link_validity_days").single(),
    supabase.from("holidays").select("*").gte("date", `${year}-01-01`).lte("date", `${year}-12-31`).order("date"),
    supabase.from("settings_history").select("*").order("changed_at", { ascending: false }).limit(30),
    supabase.from("holidays").select("date").order("date", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return (
    <SettingsScreen
      profiles={profiles ?? []}
      linkDays={agency?.booking_link_validity_days ?? 7}
      holidays={holidays ?? []}
      history={history ?? []}
      year={year}
      firstYear={thisYear}
      lastYear={Number(last?.date?.slice(0, 4) ?? thisYear)}
    />
  );
}
