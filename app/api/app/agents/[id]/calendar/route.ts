import { z } from "zod";
import { MANAGER } from "@/lib/auth/types";
import { agentCalendar } from "@/lib/booking/calendar-view";
import { route } from "@/lib/http/route";

export const GET = route({ roles: MANAGER }, async ({ params, query }) => {
  const from = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(query.get("from"));
  const days = z.coerce.number().int().min(1).max(14).parse(query.get("days") ?? "7");
  return { days: await agentCalendar(z.string().min(1).max(64).parse(params.id), from, days) };
});
