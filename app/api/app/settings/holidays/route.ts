import { MANAGER } from "@/lib/auth/types";
import { route } from "@/lib/http/route";
import { changeHolidays, holidaySchema } from "@/lib/settings";

export const POST = route({ roles: MANAGER, schema: holidaySchema }, async ({ actor, body }) => {
  await changeHolidays(actor, body);
});
