import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OperationLogsModule } from './operation-logs/operation-logs.module';
import { SubjectsModule } from './subjects/subjects.module';
import { AccountsModule } from './accounts/accounts.module';
import { CounterpartiesModule } from './counterparties/counterparties.module';
import { TransactionsModule } from './transactions/transactions.module';
import { BankStatementsModule } from './bank-statements/bank-statements.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { ReceivablesModule } from './receivables/receivables.module';
import { PayablesModule } from './payables/payables.module';
import { FundModule } from './fund/fund.module';
import { ReportsModule } from './reports/reports.module';
import { UploadModule } from './upload/upload.module';
import { FinancingModule } from './financing/financing.module';
import { ShareholdersModule } from './shareholders/shareholders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    OperationLogsModule,
    SubjectsModule,
    AccountsModule,
    CounterpartiesModule,
    TransactionsModule,
    BankStatementsModule,
    ReconciliationModule,
    ReceivablesModule,
    PayablesModule,
    FundModule,
    ReportsModule,
    UploadModule,
    FinancingModule,
    ShareholdersModule,
  ],
})
export class AppModule {}
