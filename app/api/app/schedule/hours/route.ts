import { hoursSchema, saveHours } from "@/lib/schedule";
import { route } from "@/lib/http/route";

export const POST = route({ roles: ["agent", "manager"], schema: hoursSchema }, async ({ actor, body }) => {
  await saveHours(actor, body);
});
