import { cronRoute } from "@/lib/http/cron";
import { syncHolidays } from "@/lib/holidays/sync";

export const GET = cronRoute(syncHolidays);
