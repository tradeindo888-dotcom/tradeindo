import { withCronAuth } from "@/lib/cron/auth";
import { expireSponsorships } from "@/lib/cron/expire-sponsorships";

export const GET = withCronAuth(
  () => expireSponsorships(),
  "expire-sponsorships"
);