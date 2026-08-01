-- Drop unique indexes on stripe columns
DROP INDEX IF EXISTS "Subscription_stripeCustomerId_key";
DROP INDEX IF EXISTS "Subscription_stripeSubscriptionId_key";

-- Drop stripe columns from Subscription
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "stripeCustomerId";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "stripeSubscriptionId";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "stripePriceId";
