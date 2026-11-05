import fs from "node:fs";
import { withDb } from "./lib";
import { FIXTURE_DOMAIN } from "../lib/integrations/fixtures";

const AUDIT = ["settings_history", "booking_events", "account_events"];

async function main() {
  await withDb(async (db) => {
    for (const table of AUDIT) await db.query(`alter table public.${table} disable trigger user`);
    await db.query(
      `truncate public.settings_history, public.booking_events, public.account_events, public.booking_links,
        public.alerts, public.calendar_connections, public.date_overrides, public.working_hours, private.rate_limits,
        public.bookings cascade`,
    );
    for (const table of AUDIT) await db.query(`alter table public.${table} enable trigger user`);
    await db.query(
      `update public.settings set duration_min = 30, buffer_before_min = 15, buffer_after_min = 15,
        notice_min = 240, window_days = 21, interval_min = 30`,
    );
    await db.query(`update public.agency_settings set booking_link_validity_days = 7`);
    await db.query(`delete from public.holidays where source = 'manager'`);
    await db.query(`update public.holidays set manager_edited = false where manager_edited`);
    await db.query(`delete from auth.users where email like $1`, [`%@${FIXTURE_DOMAIN}`]);
  });
  fs.rmSync(".stub-state", { recursive: true, force: true });
  console.log("Dev database reset. Run npm run db:seed next.");
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
