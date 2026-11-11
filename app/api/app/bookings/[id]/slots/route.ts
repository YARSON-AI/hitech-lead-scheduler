import { z } from "zod";
import { rescheduleSlots } from "@/lib/booking/actions";
import { route } from "@/lib/http/route";

const id = z.string().uuid();

export const POST = route({ roles: ["agent", "coordinator", "manager"], trace: "booking.reschedule-slots" }, async ({ actor, params }) => {
  return rescheduleSlots(actor, id.parse(params.id));
});
