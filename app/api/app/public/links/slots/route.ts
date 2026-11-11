import { z } from "zod";
import { linkSlots } from "@/lib/booking/links";
import { publicRoute } from "@/lib/http/route";
import { limitPublic } from "@/lib/http/public-limit";

const schema = z.strictObject({ token: z.string().min(10).max(100) });

export const POST = publicRoute({ schema, trace: "link.slots" }, async ({ body, request }) => {
  await limitPublic(request, body.token, "slots", 60, 30);
  return { slots: await linkSlots(body.token) };
});
