import { z } from "zod";
import { STAFF } from "@/lib/auth/types";
import { changeCustomerEmail } from "@/lib/booking/actions";
import { route } from "@/lib/http/route";

const schema = z.strictObject({ which: z.enum(["primary", "additional"]), email: z.string().trim().toLowerCase().email().max(254) });

export const POST = route({ roles: STAFF, schema, trace: "booking.email" }, async ({ actor, body, params }) => {
  const row = await changeCustomerEmail(actor, z.string().uuid().parse(params.id), body.which, body.email);
  return { id: row.id };
});
