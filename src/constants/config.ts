import { SubscriptionPlan } from "@prisma/client";

export const CALL_LIMITS_PER_MONTH: Record<SubscriptionPlan, number> = {
  HOBBY: 1000,
  PRO: 10000,
  ENTERPRISE: 100000,
};

// Rate limits per subscription plan
export const RATE_LIMITS_PER_SECOND: Record<SubscriptionPlan, number> = {
  HOBBY: 5,
  PRO: 10,
  ENTERPRISE: 25,
};