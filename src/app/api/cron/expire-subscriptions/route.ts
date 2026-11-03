import { withCronAuth } from "@/lib/cron/auth";
import { expireSubscriptions } from "@/lib/cron/expire-subscriptions";

export const GET = withCronAuth(
  () => expireSubscriptions(),
  "expire-subscriptions"
);