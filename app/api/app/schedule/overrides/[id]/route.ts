import { z } from "zod";
import { removeOverride } from "@/lib/schedule";
import { route } from "@/lib/http/route";

export const DELETE = route({ roles: ["agent", "manager"] }, async ({ params }) => {
  await removeOverride(z.string().uuid().parse(params.id));
});
