import { MANAGER } from "@/lib/auth/types";
import { route } from "@/lib/http/route";
import { profileSchema, updateProfile } from "@/lib/settings";

export const POST = route({ roles: MANAGER, schema: profileSchema }, async ({ actor, body }) => {
  await updateProfile(actor, body);
});
