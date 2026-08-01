-- AlterTable: Add generic provider fields to Subscription
ALTER TABLE "Subscription" ADD COLUMN "paymentProvider" TEXT NOT NULL DEFAULT 'stripe';
ALTER TABLE "Subscription" ADD COLUMN "providerCustomerId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "providerSubscriptionId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "providerPriceId" TEXT;
CREATE UNIQUE INDEX "Subscription_providerSubscriptionId_key" ON "Subscription"("providerSubscriptionId");