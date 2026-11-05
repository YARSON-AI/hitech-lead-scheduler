import { z } from "zod";
import { setPasswordWithToken } from "@/lib/auth/accounts";
import { PASSWORD_RULE } from "@/lib/auth/types";
import { ApiError, clientIp, hitRateLimit, publicRoute } from "@/lib/http/route";

const schema = z.strictObject({ token: z.string().min(20).max(200), password: z.string().max(200) });

export const POST = publicRoute({ schema }, async ({ body, request }) => {
  if (!(await hitRateLimit(`set-password:${clientIp(request)}`, 20, 300))) {
    throw new ApiError(429, "rate_limited", "יותר מדי ניסיונות. נסה/י שוב בעוד מספר דקות.");
  }
  if (!PASSWORD_RULE.test(body.password)) {
    throw new ApiError(400, "weak_password", "לפחות 10 תווים, אות גדולה ואות קטנה באנגלית וספרה");
  }
  if (!(await setPasswordWithToken(body.token, body.password))) {
    throw new ApiError(410, "dead_link", "הקישור אינו בתוקף");
  }
});
