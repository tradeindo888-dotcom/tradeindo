import { withCronAuth } from "@/lib/cron/auth";
import { cancelPendingSponsorships } from "@/lib/cron/cancel-pending-sponsorships";

export const GET = withCronAuth(
  () => cancelPendingSponsorships(),
  "cancel-pending-sponsorships"
);