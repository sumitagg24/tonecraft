-- AlterTable: Set paymentProvider default to dodo
ALTER TABLE "Subscription" ALTER COLUMN "paymentProvider" SET DEFAULT 'dodo';
