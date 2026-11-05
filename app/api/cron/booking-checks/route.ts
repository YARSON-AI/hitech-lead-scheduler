import { runBookingChecks } from "@/lib/booking/alerts";
import { cronRoute } from "@/lib/http/cron";

export const GET = cronRoute(runBookingChecks);
