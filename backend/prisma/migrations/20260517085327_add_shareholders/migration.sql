-- CreateEnum
CREATE TYPE "ShareholderTxType" AS ENUM ('INVESTMENT', 'LOAN', 'LOAN_REPAYMENT', 'DIVIDEND', 'WITHDRAW');

-- CreateTable
CREATE TABLE "shareholders" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "phone" VARCHAR(20),
    "id_card" VARCHAR(30),
    "shares" DECIMAL(15,2) DEFAULT 0,
    "share_ratio" DECIMAL(5,2),
    "join_date" TIMESTAMP(3),
    "remark" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shareholders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shareholder_transactions" (
    "id" SERIAL NOT NULL,
    "shareholder_id" INTEGER NOT NULL,
    "type" "ShareholderTxType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "direction" "Direction" NOT NULL,
    "trans_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shareholder_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "shareholder_transactions" ADD CONSTRAINT "shareholder_transactions_shareholder_id_fkey" FOREIGN KEY ("shareholder_id") REFERENCES "shareholders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
