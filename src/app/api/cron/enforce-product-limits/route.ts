import { withCronAuth } from "@/lib/cron/auth";
import { enforceProductLimits } from "@/lib/cron/enforce-product-limits";

export const GET = withCronAuth(
  () => enforceProductLimits(),
  "enforce-product-limits"
);