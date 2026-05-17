-- CreateEnum
CREATE TYPE "FinancingType" AS ENUM ('LOAN', 'CREDIT_LINE', 'BILL', 'OTHER');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'REPAYING', 'CLOSED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "RepayStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateTable
CREATE TABLE "credit_lines" (
    "id" SERIAL NOT NULL,
    "bank_name" VARCHAR(100) NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "used_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "available_amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'CNY',
    "start_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "interest_rate" DECIMAL(5,2),
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_contracts" (
    "id" SERIAL NOT NULL,
    "contract_no" VARCHAR(50) NOT NULL,
    "credit_line_id" INTEGER,
    "bank_name" VARCHAR(100) NOT NULL,
    "type" "FinancingType" NOT NULL DEFAULT 'LOAN',
    "amount" DECIMAL(15,2) NOT NULL,
    "interest_rate" DECIMAL(5,2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "term_months" INTEGER NOT NULL,
    "repayment_method" VARCHAR(20) NOT NULL,
    "purpose" TEXT,
    "collateral" TEXT,
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repayment_plans" (
    "id" SERIAL NOT NULL,
    "loan_contract_id" INTEGER NOT NULL,
    "installment_no" INTEGER NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "principal" DECIMAL(15,2) NOT NULL,
    "interest" DECIMAL(15,2) NOT NULL,
    "status" "RepayStatus" NOT NULL DEFAULT 'PENDING',
    "paid_date" TIMESTAMP(3),
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repayment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repayment_records" (
    "id" SERIAL NOT NULL,
    "repayment_plan_id" INTEGER NOT NULL,
    "loan_contract_id" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "principal" DECIMAL(15,2) NOT NULL,
    "interest" DECIMAL(15,2) NOT NULL,
    "penalty" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pay_date" TIMESTAMP(3) NOT NULL,
    "payment_account" VARCHAR(50),
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repayment_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financing_costs" (
    "id" SERIAL NOT NULL,
    "loan_contract_id" INTEGER NOT NULL,
    "cost_type" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "occur_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financing_costs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loan_contracts_contract_no_key" ON "loan_contracts"("contract_no");

-- AddForeignKey
ALTER TABLE "loan_contracts" ADD CONSTRAINT "loan_contracts_credit_line_id_fkey" FOREIGN KEY ("credit_line_id") REFERENCES "credit_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repayment_plans" ADD CONSTRAINT "repayment_plans_loan_contract_id_fkey" FOREIGN KEY ("loan_contract_id") REFERENCES "loan_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repayment_records" ADD CONSTRAINT "repayment_records_repayment_plan_id_fkey" FOREIGN KEY ("repayment_plan_id") REFERENCES "repayment_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repayment_records" ADD CONSTRAINT "repayment_records_loan_contract_id_fkey" FOREIGN KEY ("loan_contract_id") REFERENCES "loan_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financing_costs" ADD CONSTRAINT "financing_costs_loan_contract_id_fkey" FOREIGN KEY ("loan_contract_id") REFERENCES "loan_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
