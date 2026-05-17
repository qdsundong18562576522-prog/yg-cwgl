-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('INITIAL_CONTACT', 'DOCUMENTS', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "financing_plans" (
    "id" SERIAL NOT NULL,
    "bank_name" VARCHAR(100) NOT NULL,
    "type" "FinancingType" NOT NULL DEFAULT 'LOAN',
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'INITIAL_CONTACT',
    "contact_person" VARCHAR(50),
    "contact_phone" VARCHAR(20),
    "expected_date" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "interest_rate" DECIMAL(5,2),
    "term_months" INTEGER,
    "fail_reason" TEXT,
    "timeline" TEXT,
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financing_plans_pkey" PRIMARY KEY ("id")
);
