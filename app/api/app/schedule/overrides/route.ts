import { addOverride, overrideSchema } from "@/lib/schedule";
import { route } from "@/lib/http/route";

export const POST = route({ roles: ["agent", "manager"], schema: overrideSchema }, async ({ actor, body }) => {
  await addOverride(actor, body);
});
