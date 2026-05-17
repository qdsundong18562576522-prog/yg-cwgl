import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReconciliationService {
  constructor(private prisma: PrismaService) {}

  // Auto-match bank statement items with internal transactions
  async autoMatch(accountId: number) {
    const unmatchedItems = await this.prisma.bankStatementItem.findMany({
      where: { accountId, matchStatus: 'UNMATCHED' },
    });

    const unmatchedTransactions = await this.prisma.transaction.findMany({
      where: { accountId, reconciliationStatus: 'UNRECONCILED' },
    });

    let matchedCount = 0;
    for (const item of unmatchedItems) {
      const match = unmatchedTransactions.find(tx =>
        Math.abs(Number(tx.amount) - Number(item.amount)) < 0.01 &&
        Math.abs(tx.date.getTime() - item.transactionDate.getTime()) < 86400000 * 3
      );
      if (match) {
        await this.prisma.bankStatementItem.update({
          where: { id: item.id },
          data: {
            matchedTransactionId: match.id,
            matchStatus: 'AUTO_MATCHED',
            matchDate: new Date(),
          },
        });
        await this.prisma.transaction.update({
          where: { id: match.id },
          data: { reconciliationStatus: 'RECONCILED' },
        });
        matchedCount++;
      }
    }
    return { matchedCount, total: unmatchedItems.length };
  }

  // Manual match a bank statement item with a transaction
  async manualMatch(statementItemId: number, transactionId: number) {
    await this.prisma.bankStatementItem.update({
      where: { id: statementItemId },
      data: {
        matchedTransactionId: transactionId,
        matchStatus: 'MANUALLY_MATCHED',
        matchDate: new Date(),
      },
    });
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { reconciliationStatus: 'RECONCILED' },
    });
    return { message: '匹配成功' };
  }

  // Unmatch a previously matched pair
  async unmatch(statementItemId: number) {
    const item = await this.prisma.bankStatementItem.findUnique({ where: { id: statementItemId } });
    if (item?.matchedTransactionId) {
      await this.prisma.transaction.update({
        where: { id: item.matchedTransactionId },
        data: { reconciliationStatus: 'UNRECONCILED' },
      });
    }
    await this.prisma.bankStatementItem.update({
      where: { id: statementItemId },
      data: { matchedTransactionId: null, matchStatus: 'UNMATCHED', matchDate: null },
    });
    return { message: '已取消匹配' };
  }

  // Get reconciliation summary for an account in a period
  async getReconciliation(accountId: number, period: string) {
    const account = await this.prisma.bankAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new Error('账户不存在');

    const bankItems = await this.prisma.bankStatementItem.findMany({
      where: { accountId },
      include: { matchedTransaction: true },
    });
    const transactions = await this.prisma.transaction.findMany({
      where: { accountId },
    });

    const bankBalance = Number(account.balance);
    const bankTotalIn = bankItems.filter(i => Number(i.amount) > 0).reduce((s, i) => s + Number(i.amount), 0);
    const bankTotalOut = bankItems.filter(i => Number(i.amount) < 0).reduce((s, i) => s + Math.abs(Number(i.amount)), 0);

    const bookTotalIn = transactions.filter(t => t.direction === 'IN').reduce((s, t) => s + Number(t.amount), 0);
    const bookTotalOut = transactions.filter(t => t.direction === 'OUT').reduce((s, t) => s + Number(t.amount), 0);
    const bookBalance = bookTotalIn - bookTotalOut;

    const matchedBankItems = bankItems.filter(i => i.matchStatus !== 'UNMATCHED');
    const matchedBankAmount = matchedBankItems.reduce((s, i) => s + Number(i.amount), 0);
    const matchedTransactions = transactions.filter(t => t.reconciliationStatus === 'RECONCILED');
    const matchedBookAmount = matchedTransactions.reduce((s, t) => s + (t.direction === 'IN' ? Number(t.amount) : -Number(t.amount)), 0);

    const unmatchedBankItems = bankItems.filter(i => i.matchStatus === 'UNMATCHED');
    const unmatchedTransactions = transactions.filter(t => t.reconciliationStatus === 'UNRECONCILED');

    return {
      account: { id: account.id, name: account.name, accountNo: account.accountNo },
      period,
      bankBalance,
      bookBalance,
      difference: bankBalance - bookBalance,
      matchedCount: matchedBankItems.length,
      unmatchedBankCount: unmatchedBankItems.length,
      unmatchedBookCount: unmatchedTransactions.length,
      unmatchedBankItems,
      unmatchedTransactions,
    };
  }

  // Create/update reconciliation record
  async saveReconciliation(data: { accountId: number; period: string; bankBalance: number; bookBalance: number; remark?: string }) {
    const diff = data.bankBalance - data.bookBalance;
    const existing = await this.prisma.reconciliation.findFirst({
      where: { accountId: data.accountId, period: data.period },
    });
    if (existing) {
      return this.prisma.reconciliation.update({
        where: { id: existing.id },
        data: { bankBalance: data.bankBalance, bookBalance: data.bookBalance, difference: diff, remark: data.remark, status: 'CONFIRMED' },
      });
    }
    return this.prisma.reconciliation.create({
      data: { ...data, difference: diff, status: 'CONFIRMED' },
    });
  }

  // Get balance adjustment table (余额调节表)
  async getBalanceAdjustment(accountId: number, period: string) {
    const account = await this.prisma.bankAccount.findUnique({ where: { id: accountId } });
    const reconciliation = await this.prisma.reconciliation.findFirst({
      where: { accountId, period },
      include: { adjustments: true },
    });

    const bankItems = await this.prisma.bankStatementItem.findMany({ where: { accountId } });
    const transactions = await this.prisma.transaction.findMany({ where: { accountId } });

    const bankBalance = reconciliation?.bankBalance || Number(account?.balance || 0);
    const bookBalance = reconciliation?.bookBalance || 0;

    // Items in bank but not in book
    const bankIncomeNotRecorded = transactions.filter(t => t.direction === 'IN' && t.reconciliationStatus !== 'RECONCILED');
    const bankExpenseNotRecorded = transactions.filter(t => t.direction === 'OUT' && t.reconciliationStatus !== 'RECONCILED');

    // Items in book but not in bank
    const bookIncomeNotRecorded = bankItems.filter(i => i.matchStatus === 'UNMATCHED' && Number(i.amount) > 0);
    const bookExpenseNotRecorded = bankItems.filter(i => i.matchStatus === 'UNMATCHED' && Number(i.amount) < 0);

    const adjustedBankBalance = Number(bankBalance) +
      bankIncomeNotRecorded.reduce((s, t) => s + Number(t.amount), 0) -
      bankExpenseNotRecorded.reduce((s, t) => s + Number(t.amount), 0);

    const adjustedBookBalance = Number(bookBalance) +
      bookIncomeNotRecorded.reduce((s, i) => s + Number(i.amount), 0) -
      bookExpenseNotRecorded.reduce((s, i) => s + Math.abs(Number(i.amount)), 0);

    return {
      accountName: account?.name,
      accountNo: account?.accountNo,
      period,
      bankBalance,
      bookBalance,
      bankIncomeNotRecorded,
      bankExpenseNotRecorded,
      bookIncomeNotRecorded,
      bookExpenseNotRecorded,
      adjustedBankBalance,
      adjustedBookBalance,
      isBalanced: Math.abs(adjustedBankBalance - adjustedBookBalance) < 0.01,
      adjustments: reconciliation?.adjustments || [],
    };
  }
}
