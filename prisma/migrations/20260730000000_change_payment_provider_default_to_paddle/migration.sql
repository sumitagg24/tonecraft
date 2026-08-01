-- AlterTable: Change paymentProvider default from stripe to paddle
ALTER TABLE "Subscription" ALTER COLUMN "paymentProvider" SET DEFAULT 'paddle';